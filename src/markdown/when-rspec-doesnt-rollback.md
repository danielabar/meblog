---
title: "When RSpec Doesn't Rollback"
featuredImage: "../images/rspec-rollback-mihaly-koles-Ec_WHv4aAno-unsplash.jpg"
description: "Learn some troubleshooting techniques with RSpec and database transactions."
date: "2022-12-01"
category: "rails"
related:
  - "Start a Rails 6 Project with RSpec"
  - "Testing Faraday with RSpec"
  - "Solving a Python Interview Question in Ruby"
---

This post will walk you through some troubleshooting techniques when [RSpec](https://rspec.info/) tests are failing due to unexpected data in the test database. I had experienced some RSpec tests that were passing the first time they ran, individually, but then failing on subsequent runs, or when run as part of the entire test suite. It turned out to be a combination of two things - not fully understanding how RSpec manages transactions, and how using or not using `let/let!` helper methods can impact this.

## Setup

The RSpec tests are part of a Rails project using the [rspec-rails](https://github.com/rspec/rspec-rails) gem. The tests also make use of the [FactoryBot](https://github.com/thoughtbot/factory_bot) and [faker](https://github.com/faker-ruby/faker) gems to create test data. This post assumes some familiarity with these tools. The other thing to know is I listen to the [Bike Shed](https://www.bikeshed.fm/) podcast, and recently there have been some discussions about not using `let`, or at least, avoid [overusing](https://thoughtbot.com/blog/lets-not) it.

The `rails_helper.rb`, which is included in every spec file configures transactions as follows:

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  # other config ...
end
```

My understanding of this setting was that data inserted into the test database *anywhere* in a test would always get rolled back, leaving the database nice and clean for the next test.

## Failing Test

Here is the troublesome test, it's for a subscription management app. It creates several different plans for an email service, exercises some code that generates the available options based on what's in the database, and then expects exactly two options to be available:

```ruby
require "rails_helper"

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

Before moving on with troubleshooting, there's a command you can run to reset the test database. This is needed to reproduce the problem of "run the test first time, it passes, subsequent runs, it fails":

```bash
# Rails 5+
bin/rails db:reset RAILS_ENV=test

# Older versions
bundle exec rake db:reset RAILS_ENV=test
```

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
BEGIN
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 19:59:17', '2022-07-27 19:59:17')
COMMIT

BEGIN
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 19:59:17', '2022-07-27 19:59:17')
COMMIT
```

The insert statements are a result of the `FactoryBot.create(:plan...)` methods run by the test. That part is expected. However, the INSERTs are being committed rather than rolled back. That is unexpected.

## Where is data created?

Taking a closer look at what the RSpec docs have to say about [transactions](https://relishapp.com/rspec/rspec-rails/docs/transactions):

> What it really means in Rails is "run every test method within a transaction." In the context of rspec-rails, it means "run every example within a transaction."

So any data created within an example will be run within a transaction and rolled back. However, is data created within a `describe` block considered part of the example? Doing some research on RSpec and rollbacks led me to this Stack Overflow [answer](https://stackoverflow.com/questions/3333743/factory-girl-rspec-doesnt-seem-to-roll-back-changes-after-each-example/24372747#24372747). The sentence in particular:

> ... use transactional fixtures will clear the DB as long as you created the data in the example itself. before :all do ... end is considered outside of the example, because the data remains untouched across multiple examples. Whatever you create in before :all you have to delete in after :all.

Although my test wasn't using a `before` block, this got me wondering whether data created in a `describe` block is considered *outside* of the example? To answer this question, I modified the test to move the data creation into the `it` block:

```ruby
require "rails_helper"

describe "my test class" do
  it "some test" do
    FactoryBot.create(:plan, recurring_interval: "month", service_type: "email")
    FactoryBot.create(:plan, recurring_interval: "year", service_type: "email")

    result = Plan.generate_options(service_type: "email")
    # expects exactly two options: a monthly plan and a yearly plan
  end
end
```

After running this version of the test, I checked the test database to see if it was clean - and it was. This time there were no records left in the `plans` table after the test run:

```
mysql -u root -D myapp_test
mysql> SELECT COUNT(*) FROM plans;
0
```

I also checked what got generated in the `log/test.log` file. This time both inserts into the `plans` table are wrapped in named transactions using [SAVEPOINT](https://dev.mysql.com/doc/refman/8.0/en/savepoint.html), and rolled back at the end of the test:

```
BEGIN

SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 20:59:17', '2022-07-27 20:59:17')
RELEASE SAVEPOINT active_record_1

SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 20:59:17', '2022-07-27 20:59:17')
RELEASE SAVEPOINT active_record_1

ROLLBACK
```

## Multiple Tests with Same Data

Good, so creating the data in the `it` block solves this problem. But what if there are other tests in the same test file and `describe` block that also need this data?

### Repeat Data Creation

One way to solve for this would be to repeat the test data creation in each test that needs it. Since transactional fixtures are enabled, the database inserts will be rolled back at the end of each example so each test will get a clean start. I've also added some temporary logging statements at the beginning of each test, which will help in identifying each run in the `log/test.log`:

```ruby
require "rails_helper"

describe "my test class" do
  it "some test" do
    Rails.logger.info("SOME TEST")

    FactoryBot.create(:plan, recurring_interval: "month", service_type: "email")
    FactoryBot.create(:plan, recurring_interval: "year", service_type: "email")

    result = Plan.generate_options(service_type: "email")
    # expects exactly two options: a monthly plan and a yearly plan
  end

  it "some other test" do
    Rails.logger.info("SOME OTHER TEST")

    FactoryBot.create(:plan, recurring_interval: "month", service_type: "email")
    FactoryBot.create(:plan, recurring_interval: "year", service_type: "email")
    # ...
  end
end
```

The `log/test.log` from this test run confirms a transaction is created and rolled back for each example:

```
BEGIN
SOME TEST
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 21:59:17', '2022-07-27 21:59:17')
RELEASE SAVEPOINT active_record_1
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 21:59:18', '2022-07-27 21:59:18')
RELEASE SAVEPOINT active_record_1
ROLLBACK

BEGIN
SOME OTHER TEST
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 21:59:19', '2022-07-27 21:59:19')
RELEASE SAVEPOINT active_record_1
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 21:59:20', '2022-07-27 21:59:20')
RELEASE SAVEPOINT active_record_1
ROLLBACK
```

### Use Describe and Let

But then I wondered whether use of the [let](https://relishapp.com/rspec/rspec-core/docs/helper-methods/let-and-let) helper method could also solve for this, to avoid having to repeat the data creation statements in each example. In the test below, the data creation has been moved out of each `it` block and into the `describe` block, but using the `let!` helper method. I'm using the "bang" version of it to force execution because these tests need the data to already be there. Otherwise, the regular version `let` is lazily evaluated:

```ruby
require "rails_helper"

describe "my test class" do
  let!(:monthly_plan) { FactoryBot.create(:plan, recurring_interval: "month", service_type: "email") }
  let!(:annual_plan) { FactoryBot.create(:plan, recurring_interval: "year", service_type: "email") }

  it "some test" do
    Rails.logger.info("SOME TEST")
    result = Plan.generate_options(service_type: "email")
    # expects exactly two options: a monthly plan and a yearly plan
  end

  it "some other test" do
    Rails.logger.info("SOME OTHER TEST")
    # ...
  end
end
```

This version of the test also passed, even on repeated runs. Taking a look at the `log/test.log` after this test run, the data creation happens before the logging statements and is repeated for each test, but this time, it does get included in the transaction, even though it occurs in the `describe` block. This is the effect of using the `let!` helper:

```
BEGIN
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 22:59:17', '2022-07-27 22:59:17')
RELEASE SAVEPOINT active_record_1
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 22:59:18', '2022-07-27 22:59:18')
RELEASE SAVEPOINT active_record_1
SOME TEST
ROLLBACK

BEGIN
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'month', '2022-07-27 22:59:19', '2022-07-27 22:59:19')
RELEASE SAVEPOINT active_record_1
SAVEPOINT active_record_1
Plan Create INSERT INTO `plans` (`service_type`, `recurring_interval`, `created_at`, `updated_at`)
             VALUES ('email', 'year', '2022-07-27 22:59:20', '2022-07-27 22:59:20')
RELEASE SAVEPOINT active_record_1
SOME OTHER TEST
ROLLBACK
```

The [docs](https://relishapp.com/rspec/rspec-core/docs/helper-methods/let-and-let) for the `let/let!` helper methods say:

> The value will be cached across multiple calls in the same example but not across examples.

Which explains why the inserts are running repeatedly for each test. But what was less clear to me was that using the `let/let!` helper moves the execution of the logic into the transaction and therefore gets rolled back. Recall when the data creation was run in the `describe` block without the use of `let/let!` helper, it ran outside of each test transaction and got committed.

## Which is Better?

So the problem of ensuring created data is rolled back can be solved in two ways. Either specify the data creation right in each example that needs it, i.e. in the `it` block, OR, if multiple tests need the same data, it can be created up one level in the `describe`, but then it must use the `let/let!` helper methods.

Given the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) principle, it's tempting to say the better solution is to move the data creation up into `describe` block so it doesn't need to be repeated for each test. However, this has no impact on test performance because the data will still be created and rolled back for each example (as we saw earlier in the `log/test.log` file).

Also "DRYing" up the tests can make them harder to read as it requires scrolling up to the top of the test file to understand where data, variables etc were defined. For a small test file maybe this isn't a big deal but can become an issue as the number of tests grow.

<aside class="markdown-aside">
A full discussion of optimal test design, is outside the scope of this post, but if you're interested in this topic, check out this Stack Overflow discussion on <a class="markdown-link" href="https://stackoverflow.com/questions/6453235/what-does-damp-not-dry-mean-when-talking-about-unit-tests">DAMP vs DRY</a> and an <a class="markdown-link" href="https://www.globalapptesting.com/engineering/lets-take-a-closer-look-at-the-tests-created-in-rspec">RSpec specific take</a> on DRY and let.
</aside>

## Conclusion

This post has covered some troubleshooting techniques you can use when RSpec tests are failing due to data not being cleaned up from the test database. Using these techniques, we have discovered that the `let/let!` helper methods have the effect of including any data created as part of the example's transaction. We also briefly touched on test design as to where data creation should be located.