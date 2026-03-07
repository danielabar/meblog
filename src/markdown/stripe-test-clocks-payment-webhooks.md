---
title: "Beyond Mocked Payloads: End-to-End Stripe Webhook Testing"
featuredImage: "../images/stripe-webhook-testing-towfiqu-barbhuiya-bwOAixLG0uc-unsplash.jpg"
description: "How to use Stripe Test Clocks and the Stripe CLI to run a real end-to-end payment failure webhook test locally — no manual dashboard clicking, no waiting weeks for retries."
date: "2026-06-01"
category: "rails"
related:
  - "Build a Rails App with Slack Part 1: OAuth"
  - "Testing Faraday with RSpec"
  - "Sustainable Feature Testing in Rails with Cucumber"
---

When your SaaS app needs to send carefully worded emails after a customer's payment fails — and different emails depending on whether they're a monthly or yearly subscriber — how do you actually test that? Not the unit tests (those are table stakes), but the real thing: Stripe sends a webhook, your app receives it, routes it, sends an email, and the email says the right thing to the right person.

The wrinkle is that payment failures don't happen all at once. Stripe retries over days and weeks — a first attempt, then several days later a second, then a third before finally cancelling the subscription. To test the full sequence for real, you'd have to wait weeks for failures to play out naturally, which is not practical for fast feedback.

I recently built a test harness that solves this, and along the way discovered a race condition that would have been invisible to any other testing approach. Here's how it works.

## The Problem

I work on a SaaS that uses Stripe to manage subscriptions and recurring payments. Customers can choose to pay monthly or yearly. When a customer's credit card fails at renewal, Stripe retries the payment up to three times over about two weeks (the exact schedule is configurable in your Stripe dashboard under Settings → Billing → Manage Failed Payments). After the third failure, Stripe cancels the subscription (also configurable).

We wanted to send a different email for each attempt:

1. **First failure**: A gentle nudge — "Hey, your payment didn't go through, please update your card"
2. **Second failure**: An urgent warning — "This is your last chance before we suspend your account"
3. **Third failure**: A closure notice — "Your account has been closed"

On top of that, monthly and yearly subscribers need different wording. Monthly subscribers' data gets deleted after a grace period. Yearly subscribers' data is preserved indefinitely. That's six distinct emails (3 attempts x 2 billing periods), and getting the wrong one to the wrong person at the wrong time is a bad customer experience.

**The Stack:**

The app is a Rails monolith: Action Mailer for emails, Sidekiq for background jobs, and rake tasks for the test harness automation. Stripe API calls use the official `stripe` gem.

## Stripe Webhooks

When events happen in Stripe — a payment succeeds, a subscription is canceled, an invoice fails — Stripe can notify your application by sending an HTTP POST request to a URL you configure. This is a webhook. You choose which events you care about from Stripe's extensive list, and Stripe sends you a JSON payload describing what happened.

For our case, the key event is `invoice.payment_failed`. The payload includes the customer ID, the attempt count (1, 2, or 3), and details about the invoice.

The Rails app has a controller endpoint that receives these webhooks and decides what to do:

```ruby
def receive
  # Signature verification omitted for clarity — see Stripe docs:
  # https://docs.stripe.com/webhooks#verify-official-libraries
  event_json = JSON.parse(request.body.read)

  if event_json['type'] == 'invoice.payment_failed'
    customer_id = event_json['data']['object']['customer']
    user = User.find_by_customer_id(customer_id)  # field name depends on your schema

    # plan_billing_period returns :monthly or :yearly from the user record
    # the specifics depend on how your app models subscriptions
    case event_json['data']['object']['attempt_count']
    when 1
      if user&.plan_billing_period == :yearly
        SubscriptionMailer.first_failure_yearly(event_json).deliver_later
      else
        SubscriptionMailer.first_failure_monthly(event_json).deliver_later
      end
    when 2
      # ... second failure routing
    when 3
      # ... closure routing
    end
  end

  head :ok
end
```

The payment failure emails are routed based on two factors: the attempt number (1, 2, or 3) and the user's billing period. Keep this routing logic in mind — it becomes important later.

But how do you test that this actually works end-to-end?

## How to Test?

Real payment failures take weeks. Stripe's retry schedule spaces out attempts over days. You can't sit around waiting for time to pass. And it's tedious to have to create a new subscriber each time, set up a valid payment method, then change to an invalid method that would fail renewal.

Unit tests with mocked payloads verify that *given this JSON, the right mailer is called*. That's necessary, but it doesn't tell you whether the real Stripe webhook payload matches what your code expects, whether the events arrive in the order you assumed, or whether your async job processing introduces timing issues.

When I first asked my AI coding assistant how to test this, it kept insisting the best approach was to `curl` a static JSON payload to my webhook endpoint:

```bash
curl -X POST http://localhost:5000/hooks \
  -H "Content-Type: application/json" \
  -d '{"type":"invoice.payment_failed","data":{"object":{"customer":"cus_xxx","attempt_count":1}}}'
```

This works for smoke-testing individual mailer methods, but it's not *real* testing. You're hand-crafting the payload, you're only testing one event in isolation, and you're completely missing the interactions between multiple webhook events that Stripe sends during a real payment failure cycle.

I wanted something better: a way to make Stripe actually simulate the entire payment failure sequence and send real webhooks to my local server.

## Stripe Tools

**Test Clocks.** A colleague pointed me to Stripe's [Test Clocks](https://docs.stripe.com/billing/testing/test-clocks) feature (also called the Simulation API). Test Clocks support a simulated environment where you can fast-forward time. You create a customer associated with the clock, give them a subscription, then advance the clock past the renewal date. Stripe simulates everything that would happen: the renewal attempt, the payment failure, the retries, the subscription cancellation. And it sends real webhooks for each event.

**Stripe CLI.** The [Stripe CLI](https://docs.stripe.com/stripe-cli) is a command-line tool that lets you interact with your Stripe account. Critically, when you run `stripe login`, you're authenticated against Stripe's **test mode** only. Everything we're doing here — the CLI, the Test Clocks, the test cards — operates entirely in test mode, so there's no risk of touching production data.

The CLI has a command that's essential for local webhook testing:

```bash
stripe listen --forward-to localhost:5000/hooks
```

This creates a temporary additional webhook endpoint that forwards events to your local development server. It doesn't replace or interfere with any webhook endpoints you've already configured in the Stripe dashboard — those continue to receive events normally. The CLI just adds your local server as an extra destination. You see the events arrive in real time in your terminal.

Together, these two tools were exactly what I needed.

## Building the Test Harness

I wrapped the workflow into a set of rake tasks, defined at `lib/tasks/test_clock.rake`.

### Create a Subscriber Destined to Fail

The setup task creates everything Stripe needs for a realistic payment renewal failure. Notice the customer starts with a valid card. We need the initial subscription to succeed — just like a real customer whose card works fine at first:

```ruby
namespace :test_clock do
  task setup: :environment do
    frozen_time = Time.current.to_i
    email = ENV.fetch("EMAIL", "testclock+#{Time.current.to_i}@localhost.test")

    # Create a test clock — this is our time machine
    test_clock = Stripe::TestHelpers::TestClock.create(
      frozen_time: frozen_time,
      name: "Payment Failure Test"
    )

    # Create a customer attached to the clock, with a GOOD payment method
    customer = Stripe::Customer.create(
      email: email,
      test_clock: test_clock.id,
      payment_method: "pm_card_visa",
      invoice_settings: { default_payment_method: "pm_card_visa" }
    )

    # ...
  end
end
```

The `test_clock: test_clock.id` parameter on the customer is the critical link. Without it, the customer exists independently of the clock and advancing time won't affect them.

Next we create a subscription for this customer:

```ruby
namespace :test_clock do
  task setup: :environment do
    # ...

    subscription = Stripe::Subscription.create(
      customer: customer.id,
      items: [{ price: stripe_price_id }],
      expand: ["latest_invoice.payment_intent"]
    )

    # ...
  end
end
```

**Where does `stripe_price_id` come from?** This will depend on your Stripe integration, but in general: Stripe uses [Products and Prices](https://docs.stripe.com/billing/subscriptions/build-subscriptions#create-pricing-model) to model what you sell. A Price defines the billing terms — amount, currency, and interval — and each one has an ID like `price_abc123`. The rake file includes a `resolve_plan_config` helper that reads the `PLAN` environment variable and maps it to the right price ID:

```ruby
namespace :test_clock do
  def resolve_plan_config
    plan_key = ENV.fetch("PLAN", "monthly")

    configs = {
      "monthly" => {
        stripe_price_id: ENV.fetch("STRIPE_MONTHLY_PRICE_ID"),
        billing_period: :monthly
      },
      "yearly" => {
        stripe_price_id: ENV.fetch("STRIPE_YEARLY_PRICE_ID"),
        billing_period: :yearly
      }
    }

    configs.fetch(plan_key)
  end
end
```

You set `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID` to the test-mode price IDs from your Stripe dashboard.

Now comes the trick. We swap the payment method to one of Stripe's [test cards that always fails](https://docs.stripe.com/testing#declined-payments):

```ruby
namespace :test_clock do
  task setup: :environment do
    # ...

    # Attach a card that will fail on future charges
    failing_pm = Stripe::PaymentMethod.attach(
      "pm_card_chargeCustomerFail",
      { customer: customer.id }
    )

    Stripe::Customer.update(customer.id, {
      invoice_settings: { default_payment_method: failing_pm.id }
    })

    # ...
  end
end
```

The subscription is active and healthy. But the next time Stripe tries to charge this customer, it will fail.

We also create a local user in our database linked to this Stripe customer, so our webhook handler can look them up by Stripe customer ID. How you model this varies — you might have a separate subscriptions table, a different field name, or additional associations. The code below shows a simple example where `User` has a `stripe_customer_id` column:

```ruby
namespace :test_clock do
  task setup: :environment do
    # ...

    user = User.create!(
      email: email,
      stripe_customer_id: customer.id,
      # ... other required fields for your User model
    )

    # ...
  end
end
```

The task saves all the IDs to a state file for subsequent steps:

```ruby
namespace :test_clock do
  task setup: :environment do
    # ...

    state = {
      clock_id: test_clock.id,
      customer_id: customer.id,
      subscription_id: subscription.id,
      user_id: user.id,
      billing_period: plan_config[:billing_period].to_s,
      frozen_time: frozen_time,
      renewal_time: subscription.current_period_end,
      current_attempt: 0
    }
    File.write(state_file_path, state.to_json)
  end
end
```

Which produces a file like this:

```json
{
  "clock_id": "clock_1RGx2kLmNoPqRs",
  "customer_id": "cus_AbCdEfGhIjKlMn",
  "subscription_id": "sub_1RGx3nOpQrStUv",
  "user_id": 12345,
  "billing_period": "monthly",
  "frozen_time": 1740825600,
  "renewal_time": 1743504000,
  "current_attempt": 0
}
```

### Fast-Forward Time

This is where Test Clocks shine. Instead of waiting a month (or a year, depending on which plan we're testing) for the subscription to renew, we just advance the clock:

```ruby
namespace :test_clock do
  task advance_past_renewal: :environment do
    state = load_state
    days_past_renewal = ENV.fetch("DAYS", "30").to_i

    renewal_time = state["renewal_time"]
    target_time = renewal_time + (days_past_renewal * 24 * 60 * 60)

    Stripe::TestHelpers::TestClock.advance(
      state["clock_id"],
      { frozen_time: target_time }
    )

    wait_for_clock_ready(state["clock_id"])

    state["frozen_time"] = target_time
    File.write(state_file_path, state.to_json)
  end
end
```

The `renewal_time` was stored in the state file during setup (from `subscription.current_period_end`). We add 30 days past that — a buffer to ensure all retries have completed. `wait_for_clock_ready`, `load_state`, and `state_file_path` are helper methods defined in the rake file:

```ruby
def wait_for_clock_ready(clock_id)
  loop do
    sleep 2
    test_clock = Stripe::TestHelpers::TestClock.retrieve(clock_id)
    break if test_clock.status == "ready"

    if test_clock.status == "internal_failure"
      puts "\nERROR: Clock advancement failed!"
      exit 1
    end
  end
end

def state_file_path
  Rails.root.join("tmp/test_clock_state.json")
end

def load_state
  JSON.parse(File.read(state_file_path))
end
```

Once the clock is ready, the updated frozen time is written back to the state file.

### Clean Up

Here's one of the nicest things about Test Clocks: when you delete the clock, Stripe automatically deletes everything that was created inside it — the customer, the subscription, the invoices, the payment intents, the charges. No test data accumulating in your Stripe test environment.

```ruby
namespace :test_clock do
  task cleanup: :environment do
    state = load_state

    Stripe::TestHelpers::TestClock.delete(state["clock_id"])

    user = User.find_by(id: state["user_id"])
    user.destroy if user
  end
end
```

Clean slate, ready to test the next plan type.

### Putting It All Together

Before running everything, here's the shape of the full rake file — all the tasks we've been building up, in one view:

```ruby
namespace :test_clock do
  task setup: :environment do
    # create test clock, customer with good card
    # create subscription (succeeds)
    # swap to failing payment method
    # create local user linked to Stripe customer
    # save IDs to tmp/test_clock_state.json
  end

  task advance_past_renewal: :environment do
    # load state, calculate target time (renewal + 30 days)
    # advance the clock, poll until ready
    # update frozen_time in state file
  end

  task cleanup: :environment do
    # delete test clock (cascades to all Stripe objects)
    # delete local user
  end
end
```

Exercising this harness requires three terminals open simultaneously:

1. **Your web server and background jobs** — `bin/dev`, which starts both the Rails app server to receive the HTTP POST requests from Stripe, and your background job processor (ours is Sidekiq).
2. **Stripe CLI webhook forwarding** — `stripe listen --forward-to localhost:5000/hooks` so that Stripe's webhooks reach your local machine
3. **The test harness commands** — where you run the rake tasks to set up test data, advance time, and clean up

The full test cycle for one plan type looks like this:

```
Terminal 3: bin/rails test_clock:setup PLAN=monthly
            bin/rails test_clock:advance_past_renewal
            → 3 emails appear in browser (letter_opener)
            bin/rails test_clock:cleanup
```

When you run `advance_past_renewal`, Stripe executes the billing cycle on their end — the subscription renewal, the payment failure, the retries, the cancellation — and sends an HTTP POST webhook to your endpoint for each event. `stripe listen` forwards those to your local server, your Rails app receives and processes them, and Sidekiq delivers the emails. In development, we use the `letter_opener` gem, which intercepts outgoing emails and opens them as browser tabs — so three tabs pop open, one for each payment failure email.

You can see all three `invoice.payment_failed` webhooks arriving in sequence in the `stripe listen` terminal — the first failure, then a bit later the second, then the third — all from a single advance command. And you can visually verify the emails: Does the first one say "Action needed: Update your payment method"? Does it mention "monthly subscription"? Is the closure email appropriately dire about data deletion?

Then repeat for `PLAN=yearly` and verify the yearly variants: does the closure email now reassure the subscriber their data is preserved? Six emails total across two plan types, each one visually verifiable in about a minute.

## Discovered Race Condition

There's one more event the webhook controller handles. When Stripe cancels a subscription after all payment retries are exhausted, it sends a `customer.subscription.deleted` event. Our app responds by running a background job to clean up the account on our end:

```ruby
def receive
  event_json = JSON.parse(request.body.read)

  if event_json['type'] == 'customer.subscription.deleted'
    customer_id = event_json['data']['object']['customer']
    AccountCloser.perform_async(customer_id)

  elsif event_json['type'] == 'invoice.payment_failed'
    # ... payment failure email routing
  end

  head :ok
end
```

`AccountCloser` is a background job that clears the user's subscription data from our database — things like resetting subscription type and status fields.

This seems straightforward. But during testing of the third failure email for yearly subscribers, I noticed something wrong: they were receiving the monthly version of the closure email — the one warning about permanent data deletion — instead of the yearly version reassuring them their data would be preserved.

The webhook logs told the story. As visible in the terminal running `stripe listen --forward-to...`, when the third payment fails, Stripe sends two events in quick succession:

```
webhook_received event_type=customer.subscription.deleted
webhook_received event_type=invoice.payment_failed
```

The subscription deletion event arrives *before* the third payment failure event. This is because our Stripe settings say "if all retries fail, cancel the subscription." So Stripe cancels first, then reports the final failure.

By the time `AccountCloser` finishes clearing the subscription data and the third `invoice.payment_failed` webhook arrives a moment later, the code that checks `user.plan_billing_period` gets `nil` back. The `else` branch fires. The yearly subscriber gets the monthly email.

This would never surface in a unit test, where you control the payload and there's no asynchronous event ordering to worry about. It would never surface with a curl-based approach, where you're sending one event at a time.

The fix was in the hooks controller: for the first and second attempts the user record is still intact, so reading `user.plan_billing_period` is fine. But for the third attempt, the data may no longer be in the database. Instead, we extract the billing period directly from the Stripe invoice payload. The invoice's line items contain the price object, which includes the billing interval:

```ruby
elsif event_json['type'] == 'invoice.payment_failed'
  customer_id = event_json['data']['object']['customer']
  user = User.find_by_customer_id(customer_id)

  case event_json['data']['object']['attempt_count']
  when 1
    if user&.plan_billing_period == :yearly
      SubscriptionMailer.first_failure_yearly(event_json).deliver_later
    else
      SubscriptionMailer.first_failure_monthly(event_json).deliver_later
    end
  when 2
    if user&.plan_billing_period == :yearly
      SubscriptionMailer.second_failure_yearly(event_json).deliver_later
    else
      SubscriptionMailer.second_failure_monthly(event_json).deliver_later
    end
  when 3
    # === Parse event payload rather than checking User model
    if billing_period_from_invoice(event_json) == :yearly
      SubscriptionMailer.third_failure_yearly(event_json).deliver_later
    else
      SubscriptionMailer.third_failure_monthly(event_json).deliver_later
    end
  end
```

Where `billing_period_from_invoice` is a private method on the controller that reads the interval from the invoice line items:

```ruby
private

def billing_period_from_invoice(event_json)
  lines = event_json.dig("data", "object", "lines", "data") || []
  subscription_line = lines.find { |line| line["type"] == "subscription" }
  return :monthly unless subscription_line

  interval = subscription_line.dig("price", "recurring", "interval")
  interval == "year" ? :yearly : :monthly
end
```

## Long-Term Value

The test harness isn't a one-time tool. It becomes part of the development workflow. From now on, whenever someone needs to:

- Change the wording of any payment failure email
- Add a new subscriber tier with different messaging
- Modify the webhook routing logic
- Update the retry schedule behavior

...they can run the full test matrix locally in a few minutes and verify everything end-to-end. No deploying to a staging environment, no manual Stripe dashboard gymnastics. Just three terminals and a rake task.

The combination of Stripe Test Clocks (for realistic time simulation), the Stripe CLI (for local webhook forwarding), and letter_opener (for instant email preview) creates a feedback loop that's almost as fast as running unit tests, but with the fidelity of a production environment.

One other takeaway: AI coding assistants will sometimes anchor on the simplest possible answer. It's worth pushing past it to discover if a more thorough approach exists.

## Summary

Here are all the tools that make this work, and what each one contributes:

| Tool | Role |
|------|------|
| [Stripe Test Clocks](https://docs.stripe.com/billing/testing/test-clocks) | Fast-forward time to trigger real payment failures |
| [Stripe CLI](https://docs.stripe.com/stripe-cli) (`stripe listen`) | Forward webhooks from Stripe to localhost |
| [stripe](https://github.com/stripe/stripe-ruby) | Gem to make Stripe API calls from the rake tasks |
| [letter_opener](https://github.com/ryanb/letter_opener) | Gem to preview emails instantly in the browser |
| Rake tasks (`lib/tasks/test_clock.rake`) | Orchestrate setup, time advancement, and cleanup |

If your SaaS handles subscription payment failures and you want confidence that the right customer gets the right email at the right time — especially when multiple webhook events interact in ways you might not expect — I'd encourage you to explore Stripe's Test Clock API. It turned what used to be a manual, slow, error-prone process into something I can run in a few minutes and feel confident about.
