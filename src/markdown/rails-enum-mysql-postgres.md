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

The first step to implement an enum in your Rails project will be to generate a migration to add the column. I'm assuming the Plan table and model already exist. Start from a terminal and enter the following command to generate a migration to add the `recurring_interval` column to the `Plans` table:

```
bin/rails generate migration AddRecurringIntervalToPlans
```

This will generate a file similar to the following (your ActiveRecord version may be different depending on your Rails version):

```ruby
# db/migrate/20220407103112_add_recurring_interval_to_plans.rb\

class AddRecurringIntervalToPlans < ActiveRecord::Migration[6.0]
  def change
  end
end
```