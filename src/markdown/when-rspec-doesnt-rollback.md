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

The RSpec tests are part of a Rails project using the [rspec-rails](https://github.com/rspec/rspec-rails) gem. The tests also make use of the [FactoryBot](https://github.com/thoughtbot/factory_bot) and [faker](https://github.com/faker-ruby/faker) gems to create test data. This post assumes some familiarity with these tools. The other thing to know is I listen to the [Bike Shed](https://www.bikeshed.fm/) podcast, and recently there have been some discussions about not using [let](https://relishapp.com/rspec/rspec-core/docs/helper-methods/let-and-let), or at least, avoid [overusing](https://thoughtbot.com/blog/lets-not) it.

The `rails_helper.rb`, which is included in every spec file specifies the use of transactional fixtures as follows:

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  # other config ...
end
```

My understanding of this setting was that data inserted into the test database *anywhere* in a test would always get rolled back, leaving the database nice and clean for the next test.

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

Next step in troubleshooting was to inspect the `log/test.log` file at the project root. By default, when tests run, all activity that would normally be displayed in the terminal when a Rails server is running, gets saved in this log file. This includes database inserts. Let's see if it reveals any clues as to what's going on with the database when this test is running.

Here is the relevant portion of the file from running this test:

```
 (0.3ms)  BEGIN
Plan Create (0.7ms)  INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
                      VALUES ('email', 'month', '2022-07-27 19:59:17', '2022-07-27 19:59:17')
 (1.9ms)  COMMIT
 (0.3ms)  BEGIN
Plan Create (0.4ms)  INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
                      VALUES ('email', 'year', '2022-07-27 19:59:17', '2022-07-27 19:59:17')
 (1.7ms)  COMMIT
```

That doesn't look right, the `INSERT` statements are wrapped in a transaction as expected, but they're being committed rather than rolled back.

## Where is data created?

Doing some research led me to this Stack Overflow [answer](https://stackoverflow.com/questions/3333743/factory-girl-rspec-doesnt-seem-to-roll-back-changes-after-each-example/24372747#24372747). The key here being:

> ... will clear the DB as long as your created the data in the example itself. before :all do ... end is considered outside of the example, because the data remains untouched across multiple examples. Whatever you create in before :all you have to delete in after :all.

This got me wondering whether data created in a `describe` block is considered outside of the example. To answer this question, I modified the test to move the data creation into the `it` block:

```ruby
describe "my test class" do
  it "some test" do
    FactoryBot.create(:plan, recurring_interval: "month", service_type: "email")
    FactoryBot.create(:plan, recurring_interval: "year", service_type: "email")

    result = Plan.generate_options(service_type: "email")
    # expects exactly two options: a monthly plan and a yearly plan
  end
end
```

After running this version of the test, I checked the test database to see if it was clean - and it was, you can see this time there were no records left in the `plans` table after the test run:

```
mysql -u root -D myapp_test
mysql> SELECT COUNT(*) FROM plans;
0
```

I also checked what got generated in the `log/test.log` file. This time you can see that both inserts into the `plans` table are wrapped in a transaction which gets rolled back at the end of the test:

```
 (0.6ms)  BEGIN
 (0.3ms)  SAVEPOINT active_record_1
Plan Create (0.7ms)  INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
                      VALUES ('email', 'month', '2022-07-27 20:59:17', '2022-07-27 20:59:17')
 (0.3ms)  (0.3ms)  RELEASE SAVEPOINT active_record_1
 (0.3ms)  SAVEPOINT active_record_1
Plan Create (0.4ms)  INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
                      VALUES ('email', 'year', '2022-07-27 20:59:17', '2022-07-27 20:59:17')
 (0.4ms)  RELEASE SAVEPOINT active_record_1
 (1.3ms)  ROLLBACK
```

## Multiple Tests with Same Data

Good, so creating the data in the `it` block solves this problem. But what if there are other tests in the same test file and `describe` block that also need this data?

**TBD**

- check constraints/unique on Plan model (unique on name but also using Faker as name wasn't important to these tests)
- mention about resetting test db after each run during troubleshooting to get a clean start