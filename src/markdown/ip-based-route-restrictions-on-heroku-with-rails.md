---
title: "IP-Based Route Restrictions on Heroku with Rails"
featuredImage: "../images/securing-routes-heroku-rails-arpad-czapp-eXZQIKHj5lY-unsplash.jpg"
description: "Learn how to restrict admin routes to VPN IP addresses on Heroku using Rails Advanced Route Constraints."
date: "2026-07-01"
category: "rails"
related:
  - "Datadog APM for Rails on Heroku"
  - "Some Elegance with Rails Caching"
  - "Rails CORS Middleware For Multiple Resources"
---

The Rails app I maintain at work has an admin area used for handling customer requests — things like account adjustments, refunds, and data corrections. For a long time, only a handful of staff had access, which worked fine when request volume was low. But as the customer base grew, so did the volume of support requests. It was getting overwhelming for the small number of people to handle alongside their regular work. This was resolved by adding a dedicated Customer Support role in the app, assigned to everyone in the Customer Success team.

That solved the capacity problem, but it also meant a much larger group of people with admin credentials — a bigger attack surface should any credentials leak. We decided to require VPN to access any admin route. Even with valid credentials, these routes would not be reachable without being connected to the VPN.

Our app runs on Heroku. Heroku's router is fully managed — there's no way to add firewall rules, IP filters, or WAF rules at the router itself. Every HTTP request that hits the app's public URL gets forwarded to a dyno, so the application code is essentially also the firewall.

**Managed Options on Heroku**

Heroku does offer some managed options: [Private Spaces](https://devcenter.heroku.com/articles/private-spaces-trusted-ip-ranges) provide infrastructure-level IP filtering via "trusted IP ranges," but the restriction applies to all traffic for the entire Space (it can't scope it to specific routes), and pricing starts at ~$1,000/month. [Expedited WAF](https://devcenter.heroku.com/articles/expeditedwaf) is an add-on that sits at the edge (so blocked requests never reach a dyno) and includes a Page Protection feature that can restrict specific URLs like `/admin` to an IP allowlist. It starts at ~$95/month and requires routing your domain's DNS through the WAF.

For a small company without dedicated ops, the recurring cost and additional infrastructure complexity of these options may not be justified. This post walks through a lighter-weight approach: implementing the restriction directly in the Rails app.

**Prerequisite: Static VPN IP Addresses**

Before diving into the implementation, one important prerequisite: this approach requires your company's VPN to route traffic through a stable list of known egress IP addresses. If your VPN assigns dynamic or rotating egress IPs, you'd need a different strategy.

## Rails Advanced Route Constraints

The solution has a few moving parts, but the core idea is to use a [Rails Advanced Route Constraint](https://guides.rubyonrails.org/routing.html#advanced-constraints) to wrap the entire `/admin` namespace. A route constraint is any object that responds to `matches?(request)` and returns a boolean. If it returns `true`, the routes inside the `constraints` block are accessible. If it returns `false`, Rails treats them as if they don't exist and returns a 404.

Our constraint checks the client's IP address against a configurable allowlist of VPN egress IPs, backed by a YAML config file for per-environment IP lists.

Here's how the pieces fit together:

1. **YAML config** defines the allowed VPN IPs per environment (and a bypass keyword for dev/test)
2. **Constraint class** implements `matches?(request)` — checks the client IP against the allowlist
3. **Route wiring** wraps the admin namespace with the constraint

## The Implementation

### Configuration

The VPN IP allowlist lives in a YAML config file, following the standard Rails `config_for` pattern:

```yaml
# config/admin_vpn_allowlist.yml

default: &default
  allowed_ips:
    # The IP addresses in this example are from RFC 5737 documentation ranges,
    # reserved specifically for use in examples so they'll never collide with real servers.
    # https://www.rfc-editor.org/rfc/rfc5737
    - "198.51.100.10"
    - "203.0.113.42"
    - "192.0.2.77"

development:
  allowed_ips:
    - "all"

test:
  allowed_ips:
    - "all"

production:
  <<: *default
```

A few things to note here:

**The `"all"` keyword** for development and test means the constraint class (shown in the next section) doesn't need any environment-checking conditionals. It simply checks if `"all"` is in the list.

**VPN IPs are version-controlled.** Changes go through PRs with code review and leave an audit trail in git history. You could also define these as a comma-separated environment variable, but for a small, stable list like VPN egress IPs, keeping them in source was simpler — one less thing to configure per environment.

**Environment inheritance via YAML anchors** (`<<: *default`) keeps production in sync with the default list while allowing per-environment overrides if ever needed.

### Constraint Class

This is the core of the implementation:

```ruby
# lib/constraints/vpn_ip_constraint.rb

module Constraints
  class VpnIpConstraint
    def initialize
      @config = Rails.application.config_for(:admin_vpn_allowlist)
    end

    def matches?(request)
      return true if allow_all?

      client_ip = request.remote_ip
      allowed = allowed?(client_ip)

      log_blocked_request(request, client_ip) unless allowed

      allowed
    end

    private

    attr_reader :config

    def allow_all?
      allowed_ips.include?("all")
    end

    def allowed_ips
      @allowed_ips ||= config[:allowed_ips] || []
    end

    def allowed?(ip)
      allowed_ips.include?(ip)
    end

    def log_blocked_request(request, client_ip)
      Rails.logger.warn(
        "[VPN Constraint] Blocked admin access - " \
        "IP: #{client_ip}, Path: #{request.path}"
      )
    end
  end
end
```

A few design decisions of note:

**Fail-closed security.** If `allowed_ips` is empty or nil (due to a misconfiguration or missing config), the `|| []` default means nobody gets through. The secure default is to block, not to allow.

**Logging blocked requests** at warning level feeds into our Datadog monitoring. We can see who's being blocked, from where, and how often.

**`request.remote_ip`** handles `X-Forwarded-For` parsing for us. Heroku's router adds the client's IP to this header, and Rails extracts it.

### Wiring Into Routes

The constraint wraps the entire admin namespace:

```ruby
# config/routes.rb

constraints Constraints::VpnIpConstraint.new do
  namespace :admin do
    resources :customers
    # ...
  end
end
```

When `matches?` returns false, Rails treats the routes inside the block as non-existent and returns a 404. This is also a security advantage: anyone outside the VPN can't even confirm these routes exist.

### Testing

The constraint is tested at two levels.

**1. Unit tests** cover the IP matching logic and fail-closed edge cases. Here's a trimmed version — the full spec also covers the `"all"` keyword:

```ruby
RSpec.describe Constraints::VpnIpConstraint do
  subject(:constraint) { described_class.new }

  let(:request) do
    instance_double(ActionDispatch::Request,
      remote_ip: client_ip, path: "/admin")
  end
  let(:client_ip) { "192.168.1.100" }

  context "when IP restriction is active" do
    before do
      allow(Rails.application).to receive(:config_for)
        .with(:admin_vpn_allowlist)
        .and_return(allowed_ips: ["203.0.113.10", "203.0.113.11"])
    end

    context "when client IP matches an allowed IP" do
      let(:client_ip) { "203.0.113.10" }

      it "returns true" do
        expect(constraint.matches?(request)).to be true
      end
    end

    context "when client IP does not match" do
      let(:client_ip) { "192.168.1.100" }

      it "returns false" do
        expect(constraint.matches?(request)).to be false
      end

      it "logs a warning with IP and path" do
        allow(Rails.logger).to receive(:warn)
        constraint.matches?(request)
        expect(Rails.logger).to have_received(:warn).with(
          "[VPN Constraint] Blocked admin access - " \
          "IP: 192.168.1.100, Path: /admin"
        )
      end
    end
  end

  context "when allowed_ips is empty" do
    before do
      allow(Rails.application).to receive(:config_for)
        .with(:admin_vpn_allowlist)
        .and_return(allowed_ips: [])
    end

    it "returns false (fail-closed)" do
      expect(constraint.matches?(request)).to be false
    end
  end

  context "when allowed_ips is nil" do
    before do
      allow(Rails.application).to receive(:config_for)
        .with(:admin_vpn_allowlist)
        .and_return(allowed_ips: nil)
    end

    it "returns false (fail-closed)" do
      expect(constraint.matches?(request)).to be false
    end
  end
end
```

**2. Integration tests** verify that admin routes return 404 when the constraint blocks access:

```ruby
RSpec.describe "Admin VPN Restriction" do
  let(:admin_user) { create(:admin) }

  before { sign_in(admin_user) }

  context "when constraint denies access" do
    before do
      # Needed because constraint is instantiated when routes are loaded, not when test runs
      allow_any_instance_of(Constraints::VpnIpConstraint)
        .to receive(:matches?).and_return(false)
    end

    it "blocks access to admin routes (returns 404)" do
      get admin_users_path
      expect(response).to have_http_status(:not_found)
    end
  end
end
```

The integration test stubs `matches?` directly rather than internal methods like `allow_all?` or `allowed?`. This decouples the test from implementation details, as the internal IP matching logic is already covered in the unit tests.

## Rollout

After verifying on staging, we deployed to production. The rollout was mostly uneventful — the only hiccup was a few people messaging on Slack that admin seemed broken, having forgotten it now required VPN. We updated the internal docs to mention the requirement and that was that.

One thing to keep in mind: since the restriction lives in application code, blocked requests still hit a dyno before getting a 404. For most apps that's negligible, and the simplicity of the approach — a single constraint class and a YAML file — makes it a practical fit for Heroku apps that need route-level IP restrictions without infrastructure-level tooling.
