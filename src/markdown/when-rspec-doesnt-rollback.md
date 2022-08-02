---
title: "When RSpec Doesn't Rollback"
featuredImage: "../images/rspec-rollback-mihaly-koles-Ec_WHv4aAno-unsplash.jpg"
description: "Learn some troubleshooting techniques with RSpec and database transactions."
date: "2022-11-01"
category: "rails"
related:
  - "Start a Rails 6 Project with RSpec"
  - "Testing Faraday with RSpec"
  - "Solving a Python Interview Question in Ruby"
---

This post will walk you through some troubleshooting techniques when [RSpec](https://rspec.info/) tests are failing due to unexpected data in the test database. I had experienced some RSpec tests that were passing the first time they ran, individually, but then failing on subsequent runs, or when run as part of the entire test suite. It turned out to be a combination of two things - not fully understanding how RSpec manages transactions, and how using or not using `let/let!` helper methods can impact this.

## Setup

The RSpec tests are part of a Rails project, and use [FactoryBot](https://github.com/thoughtbot/factory_bot) to create test data. This post assumes some familiarity with these tools. The other thing to know is I listen to the [Bike Shed](https://www.bikeshed.fm/) podcast, and recently there have been some discussions about not using [let](https://relishapp.com/rspec/rspec-core/docs/helper-methods/let-and-let), or at least, avoid [overusing](https://thoughtbot.com/blog/lets-not) it.

The `rails_helper.rb`, which is included in every spec file configures the use of transactional fixtures as follows:

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  # other config ...
end
```

My understanding of this setting was that any data inserted into the test database *anywhere* in a test would always get rolled back, leaving the database nice and clean for the next test.

## Failing Test

Here is the troublesome test, it's for a subscription management app, and so it creates several different plan for an email service, exercises some code that generates the available options based on what's in the database, and then expects exactly two options to be available:

```ruby
describe "my test class" do
  FactoryBot.create(:plan, recurring_interval: "month", service_type: "email")
  FactoryBot.create(:plan, recurring_interval: "year", service_type: "email")

  it "some test" do
    result = Plan.generate_options(service_type: "email")
    # expects exactly two options: a monthly plan and a yearly plan
  end
end
```

This test would pass when run individually and the first time but fail on subsequent runs. Also when run as part of a suite, other tests that also depended on exactly two options being available were failing. The failures were all due to more plans being available in the database than expected. For example, 4 instead of 2, and on the next run, 6 instead of 2, and so on.

## Test Database

My first step in troubleshooting was to connect to the test database (this project uses MySQL) and see what's in the `plans` table upon completion of a test run. This project does not run seeds against the test database, therefore the `plans` table should be empty after tests run, since any data created during the test should have been rolled back.

Check your projects `config/database.yml` to determine the name of the test database. By default, if your development database is named `myapp`, then the test database will be `myapp_test`.

```
mysql -u root -D myapp_test
mysql> SELECT COUNT(*) FROM plans;
2
```

That's not right, the count should have returned 0. I ran the test again, then the count returned 4. This confirms that the plan data inserted during the test is not being rolled back, but why?

## Test Log

Next step in troubleshooting was to inspect the `log/test.log` file. By default, when tests run, all activity that would normally be displayed in the terminal when a Rails server is running, gets saved in this log file. This includes database inserts so maybe it will have some clues as to what's going on with the database when this test is running.

**TBD**

- check constraints/unique on Plan model
- mention about resetting test db after each run during troubleshooting to get a clean start