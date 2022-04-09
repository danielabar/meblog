---
title: "Rails Enums with MySQL or Postgres"
featuredImage: "../images/enum-jake-hills-0hgiQQEi4ic-unsplash.jpg"
description: "Learn how to add enums to a Rails model backed by either MySQL or Postgres."
date: "2022-05-02"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

This post will walk you through the steps to add an enum to a Rails model, backed by either a MySQL or Postgres database. If you're not familiar with enums, an example will be more illuminating than the official definition.

Suppose you're building a recurring subscription service. This will need a `Plan` model that each subscription is associated with. The plan will have a column `recurring_interval` to indicate how frequently the plan renews. Specifically, the service offers yearly, monthly, weekly and daily plans. When a customer purchases a subscription, the code must calculate the renewal date based on the Plan's `recurring_interval`. You can imagine some conditional logic checking the value of this column, if it's `year`, add a year to the purchase date, if it's `month`, add a month and so on.

In this case, it's important that the `recurring_interval` only contain one of a specific list of values: `year`, `month`, `week`, or `day`. If an unexpected value such as `foo` or `fortnight` was persisted in the `Plans` table, then the code wouldn't know how to calculate the subscriptions' renewal date. This is a perfect use case for enums. On the database side, enums provide data integrity to restrict a column to one of a list of values. Here is the official definition for [MySQL](https://dev.mysql.com/doc/refman/5.7/en/enum.html) and [PostgreSQL](https://www.postgresql.org/docs/14/datatype-enum.html).

## Database Migration

The first step to implement an enum in your Rails project will be to generate a migration to add the column. I'm assuming the `Plan` table and model already exist. Start from a terminal and enter the following command to generate a migration to add the `recurring_interval` column to the `Plans` table:

```
bin/rails generate migration AddRecurringIntervalToPlans
```

This will generate a file similar to the following, your ActiveRecord version may be different depending on your Rails version:

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb

class AddRecurringIntervalToPlans < ActiveRecord::Migration[6.0]
  def change
  end
end
```

The syntax required to use enums is not supported by the Ruby migration DSL, therefore, it requires use of `execute` to run raw SQL. We also have to explicitly define the `up` and `down` methods since Rails won't automatically know how to reverse the raw SQL in the `execute` block.

Update the generated migration as follows for MySQL:

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb

# MySQL
class AddRecurringIntervalToPlans < ActiveRecord::Migration[6.0]
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
class AddRecurringIntervalToPlans < ActiveRecord::Migration[6.0]
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
If you're using the <a href="https://docs.rubocop.org/rubocop-rails/" class="markdown-link">rubocop-rails</a> gem with the default settings, you may encounter a lint error on the SQL heredoc not using the <a href="https://docs.rubocop.org/rubocop-rails/cops_rails.html#railssquishedsqlheredocs" class="markdown-link">squish</a> method. In this case, you can go ahead and append ".squish" to the SQL heredocs in the migration as suggested by the linter to. Just be aware that some PostgreSQL syntax such as comments and functions do require newlines to be preserved so you may not always want this, but that's not an issue for the simple syntax used in this migration. See the Ruby <a href="https://www.rubydoc.info/github/rubyworks/facets/String%3Asquish" class="markdown-link">String docs</a> for more details about the squish method.
</aside>

One last thing to know before running the migration, is that you must set the `schema_format` to be `:sql` in your application config in order for the enum definition to be captured in the schema file:

```ruby
# config/application.rb
config.active_record.schema_format = :sql
```

This will generate file `db/structure.sql` instead of the default `db/schema.rb` file, which should be committed. This has to do with the use of raw SQL in the migration. The [Active Record Migrations Guide](https://edgeguides.rubyonrails.org/active_record_migrations.html) has a great explanation:

> `db/schema.rb` cannot express everything your database may support such as triggers, sequences, stored procedures, etc. While migrations may use execute to create database constructs that are not supported by the Ruby migration DSL, these constructs may not be able to be reconstituted by the schema dumper. If you are using features like these, you should set the schema format to :sql in order to get an accurate schema file that is useful to create new database instances.

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

Ok, now that the enum is defined in the database, let's see the effect on model creation in the Rails console.

TBD:
Create a model with a valid recurring_type, check valid?, save - good.
Create a model with an invalid recurring_type, check valid? save - bad - model looks valid according to rails but get sql error. Will fix in next section...

## Model Validation

TBD: Use ActiveRecord `enum` macro...