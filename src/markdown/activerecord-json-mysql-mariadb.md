---
title: "ActiveRecord JSON Column with MySQL and MariaDB"
featuredImage: "../images/mariadb-mysql-json.jpg"
description: "An important difference between MySQL and MariaDB when dealing with a JSON column type."
date: "2023-04-01"
category: "rails"
related:
  - "Rails Enums with MySQL or Postgres"
  - "Rails Strong Params for GET Request"
  - "Maximize Learning from Screencasts"
---

When using a relational database, it can be convenient to occasionally store some data as JSON in a table column. As of [MySQL 5.7.8](https://dev.mysql.com/doc/refman/5.7/en/json.html), the JSON column type is supported. It's also supported in [MariaDB](https://mariadb.org/documentation/). In theory, MySQL and MariaDB are 100% compatible, but it turns out, there's an important difference to be aware of when using the JSON column type in a Rails project with ActiveRecord.

## Background

The Rails project I'm working on has developers using MySQL on their laptops. As part of a [platform migration](../nomad-tips-and-tricks), the database in all deployed environments was changed to MariaDB. There are a number of [benefits](https://mariadb.com/resources/blog/why-should-you-migrate-from-mysql-to-mariadb/) to running MariaDB in production over MySQL. Given that it's fully compatible with MySQL, there didn't seem to be any need to change the local environment so our laptops remain using MySQL. That is, until I ran into a surprise dealing with a JSON column.

## JSON Column

Here's a migration that creates a table with a JSON column type. Just for an example, imagine we want to store a list of the user's favorite fruits as a JSON array in the `users` table:

```ruby
class CreateUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :users do |t|
      t.string :username, null: false
      t.json :fav_fruits
      # ...
      t.timestamps
    end
  end
end
```

We can also validate that only arrays will be stored in the `fav_fruits` column with JSON schema as follows:

```json
// app/models/user/fav_fruits_schema.json
{
  "type": "array",
  "title": "The root schema",
  "default": [],
  "examples": [
    [
      1,
      2
    ]
  ],
  "additionalItems": true,
  "items": {
    "$id": "#/items",
    "anyOf": [
      {
        "$id": "#/items/anyOf/0",
        "type": "integer",
        "title": "The first anyOf schema",
        "default": 0,
        "examples": [
          1,
          2
        ]
      }
    ]
  }
}
```

And use it in the User model with a custom validate method:

```ruby
class User < ApplicationRecord
  validate :validate_fav_fruits_against_json_schema

  def validate_fav_fruits_against_json_schema
    @schema ||= File.read(Rails.root.join(Rails.root, "app", "models", "user", "fav_fruits_schema.json"))
    fav_fruits_errors = JSON::Validator.fully_validate(@schema, fav_fruits, strict: true, validate_schema: true)

    fav_fruits_errors.each do |error|
      errors.add(:fav_fruits, error)
    end
  end
end
```

## The Problem

Consider the code below that seeds a user with some data, then iterates over each of their favorite fruits:

```ruby
user = User.create(username: "alice", fav_fruits: ["apple", "orange"])
user.fav_fruits.each do |fruit|
  puts fruit
  # process fruit...
end
```

When this code is run in a Rails project using MySQL, the code behaves as expected, outputting:

```
apple
orange
```

But when the same code runs in a deployed environment that is using MariaDB, an error results:

```
undefined method `each' for "[\"apple\", \"orange\"]":String (NoMethodError)
```

If you would like to see the problem in action, clone this [demo repo](https://github.com/danielabar/maria), which runs a Rails 7 project using a MariaDB instance running in a Docker container, and try out the steps to reproduce.

## Table Contents

It looks like the problem is that in MariaDB, despite having defined the column as JSON, and having inserted an array, the value that got stored in the database is a String. We can see this by invoking the `class` method of the `fav_fruits` attribute in a project using MySQL, and then in a project using MariaDB:

First, MySQL:

```ruby
user.fav_fruits.class
# Array
```

Then MariaDB:

```ruby
user.fav_fruits.class
# String
```

## Table Schema

Looking at the schema that Rails generated when the migration was run confirms the `fav_fruits` column is indeed json:

```sql
-- db/structure.sql
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `fav_fruits` json DEFAULT NULL
)
```

<aside class="markdown-aside">
This project is using the SQL format of the schema dump rather than the default Ruby format. This is useful if you ever need to use raw SQL in a migration to execute something that isn't supported by the migration DSL. See the Rails guide on <a class="markdown-link" href="https://guides.rubyonrails.org/active_record_migrations.html#types-of-schema-dumps">migrations</a> for more details.
</aside>

But how does the schema look within each database? To check this, I'm using [DataGrip](https://www.jetbrains.com/datagrip/), which is a licensed tool but you could do the same with a command line tool or any database GUI that has a feature to show a table's schema.

Here is the schema from MySQL, focusing only on the `fav_fruits` column:

```sql
create table if not exists users
(
fav_fruits json null,
-- other columns...
);
```

So far so good, this is what we expect. But look at the schema from MariaDB:

```sql
create or replace table users
(
fav_fruits longtext collate utf8mb4_bin null,
-- other columns...
constraint fav_fruits
check (json_valid(`fav_fruits`))
)
```

With MariaDB, the `fav_fruits` column is not defined as json, rather it's defined as `longtext` with a check constraint to ensure that only valid json can be stored. This explains why a String is returned from ActiveRecord `user.fav_fruits`.

According to the MariaDB docs for the [JSON Data Type](https://mariadb.com/kb/en/json-data-type/), this is a feature, not a bug:

> JSON is an alias for LONGTEXT introduced for compatibility reasons with MySQL's JSON data type. MariaDB implements this as a LONGTEXT rather, as the JSON data type contradicts the SQL standard... In order to ensure that a valid json document is inserted, the JSON_VALID function can be used as a CHECK constraint. This constraint is automatically included for types using the JSON alias from MariaDB 10.4.3.

## Solution

In the short term, we have a situation where developer's laptops are using MySQL which will return an Array from the JSON column (given that we're only inserting array values and an appropriate JSON validator is in place). But when the same code runs in production against a MariaDB database, a String is returned.

Without changing any setup, a solution to this is to override the ActiveRecord attribute method for the JSON field `fav_fruits`, and  use the [read_attribute](https://api.rubyonrails.org/classes/ActiveRecord/AttributeMethods/Read.html#method-i-read_attribute) method from the `ActiveRecord::AttributeMethods::Read` module to retrieve the value, and convert as needed.

```ruby
class User < ApplicationRecord
  def fav_fruits
    # Retrieve the typecast value of fav_fruits from the database, which could be:
    #   1. nil
    #   2. String
    #   3. Array
    days = read_attribute(:fav_fruits)

    # 1. Not allowed to have default not null value on json column, return empty array in this case.
    return [] if days.blank?

    # 2. MariaDB: If a String is found, convert to JSON.
    return JSON.parse(days) if days.is_a?(String)

    # 3. MySQL: Otherwise, return the original value.
    days
  end
end
```

Now, anywhere in the code that `user.fav_fruits` is used, it's guaranteed to always return an Array, whether the underlying database is MySQL or MariaDB.

In the long term, a better approach is to update the local setup to use MariaDB instead of MySQL. This will avoid any future surprises of differences in implementation. With this in place, the solution is to modify the model to use ActiveRecord's [serialize](https://api.rubyonrails.org/classes/ActiveRecord/AttributeMethods/Serialization/ClassMethods.html#method-i-serialize) class method. This tells Rails that you want this column retrieved from the database as JSON:

```ruby
class User < ApplicationRecord
  serialize :fav_fruits, JSON
  # ...
end
```

With this change in place, we can again run a Rails console in the project that's using MariaDB and check the value of fav_fruits, this time its retrieved from the database as an Array rather than a String:

```ruby
u = User.find_by(username: "alice")
u.fav_fruits
# => ["apple", "orange"]

u.fav_fruits.class
# => Array
```

Overriding the `fav_fruits` method is no longer needed, unless you want to maintain the behaviour of having an empty array returned instead of nil, in which case, the User model would look like this:

```ruby
class User < ApplicationRecord
  # solution to guarantee JSON when retrieving fav_fruits from MariaDB
  serialize :fav_fruits, JSON

  # if want [] returned instead of nil
  def fav_fruits
    days = read_attribute(:fav_fruits)
    return [] if days.blank?
    super
  end
end
```

**WARNING:** Do not use the `serialize` class method when running against a database that natively supports JSON such as MySQL or Postgres. Otherwise the following error will result when inserting data:

```ruby
User.create(username: "alice", fav_fruits: ["apple", "orange"])
# activerecord-7.0.4/lib/active_record/attribute_methods/serialization.rb:117:in `block in serialize':
# Column `fav_fruits` of type ActiveRecord::Type::Json does not support `serialize` feature.
# (ActiveRecord::AttributeMethods::Serialization::ColumnNotSerializableError)
# Usually it means that you are trying to use `serialize`
# on a column that already implements serialization natively.
```

## Conclusion

This post has covered an important difference in JSON handling between MySQL and MariaDB. It showed a solution if both databases must be supported and another solution if all environments can be modified to use MariaDB. In general, it's better to have the local development environment mirror production as closely as possible to avoid surprising differences in behaviour.
