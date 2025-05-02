---
title: "Switching From Ruby to SQL Schema in Rails"
featuredImage: "../images/from-ruby-to-sql-schema-marek-studzinski--RDBDQuGF9k-unsplash.jpg"
description: "How to switch from Rails default schema.rb to a SQL-based structure.sql schema dump mid-project without breaking your existing setup."
date: "2025-09-01"
category: "rails"
related:
  - "Setup a Rails Project with Postgres and Docker"
  - "Efficient Database Queries in Rails: A Practical Approach"
  - "Understanding ActiveRecord Dependent Options"
---

Rails maintains a file called `schema.rb` to represent your database schema. This file is automatically updated every time you run a migration. It reflects the current structure of your database using Ruby syntax, based on the Rails migration DSL (TODO: link?). By default, this is how Rails tracks and rebuilds your schema across environments.

But sometimes you hit a limitation - like needing to use raw SQL to define database triggers, custom indexes, or other advanced database features that can't be expressed with the Rails migration DSL. That’s where SQL schema dumps come in. When using the sql schema format, instead of a `schema.rb` file being generated when migrations are run, you'll have a `structure.sql` file.

It’s easy to set up SQL schema format on day one of a Rails project - just set a config flag and you’re good. TODO link: I've written about this in my Kickstart Rails post: ../kickstart-a-new-rails-project.md

But what if you're already well into a project that uses the default Ruby format? You have dozens of migrations, a `schema.rb`, and now you need to add something the DSL can't express. Switching to SQL format mid-project isn’t hard, but it’s not immediately obvious how to do it. That’s what this post will walk you through.


## Why I Switched

On a recent project, I used the `pg_search` gem to implement PostgreSQL full-text search (FTS). For performance, this approach requires creating a database `TRIGGER` to automatically update a `tsvector` column whenever the associated data changes. This trigger logic had to be written in SQL, not Ruby.

TODO: Show migration

Rails migrations allow you to run raw SQL with `execute`, but `schema.rb` won’t capture these changes. Instead, I needed to switch to `structure.sql`, which is a full SQL dump of the database schema. Here's how I made the switch:

## Step-by-Step: Switching to SQL Schema Format

### Step 1: Tell Rails to use SQL for schema dumps

In `config/application.rb`, add:

```ruby
# Use SQL format for schema dumps
config.active_record.schema_format = :sql
```

### Step 2: Generate a fresh SQL schema

Run the following to generate a `db/structure.sql` file based on your current database:

```sh
bin/rails db:schema:dump
```

This creates a full SQL dump of your schema using `pg_dump` (if you're using PostgreSQL).

### Step 3: Delete `schema.rb`

You no longer need `db/schema.rb`, and it may cause confusion if left around:

```sh
rm db/schema.rb
```

### Step 4: Run the SQL migration

Now you can safely write a migration using raw SQL:

TODO: Actual example

```ruby
class AddSearchVectorTrigger < ActiveRecord::Migration[7.1]
  def up
    execute <<-SQL
      CREATE FUNCTION update_search_vector() RETURNS trigger AS $$
      begin
        new.search_vector :=
          to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.body, ''));
        return new;
      end
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER search_vector_update
      BEFORE INSERT OR UPDATE ON posts
      FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    SQL
  end

  def down
    execute "DROP TRIGGER IF EXISTS search_vector_update ON posts"
    execute "DROP FUNCTION IF EXISTS update_search_vector()"
  end
end
```

Run the migration with `bin/rails db:migrate`, then check `structure.sql` - it should have the new TRIGGER or whatever other content from the SQL in the migration file.

### Step 5: Verify schema loading works

Run this command to reset your database from the schema:

```sh
bin/rails db:reset
```

This drops and recreates the database and loads the schema via the SQL dump, followed by seeding.

If it works, you’re good to go! Commit the removal of `schema.rb` and the new `structure.sql`. From now on, your database schema will be expressed in SQL.

## Tip: PostgreSQL Extensions and Heroku Review Apps

Let’s say one of your migrations enables a PostgreSQL extension like `pgcrypto`:

```ruby
def change
  enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')
end
```

When working with Heroku Review Apps or any ephemeral environments, you might set up the DB with `rails db:setup` to ensure a fresh start each time. This runs `structure.sql` to load the schema, then runs seeds. But `pg_dump` includes SQL like this:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
```

The problem? Heroku pre-installs common extensions like `pgcrypto`, but your Heroku user doesn’t *own* the extension. So when the SQL tries to run `COMMENT ON EXTENSION`, you’ll get an error like:

```
psql:/app/db/structure.sql:23: ERROR:  must be owner of extension pgcrypto abc123
```

This fails your schema load and breaks setup on Heroku.

**Why This Happens**

PostgreSQL restricts operations like `COMMENT ON EXTENSION` to the *owner* of the extension. But on Heroku, your app's DB user is not the owner—Heroku is. So your SQL dump contains statements your app user doesn't have permission to execute.

**Solution: Strip Comments from Schema Dump**

Rails lets you customize the flags passed to `pg_dump` when generating `structure.sql`. To avoid these issues, configure Rails to exclude comments when dumping the structure:

Create `config/initializers/structure_dump.rb`:

TODO: Remove comments from here, will be shown in next tip section

```ruby
# frozen_string_literal: true

# Prevent pg_dump from including COMMENT ON EXTENSION lines,
# which can cause permission errors on Heroku or other hosted environments.
# See: https://guides.rubyonrails.org/active_record_postgresql.html#structure-dumps
ActiveRecord::Tasks::DatabaseTasks.structure_dump_flags = [
  "--no-comments"
]
```

Then regenerate your schema:

```sh
bin/rails db:schema:dump
```

Open `structure.sql` and confirm that the `COMMENT ON EXTENSION` lines are gone.

Now, deploying to Heroku Review App DB should work.

**Final Tip: Leave Yourself Breadcrumbs**

If you're adding initializer config like `structure_dump.rb`, add inline comments to explain why. It’s easy to forget six months later *why* a flag was added, especially in rarely-touched config files.

TODO: Show commented version here

## Wrapping Up

Switching to SQL schema format in Rails is simple and essential when you need to capture raw SQL in your migrations. It gives you full control over your database schema and avoids the limitations of the Ruby-based DSL. With a few tweaks, you can make it Heroku-friendly too.

If you're doing advanced PostgreSQL work—custom triggers, views, full-text search—consider switching early in your project. It’ll save you headaches down the line.

## TODO
* intro para
* main content
* heading/subheadings need work
* conclusion para
* edit
* aside: hair_trigger gem but concern about long term keeping up with Rails/AR (had that experience with annotate gem that stopped working as of Rails 8)
