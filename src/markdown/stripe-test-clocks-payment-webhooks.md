---
title: "Beyond Mocked Payloads: End-to-End Stripe Webhook Testing"
featuredImage: "../images/PLACEHOLDER.jpg"
description: "How to use Stripe Test Clocks and the Stripe CLI to run a real end-to-end payment failure webhook test locally — no manual dashboard clicking, no waiting weeks for retries."
date: "2026-06-01"
category: "rails"
related:
  - "PLACEHOLDER related post 1"
  - "PLACEHOLDER related post 2"
  - "PLACEHOLDER related post 2"
---

When your SaaS app needs to send carefully worded emails after a customer's payment fails — and different emails depending on whether they're a monthly or yearly subscriber — how do you actually test that? Not the unit tests (those are table stakes), but the real thing: Stripe sends a webhook, your app receives it, routes it, sends an email, and the email says the right thing to the right person.

The wrinkle is that payment failures don't happen all at once. Stripe retries over days and weeks — a first attempt, then several days later a second, then a third before finally cancelling the subscription. To test the full sequence for real, you'd have to wait weeks for failures to play out naturally. That's not a workflow anyone wants.

I recently built a test harness that solves this, and along the way discovered a race condition that would have been invisible to any other testing approach. Here's how it works.

## The Problem

We're a subscription SaaS using Stripe for billing. When a customer's credit card fails at renewal, Stripe retries the payment up to three times over about two weeks (the exact schedule is configurable in your Stripe dashboard under Smart Retries). After the third failure, Stripe cancels the subscription (also configurable).

We wanted to send a different email for each attempt:

1. **First failure**: A gentle nudge — "Hey, your payment didn't go through, please update your card"
2. **Second failure**: An urgent warning — "This is your last chance before we suspend your account"
3. **Third failure**: A closure notice — "Your account has been closed"

On top of that, monthly and yearly subscribers need different wording. Monthly subscribers' data gets deleted after a grace period. Yearly subscribers' data is preserved indefinitely. That's six distinct emails (3 attempts x 2 billing periods), and getting the wrong one to the wrong person is a bad customer experience.

## The Stack

Our app is built with Ruby on Rails. Emails are sent via Action Mailer — Rails' built-in email framework. A mailer class like `SubscriptionMailer` defines methods that compose emails, and calling `.deliver_later` queues the email for asynchronous delivery through a background job processor (we use Sidekiq). Controllers handle incoming HTTP requests and respond — `head :ok` is Rails shorthand for returning an empty 200 response. The test harness uses rake tasks, which are Ruby's standard way of defining command-line automation scripts, invoked via `bin/rails`. Stripe API calls in the rake tasks use the official `stripe` Ruby gem. If you're working in a different framework, the concepts translate — you just need an HTTP endpoint, a way to send emails, and a script runner.

## What's a Webhook, Briefly

When events happen in Stripe — a payment succeeds, a subscription is canceled, an invoice fails — Stripe can notify your application by sending an HTTP POST request to a URL you configure. This is a webhook. You choose which events you care about from Stripe's extensive list, and Stripe sends you a JSON payload describing what happened.

For our case, the key event is `invoice.payment_failed`. The payload includes the customer ID, the attempt count (1, 2, or 3), and details about the invoice.

Our Rails app has a controller endpoint that receives these webhooks and decides what to do:

```ruby
def receive
  event_json = JSON.parse(request.body.read)

  if event_json['type'] == 'customer.subscription.deleted'
    customer_id = event_json['data']['object']['customer']
    CustomerExpunger.perform_async(customer_id)

  elsif event_json['type'] == 'invoice.payment_failed'
    customer_id = event_json['data']['object']['customer']
    user = User.find_by_customer_id(customer_id)

    # plan_billing_period returns :monthly or :yearly from the user record —
    # the specifics depend on how your app models subscriptions
    case event_json['data']['object']['attempt_count']
    when 1
      if user&.plan_billing_period == :yearly
        SubscriptionMailer.first_failure_yearly(event_json).deliver_later
      else
        SubscriptionMailer.first_failure_monthly(event_json).deliver_later
      end
    when 2
      # ... second failure routing (same pattern: check billing period, pick template)
    when 3
      # ... closure routing — see "The Race Condition" section below
    end
  end

  head :ok
end
```

Two things to note here. First, this endpoint handles multiple Stripe event types. The `customer.subscription.deleted` event fires when Stripe cancels a subscription (for example, after all payment retries are exhausted). When that happens, `CustomerExpunger` — a background job — clears the user's subscription data from our database. Second, the payment failure emails are routed based on both the attempt number and the user's billing period. Keep these two branches in mind — they become important later.

Note: in production, you'd verify the `Stripe-Signature` header on incoming webhooks using your webhook secret. For local testing with the Stripe CLI, this step can be skipped — the CLI handles it for you.

Simple enough in code. But how do you test that this actually works end-to-end?

## The Testing Problem

Real payment failures take weeks. Stripe's retry schedule spaces out attempts over days. You can't sit around waiting for time to pass.

Unit tests with mocked payloads verify that *given this JSON, the right mailer is called*. That's necessary, but it doesn't tell you whether the real Stripe webhook payload matches what your code expects, whether the events arrive in the order you assumed, or whether your async job processing introduces timing issues.

When I first asked my AI coding assistant how to test this, it kept insisting the best approach was to `curl` a static JSON payload to my webhook endpoint:

```bash
curl -X POST http://localhost:5000/hooks \
  -H "Content-Type: application/json" \
  -d '{"type":"invoice.payment_failed","data":{"object":{"customer":"cus_xxx","attempt_count":1}}}'
```

This works for smoke-testing individual mailer methods, but it's not *real* testing. You're hand-crafting the payload, you're only testing one event in isolation, and you're completely missing the interactions between multiple webhook events that Stripe sends during a real payment failure cycle.

I wanted something better: a way to make Stripe actually simulate the entire payment failure sequence and send real webhooks to my local server.

## Enter Stripe Test Clocks

A colleague pointed me to Stripe's [Test Clocks](https://docs.stripe.com/billing/testing/test-clocks) feature (also called the Simulation API). Test Clocks let you create a sandbox where you can fast-forward time. You create a customer, give them a subscription, then advance the clock past the renewal date. Stripe simulates everything that would happen: the renewal attempt, the payment failure, the retries, the subscription cancellation. And it sends real webhooks for each event.

This was exactly what I needed.

## The Stripe CLI

Before getting into the test harness, it's worth mentioning the [Stripe CLI](https://docs.stripe.com/stripe-cli). This is a command-line tool that lets you interact with your Stripe account. Critically, when you run `stripe login`, you're authenticated against Stripe's **test mode** only. There's no risk of accidentally touching production data. You'll also need a Stripe test mode API key configured in your app — the `stripe` gem reads this to make API calls from the rake tasks.

The CLI has a command that's essential for local webhook testing:

```bash
stripe listen --forward-to localhost:5000/hooks
```

This creates a temporary additional webhook endpoint that forwards events to your local development server. It doesn't replace or interfere with any webhook endpoints you've already configured in the Stripe dashboard — those continue to receive events normally. The CLI just adds your local server as an extra destination. You see the events arrive in real time in your terminal.

It's worth noting that Stripe lets you configure different webhook endpoints for test mode and live mode. Everything we're doing here — the CLI, the Test Clocks, the test cards — operates entirely in test mode. Your production webhook configuration and live customer data are completely untouched.

## Building the Test Harness

I wrapped the whole workflow into a set of rake tasks, living in `lib/tasks/test_clock.rake`. Each task is defined with `task setup: :environment do` — the `:environment` dependency is what loads Rails and your models, so the `Stripe::*` gem constants and your `User` model are all available. Here's the approach. You need three terminal windows running simultaneously:

1. **Your web server and background jobs** — `bin/dev`, which starts both the Rails app server and Sidekiq (the background job processor that actually sends the emails)
2. **Stripe CLI webhook forwarding** — `stripe listen --forward-to localhost:5000/hooks` so that Stripe's webhooks reach your local machine
3. **The test harness commands** — where you run the rake tasks to set up test data, advance time, and clean up

With all three running, here's what each step does.

### Step 1: Setup — Create a Subscriber Destined to Fail

The setup task creates everything Stripe needs for a realistic payment failure scenario:

```ruby
# Create a test clock — this is our time machine
test_clock = Stripe::TestHelpers::TestClock.create(
  frozen_time: Time.current.to_i,
  name: "Payment Failure Test"
)

# Create a customer attached to the clock, with a GOOD payment method
customer = Stripe::Customer.create(
  email: email,
  test_clock: test_clock.id,
  payment_method: "pm_card_visa",
  invoice_settings: { default_payment_method: "pm_card_visa" }
)
```

The `test_clock: test_clock.id` parameter on the customer is the critical link. Without it, the customer exists independently of the clock, and advancing time won't affect them — no events fire, no emails appear, and there's no error to tell you why. Everything that should live inside the simulation must be created after the clock and linked to it. This same association is also what makes cleanup automatic: when you delete the clock, Stripe automatically deletes everything attached to it.

Notice the customer starts with a valid card. We need the initial subscription to succeed — just like a real customer whose card works fine at first.

```ruby
# Create a real subscription (this succeeds)
subscription = Stripe::Subscription.create(
  customer: customer.id,
  items: [{ price: stripe_price_id }]
)
```

The `stripe_price_id` comes from an environment variable — `STRIPE_MONTHLY_PRICE_ID` or `STRIPE_YEARLY_PRICE_ID` depending on which plan you're testing. You'll find these IDs in your Stripe Dashboard under Products.

Now comes the trick. We swap the payment method to one of Stripe's [test cards that always fails](https://docs.stripe.com/testing#declined-payments):

```ruby
# Attach a card that will fail on future charges
failing_pm = Stripe::PaymentMethod.attach(
  "pm_card_chargeCustomerFail",
  { customer: customer.id }
)

Stripe::Customer.update(customer.id, {
  invoice_settings: { default_payment_method: failing_pm.id }
})
```

The subscription is active and healthy. But the next time Stripe tries to charge this customer, it will fail.

We also create a local user in our database linked to this Stripe customer, so our webhook handler can look them up by `stripe_customer_id`:

```ruby
user = User.create!(
  email: email,
  stripe_customer_id: customer.id,
  # ... other required fields for your User model
)
```

The task saves all the IDs to a state file at `tmp/test_clock_state.json` for subsequent steps:

```json
{
  "clock_id": "clock_1RGx2kLmNoPqRs",
  "customer_id": "cus_AbCdEfGhIjKlMn",
  "subscription_id": "sub_1RGx3nOpQrStUv",
  "user_id": 12345,
  "billing_period": "monthly",
  "renewal_time": 1743504000
}
```

Note that only one test can be active at a time — running setup again overwrites this file. You need to run cleanup before switching to a different plan type.

### Step 2: Fast-Forward Time

This is where Test Clocks shine. Instead of waiting a month for the subscription to renew, we just advance the clock. The task reads the `renewal_time` stored in the state file (which was set from `subscription.current_period_end` at setup), then adds 30 days as a buffer:

```ruby
target_time = renewal_time + (30 * 24 * 60 * 60)

Stripe::TestHelpers::TestClock.advance(
  clock_id,
  { frozen_time: target_time }
)
```

The 30-day buffer is intentional — it's enough to clear Stripe's full retry window regardless of plan type. Stripe processes this asynchronously: the subscription renews, the payment fails, Stripe retries according to your retry schedule, each retry fails, and eventually Stripe cancels the subscription. All three `invoice.payment_failed` webhooks arrive in sequence — the first failure, then a bit later the second, then the third — from a single advance command.

The task polls until the clock is ready:

```ruby
loop do
  sleep 2
  test_clock = Stripe::TestHelpers::TestClock.retrieve(clock_id)
  break if test_clock.status == "ready"
end
```

### Step 3: Observe the Results

With `stripe listen` running in one terminal and the Rails server in another, you see the webhooks arrive in real time. In our case, we use the `letter_opener` gem in development, which intercepts outgoing emails and opens them as browser tabs. So after advancing the clock, three browser tabs pop open — one for each payment failure email.

You can visually verify: Does the first email say "Action needed: Update your payment method"? Does the monthly version mention "monthly subscription"? Does the yearly version say "annual subscription"? Is the closure email appropriately dire for monthly subscribers and reassuring for yearly ones?

### Step 4: Clean Up

Here's one of the nicest things about Test Clocks: when you delete the clock, Stripe automatically deletes everything that was created inside it — the customer, the subscription, the invoices, the payment intents, the charges. No test data accumulating in your Stripe test environment.

```ruby
Stripe::TestHelpers::TestClock.delete(clock_id)
```

We also delete the local user that was created for the test. Clean slate, ready to test the next plan type.

### Putting It All Together

With all three terminals running, the full test cycle for one plan type looks like this:

```
Terminal 3: bin/rails test_clock:setup PLAN=monthly
            bin/rails test_clock:advance_to_renewal
            → 3 emails appear in browser (letter_opener)
            bin/rails test_clock:cleanup
```

Repeat for `PLAN=yearly`. Six emails total across two plan types, each one visually verifiable in about a minute.

## The Race Condition I Would Never Have Found Otherwise

During testing of the third failure email for yearly subscribers, I noticed something wrong: they were receiving the monthly version of the closure email — the one warning about permanent data deletion — instead of the yearly version reassuring them their data would be preserved.

The webhook logs told the story. When the third payment fails, Stripe sends two events in quick succession:

```
webhook_received event_type=customer.subscription.deleted
webhook_received event_type=invoice.payment_failed
```

The subscription deletion event arrives *before* the third payment failure event. This is because our Stripe settings say "if all retries fail, cancel the subscription." So Stripe cancels first, then reports the final failure.

Our app processes the deletion event by running a background job that clears the user's subscription data — including setting `subscription_type` to `nil`. By the time the third `invoice.payment_failed` webhook arrives a moment later, the code that checks `user.plan_billing_period` gets `nil` back. The `else` branch fires. The yearly subscriber gets the monthly email.

This would never surface in a unit test, where you control the payload and there's no asynchronous event ordering to worry about. It would never surface with a curl-based approach, where you're sending one event at a time.

The fix was straightforward: for the third attempt, instead of relying on the user record (which may already be cleared), extract the billing period directly from the Stripe invoice payload. The invoice's line items contain the price object, which includes the billing interval:

```ruby
class StripeInvoiceParser
  def self.billing_period(event_json)
    lines = event_json.dig("data", "object", "lines", "data") || []
    subscription_line = lines.find { |line| line["type"] == "subscription" }
    return :monthly unless subscription_line

    interval = subscription_line.dig("price", "recurring", "interval")
    interval == "year" ? :yearly : :monthly
  end
end
```

No extra API calls. The data is already in the webhook payload. And it works regardless of what order the events arrive in.

## Long-Term Value

The test harness isn't a one-time tool. It becomes part of the development workflow. From now on, whenever someone needs to:

- Change the wording of any payment failure email
- Add a new subscriber tier with different messaging
- Modify the webhook routing logic
- Update the retry schedule behavior

...they can run the full test matrix locally in a few minutes and verify everything end-to-end. No deploying to a staging environment, no coordinating with teammates, no manual Stripe dashboard gymnastics. Just three terminals and a rake task.

The combination of Stripe Test Clocks (for realistic time simulation), the Stripe CLI (for local webhook forwarding), and letter_opener (for instant email preview) creates a feedback loop that's almost as fast as running unit tests, but with the fidelity of a production environment.

## Summary

| Tool | Role |
|------|------|
| Stripe Test Clocks | Fast-forward time to trigger real payment failures |
| Stripe CLI (`stripe listen`) | Forward webhooks from Stripe to localhost |
| letter_opener gem | Preview emails instantly in the browser |
| Rake tasks (`lib/tasks/test_clock.rake`) | Orchestrate setup, time advancement, and cleanup |

If your SaaS handles subscription payment failures and you want confidence that the right customer gets the right email at the right time — especially when multiple webhook events interact in ways you might not expect — I'd encourage you to explore Stripe's Test Clock API. It turned what used to be a manual, slow, error-prone process into something I can run in a few minutes and trust completely.
