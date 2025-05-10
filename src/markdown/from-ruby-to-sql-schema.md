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

Rails maintains a file called `schema.rb` to represent the projects' database schema. This file is automatically updated every time a database migration is run. It reflects the current structure of the database using Ruby syntax, based on the [Rails migration DSL](https://api.rubyonrails.org/v8.0.2/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html). It's used to recreate the database schema quickly when running tasks like `db:setup`, `db:prepare`, or `db:reset`, without replaying the entire migration history (which may not be possible in any case on older projects).

But sometimes you hit a limitation - like needing to use raw SQL to define database triggers, custom indexes, or other advanced database features that can't be expressed with the Rails migration DSL. That’s where SQL schema dumps come in. When using the sql schema format, instead of a `schema.rb` file being generated when migrations are run, you'll have a `structure.sql` file.

It’s easy to set up SQL schema format on day one of a Rails project - just set a config flag and you’re good. I've written about this in my [Kickstart a New Rails Rails](../kickstart-a-new-rails-project) post. But what if you're already well into a project that uses the default Ruby format? You have dozens of migrations, a `schema.rb`, and now you need to add something the DSL can't express. Switching to SQL format mid-project isn’t hard, but it’s not immediately obvious how to do it. That’s what this post will walk you through.

## Why I Switched

On a recent project, I introduced the [pg_search](https://github.com/Casecommons/pg_search) gem to implement PostgreSQL full-text search. For performance, this approach requires creating a database `TRIGGER` to automatically update a `tsvector` column whenever the associated data to be searched changes. This trigger logic had to be written in SQL, not Ruby.

<aside class="markdown-aside">
If you need to define triggers in a Rails project, you may come across the <a class="markdown-link" href="https://github.com/jenseng/hair_trigger">hairtrigger</a> gem, which lets you declare triggers in your models using Ruby and then generates the underlying SQL with a rake task. While this is a neat concept, I decided not to use it because it introduces a departure from Rails conventions in regards to database schema maintenance. Rails migrations have conditioned us to look in the db/migrate directory to understand how the database schema evolves. Moving trigger definitions to model files breaks that mental model. It also felt like a potential future maintenance headache if the gem ever fell out of sync with newer versions of Rails or ActiveRecord.
</aside>

Rails migrations allow you to run raw SQL with `execute`, but `schema.rb` won’t capture these changes. This requires switching to `structure.sql`, which is a full SQL dump of the database schema.

The following steps will walk through making the switch:

## 1: Configure SQL Schema Dumps

*Before* adding a new migration that has raw sql, in `config/application.rb`, add:

```ruby
# Use SQL format for schema dumps
config.active_record.schema_format = :sql
```

## 2: Generate SQL Schema

Run the following to generate a `db/structure.sql` file based on your current database:

```sh
bin/rails db:schema:dump
```

This creates a full SQL dump of your schema using `pg_dump` (if you're using PostgreSQL).

## 3: Delete Ruby Schema

You no longer need `db/schema.rb`, and it may cause confusion if left around:

```sh
rm db/schema.rb
```

## 4: Run SQL Migration

Now you can safely write a migration using raw SQL, for example, adding a trigger:

```ruby
class CreatePgSearchDocuments < ActiveRecord::Migration[7.1]
  def up
    create_table :pg_search_documents do |t|
      t.text :content
      t.references :searchable, polymorphic: true, null: false, index: true
      t.tsvector :content_vector
      t.timestamps
    end

    execute <<~SQL
      CREATE TRIGGER pg_search_documents_content_vector_update
      BEFORE INSERT OR UPDATE ON pg_search_documents
      FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(
          content_vector, 'pg_catalog.english', content
        );
    SQL
  end

  def down
    drop_table :pg_search_documents
  end
end
```

Run the migration with `bin/rails db:migrate`, then check `structure.sql` - it should include any raw SQL statements from your migration, such as the `TRIGGER` in this example.

## 5: Verify Schema Loading

Run this command to reset your database from the schema:

```sh
bin/rails db:reset
```

This drops and recreates the database and loads the schema, which will now use the the SQL dump, followed by seeding. It should run without errors.

Also, connect to the database with `bin/rails db` and verify that changes made via raw sql were preserved. For example, to verify that a trigger was created on the `pg_search_documents` table if using PostgreSQL, the `\d+` meta command outputs additional table details:

```
\d+ pg_search_documents
usual table details...

Triggers:
    pg_search_documents_content_vector_update
        BEFORE INSERT OR UPDATE ON pg_search_documents
        FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(
            'content_vector',
            'pg_catalog.english',
            'content'
        )
```

Commit the removal of `schema.rb` and the new `structure.sql` to source control. From now on, the database schema will be expressed in SQL.

## PG Extensions and Heroku Review Apps

If any migrations enable PostgreSQL extensions, for example:

```ruby
def change
  enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')
end
```

When working with Heroku Review Apps or any ephemeral environments, you might set up the DB with `rails db:setup` to ensure a fresh start each time. This runs `structure.sql` to load the schema, then runs seeds. i.e. normally you'd only be loading the schema when setting up a local development environment, but for ephemeral environments, the schema could also get loaded into a deployed/hosted environment.

But by default, when the schema gets dumped for PostgreSQL, it includes `COMMENT` statements like this:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
```

The problem? Heroku pre-installs common extensions like `pgcrypto`, but your Heroku user doesn’t *own* the extension. So when the SQL tries to run `COMMENT ON EXTENSION`, you’ll get an error like:

```
psql:/app/db/structure.sql:23: ERROR:  must be owner of extension pgcrypto...
```

This fails the schema load and breaks setup on Heroku.

**Why This Happens**

PostgreSQL restricts operations like `COMMENT ON EXTENSION` to the *owner* of the extension. But on Heroku, your app's database user is not the owner, Heroku is. So the SQL dump contains statements that the app user doesn't have permission to execute.

**Solution: Strip Comments from Schema Dump**

Rails lets you customize the flags passed when [generating the structure dump](https://guides.rubyonrails.org/active_record_postgresql.html#structure-dumps). To avoid these issues, configure Rails to exclude comments when dumping the structure. Create `config/initializers/structure_dump.rb` as follows:

```ruby
ActiveRecord::Tasks::DatabaseTasks.structure_dump_flags = [
  "--no-comments"
]
```

Then regenerate the schema:

```sh
bin/rails db:schema:dump
```

Open `structure.sql` and confirm that the `COMMENT ON EXTENSION` lines are gone.

Now, deploying to a Heroku review app or other ephemeral environment should work.

**Final Tip: Leave Yourself Breadcrumbs**

If you're adding an initializer config like `structure_dump.rb`, add inline comments to explain why. It’s easy to forget six months later *why* a flag was added, especially in rarely-touched config files. So your final version may look like this:

```ruby
# Prevent pg_dump from including COMMENT ON EXTENSION lines,
# which can cause permission errors on Heroku or other hosted environments.
# See: https://guides.rubyonrails.org/active_record_postgresql.html#structure-dumps
ActiveRecord::Tasks::DatabaseTasks.structure_dump_flags = [
  "--no-comments"
]
```

## Wrapping Up

Switching to SQL schema format in the middle of a Rails project is essential when you need to capture raw SQL in your migrations. It provides full control over the database schema and avoids limitations of the Ruby-based DSL. With a few tweaks, it can be made Heroku-friendly as well.
