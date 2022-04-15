---
title: "Rails Enums with MySQL or Postgres"
featuredImage: "../images/enum-jake-hills-0hgiQQEi4ic-unsplash.jpg"
description: "Learn how to add enums to a Rails model backed by either MySQL or Postgres."
date: "2022-05-01"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

This post will walk you through the steps to add an enum to a Rails model, backed by either a MySQL or Postgres database. If you're not familiar with enums, an example will be more illuminating than the official definition.

Suppose you're building a recurring subscription service. This will need a `Plan` model that each subscription is associated with. The plan will have a column `recurring_interval` to indicate how frequently the plan renews. Specifically, the service offers yearly, monthly, weekly and daily plans. When a customer purchases a subscription, the code must calculate the renewal date based on the Plan's `recurring_interval`. You can imagine some conditional logic checking the value of this column, if it's `year`, add a year to the purchase date, if it's `month`, add a month and so on.

In this case, it's important that the `recurring_interval` only contain one of a specific list of values: `year`, `month`, `week`, or `day`. If an unexpected value such as `foo` or `fortnight` was persisted in the `Plans` table, then the code wouldn't know how to calculate the subscriptions' renewal date. This is a perfect use case for enums. On the database side, enums provide data integrity to restrict a column to one of a list of values. See the [MySQL](https://dev.mysql.com/doc/refman/5.7/en/enum.html) and [PostgreSQL](https://www.postgresql.org/docs/14/datatype-enum.html) docs for a more formal definition.

I'm assuming the `Plan` table and model already exist as follows:

```ruby
# db/migrate/20220406145959_create_plans.rb

class CreatePlans < ActiveRecord::Migration
  def change
    create_table :plans do |t|
      t.string :name, null: false
      t.boolean :active, null: false, default: true
      t.string :currency, null: false, default: "USD"
      t.integer :unit_amount_cents, null: false, default: 0

      t.timestamps
    end
  end
end
```

## Database Migration

The first step to implement an enum in your Rails project will be to generate a migration to add the column. Start from a terminal and enter the following command to generate a migration to add the `recurring_interval` column to the `Plans` table:

```
bin/rails generate migration AddRecurringIntervalToPlans
```

This will generate a file similar to the following:

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb

class AddRecurringIntervalToPlans < ActiveRecord::Migration
  def change
  end
end
```

The syntax required to use enums is not supported by the Ruby migration DSL, therefore, it requires use of `execute` to run raw SQL. We also have to explicitly define the `up` and `down` methods since Rails won't automatically know how to reverse the raw SQL in the `execute` block.

Update the generated migration as follows for MySQL:

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb

# MySQL
class AddRecurringIntervalToPlans < ActiveRecord::Migration
  def up
    execute <<-SQL
      ALTER TABLE plans ADD recurring_interval ENUM('year', 'month', 'week', 'day');
    SQL
  end

  def down
    remove_column :plans, :recurring_interval
  end
end
```

The syntax for PostgreSQL is a little different as it first requires creating a custom [data type](https://www.postgresql.org/docs/14/sql-createtype.html) to define the enum, and then it can be added as a column to the table. Just like with MySQL, `execute` and explicit `up/down` methods are required:

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb

# PostgreSQL
class AddRecurringIntervalToPlans < ActiveRecord::Migration
  def up
    execute <<-SQL
      CREATE TYPE plan_recurring_interval AS ENUM ('year', 'month', 'week', 'day');
    SQL
    add_column :plans, :recurring_interval, :plan_recurring_interval
  end

  def down
    remove_column :plans, :recurring_interval
    execute <<-SQL
      DROP TYPE plan_recurring_interval;
    SQL
  end
end
```

<aside class="markdown-aside">
If you're using the <a href="https://docs.rubocop.org/rubocop-rails/" class="markdown-link">rubocop-rails</a> gem with the default settings, you may encounter a lint error <a href="https://docs.rubocop.org/rubocop-rails/cops_rails.html#railssquishedsqlheredocs" class="markdown-link">Rails/SquishedSQLHeredocs</a>, because the SQL heredoc is not using the squish method. In this case, you can go ahead and append ".squish" to the SQL heredocs in the migration as suggested by the linter to. Just be aware that some PostgreSQL syntax such as comments and functions do require newlines to be preserved so you may not always want this, but that's not an issue for the simple syntax used in this migration. See the Ruby <a href="https://www.rubydoc.info/github/rubyworks/facets/String%3Asquish" class="markdown-link">String docs</a> for more details about the squish method.
</aside>

One last thing to know before running the migration, is that you must set the `schema_format` to be `:sql` in your application config in order for the enum definition to be captured in the schema file:

```ruby
# config/application.rb
config.active_record.schema_format = :sql
```

This will generate file `db/structure.sql` instead of the default `db/schema.rb` file, which should be committed. This has to do with the use of raw SQL in the migration. The [Active Record Migrations Guide](https://edgeguides.rubyonrails.org/active_record_migrations.html) has a great explanation:

> `db/schema.rb` cannot express everything your database may support such as triggers, sequences, stored procedures, etc. While migrations may use execute to create database constructs that are not supported by the Ruby migration DSL, these constructs may not be able to be reconstituted by the schema dumper. If you are using features like these, you should set the schema format to :sql in order to get an accurate schema file that is useful to create new database instances.

At this point, you should be able to run the migration (and optionally roll it back) with:

```
bundle exec rails db:migrate
bundle exec rails db:rollback
```

After running the migration, the generated `db/structure.sql` file should specify the newly added enum column for the `plans` table.

If you're using MySQL:

```sql
-- db/structure.sql
CREATE TABLE `plans` (
  -- other columns...
  `recurring_interval` enum('year','month','week','day') DEFAULT NULL,
)
...
```

And PostgreSQL - note the `CREATE` statement to first create the custom type, and then it can be used as a table column:

```sql
-- db/structure.sql
CREATE TYPE public.plan_recurring_interval AS ENUM (
    'year',
    'month',
    'week',
    'day'
);

CREATE TABLE public.plans (
    -- other columns...
    recurring_interval public.plan_recurring_interval,
);
```

## Data Integrity

Ok, now that the enum is defined in the database, let's see the effect on model creation in the Rails console. Launch a Rails console and enter the following to create a new Plan model, set a few attributes, check for validity and save to the database:

```ruby
plan = Plan.new
plan.name = "My Test Plan"
plan.recurring_interval = "week"
plan.valid? # => true
plan.save!  # => plan saved successfully to database
```

So far so good, we created a new plan with an allowed `recurring_interval` of `week`, and it was successfully saved to the database. But what happens if we try to save an unknown `recurring_interval`, for example `fortnight`? Back in the Rails console, let's try this:

```ruby
plan_2 = Plan.new
plan_2.name = "Another Plan"
plan_2.recurring_interval = "fortnight"
plan_2.valid? # => true, hmmm... that's not right
plan_2.save! # => error
```

This time, our experience is not so great. We intentionally set an invalid value in the `recurring_interval` property of the Plan model, ActiveRecord tells us its valid when checking the `plan_2.valid?` method, but then the transaction is rolled back when trying to save the model to the database with the following error message:

```
ROLLBACK
Traceback (most recent call last):
ActiveRecord::StatementInvalid (Mysql2::Error: Data truncated for column 'recurring_interval' at row 1:
INSERT INTO `plans` (`name`, `created_at`, `updated_at`, `recurring_interval`)
VALUES ('Another plan', '2022-04-10 12:03:11', '2022-04-10 12:03:11', 'fortnight'))
```

What's happening here is we've achieved data integrity at the database level with the use of the `enum` column type. However, ActiveRecord is not aware of the existence of the enum and so it's allowing a model to be created with invalid data. For a complete experience, we also need *application* level data integrity, i.e. we want ActiveRecord to tell us the model is invalid with a useful error message rather than having to catch a MySQL (or PostgreSQL) exception. This is what we'll cover in the next section.

## Model Validation

To get ActiveRecord support, the [enum](https://edgeapi.rubyonrails.org/classes/ActiveRecord/Enum.html) macro (class level declaration) must be added to the model. Since we want these mapped as strings (rather than the default integer), we'll pass in a hash to map the enum attribute values to strings. Add the following the the `Plan` model:

```ruby
# app/models/plan.rb

class Plan < ApplicationRecord
  enum recurring_interval: {
    year: "year",
    month: "month",
    week: "week",
    day: "day"
  }
end
```

Now let's try to create a plan in the Rails console as before, with an invalid `recurring_interval`:

```ruby
plan_2 = Plan.new
plan_2.name = "Another Plan"
plan_2.recurring_interval = "fortnight"
# Traceback (most recent call last):
# ArgumentError ('fortnight' is not a valid recurring_interval)
```

Much better, this time we get an error from ActiveRecord when trying to set an invalid value for the `recurring_interval` field. ActiveRecord can tell us this value is invalid with a useful error message, without having to try to save to the database and waiting for a SQL error.

## Enum Methods

In addition to validation, the enum macro also exposes a few convenience instance methods to check and modify values. For example, given a monthly plan has been created:

```ruby
plan = Plan.create(name: "A Plan", recurring_interval: "month")
```

The `plan` instance now has boolean methods for each possible value of the `recurring_interval` enum: `year?`, `month?`, `week?`, and `day?`. Usage is as follows:

```ruby
plan.month?
=> true

plan.year?
=> false
```

The `plan` instance now also has bang methods to update the value of `recurring_interval`: `year!`, `month!`, `week!`, and `day!` and save to the database. For example:

```ruby
# Update the monthly plan to be a weekly plan
plan.week!
# Plan Update (0.3ms) UPDATE `plans` SET `updated_at` = '2022-04-11 11:31:38', `recurring_interval` = 'week' WHERE `plans`.`id` = 3
=> true

plan.week?
=> true

plan.month?
=> false
```

Note that if you call an update method when the model instance already has that value, no database update will run and the method will still return true. For example, calling `plan.week!` again will not result in an error.

## Enum Scopes

The enum macro also adds [scopes](https://www.rubyguides.com/2019/10/scopes-in-ruby-on-rails/) to the model class, one for each possible value of the enum. So the `Plan` class will have: `Plan.year`, `Plan.month`, `Plan.week`, and `Plan.day`. This allows for easy querying, such as retrieving all the monthly plans. Note that these generated scopes, like all scopes, return an [ActiveRecord::Relation](https://edgeapi.rubyonrails.org/classes/ActiveRecord/Relation.html) object.

```ruby
plan_1 = Plan.create(name: "Plan 1", recurring_interval: "month")
plan_2 = Plan.create(name: "Plan 2", recurring_interval: "month")

monthly_plans = Plan.month
# Plan Load (0.6ms) SELECT `plans`.* FROM `plans` WHERE `plans`.`recurring_interval` = `month` LIMIT 11
=> #<ActiveRecord::Relation> [...plans...]
```

## Testing

At this point, we have a fully functioning model with both database and application level validation of the `recurring_interval` value. But we're not done yet, let's add some tests to verify this feature. I'm using [RSpec](https://rspec.info/) and the [Shoulda Matchers](https://matchers.shoulda.io/) gem, which contains a lot of convenient matchers to express common validations in Rails.

The test uses the [define enum for](https://github.com/thoughtbot/shoulda-matchers/blob/main/lib/shoulda/matchers/active_record/define_enum_for_matcher.rb) matcher, together with the `with_values` qualifier to pass in a hash of the expected allowed values for the `recurring_interval` column. Finally, `backed_by_column_of_type` is appended to the matcher to assert that the column type is a string (rather than the default integer).

```ruby
# spec/models/plan_spec

describe Plan, type: :model do
  describe "validations" do
    it do
      should define_enum_for(:recurring_interval)
        .with_values(
          year: "year",
          month: "month",
          week: "week",
          day: "day"
        ).backed_by_column_of_type(:string)
    end
  end
end
```

Note that if using MySQL, the test will pass with `.backed_by_column_of_type(:string)`, however, for PostgreSQL, use `.backed_by_column_of_type(:enum)`.

<aside class="markdown-aside">
For the TDD purists in the crowd, of course you could write this test before adding the migration and enum macro to the model class, run the test, it will fail, then add the migration and update the model class, run the test again and it will pass. If you're interested in TDD, I've written about a few examples where its useful including <a class="markdown-link" href="https://danielabaron.me/blog/tdd-by-example/">Adding a New Feature</a> and <a class="markdown-link" href="https://danielabaron.me/blog/tdd-by-example-bugfix/">Fixing a Bug</a>.
</aside>

## Add a New Value

One last consideration with enums is future maintenance. What happens if a new value needs to be supported? In our Plans case, suppose there's a new business requirement to support "fortnight" (every two weeks) as a valid `recurring_interval`. This can be implemented with another migration. The new value should be added to the end of the list (for MySQL):

```
bin/rails generate migration ModifyRecurringIntervalForPlans
```

```ruby
# MySQL
class ModifyRecurringIntervalForPlans < ActiveRecord::Migration
  def up
    execute <<-SQL
        ALTER TABLE plans MODIFY recurring_interval ENUM('year', 'month', 'week', 'day', 'fortnight');
    SQL
  end

  def down
    change_column :plans, :recurring_interval, :string
  end
end
```

PostgreSQL enum's can be modified through the use of [ALTER TYPE](https://www.postgresql.org/docs/14/sql-altertype.html), which supports specifying the position of the new enum value. There is no support for removing a value, therefore the catalog tables must be used for the `down` migration:

```ruby
# PostgreSQL
class ModifyRecurringIntervalForPlans < ActiveRecord::Migration
  def up
    execute <<-SQL
        ALTER TYPE plan_recurring_interval ADD VALUE 'fortnight' AFTER 'day';
    SQL
  end

  def down
    execute <<-SQL
      DELETE FROM pg_enum WHERE enumlabel = 'fortnight' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_recurring_interval');
    SQL
  end
end
```

The model class must be modified to tell ActiveRecord that the new value should be considered valid:

```ruby
# app/models/plan.rb

class Plan < ApplicationRecord
  enum recurring_interval: {
    year: "year",
    month: "month",
    week: "week",
    day: "day",
    fortnight: "fortnight"   # new value
  }
end
```

And of course, don't forget to maintain the test. This is left as an exercise for the reader!

## Conclusion

This post has covered working with enums on a Rails project, backed by either a MySQL or PostgreSQL database. We've learned what enums are, why they're useful, how to achieve data integrity from both the database and application via ActiveRecord support, how to test, and maintain enum values. Here's another useful [blog post](https://sipsandbits.com/2018/04/30/using-database-native-enums-with-rails/) on working with enums in Rails. Finally, if you're working with PostgreSQL and would prefer to stick with `db/schema.rb`, you might like to give the [activerecord-postgres_enum](https://github.com/bibendi/activerecord-postgres_enum) gem a try. It enhances the Ruby migration DSL to support PostgreSQL enum types.