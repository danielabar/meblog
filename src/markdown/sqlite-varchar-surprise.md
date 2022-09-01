---
title: "SQLite Varchar Surprise"
featuredImage: "../images/sqllite-surprise-shubham-dhage-t0Bv0OBQuTg-unsplash.jpg"
description: "Avoid getting tripped up by this SQLite feature when it comes to enforcing string column lengths."
date: "2022-09-01"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Rails Enums with MySQL or Postgres"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

I recently completed the [Getting Started with Rails 6](https://app.pluralsight.com/library/courses/getting-started-ruby-rails/table-of-contents) course on Pluralsight and ran into a surprise with the use of SQLite and string column lengths. SQLite is a popular choice in Rails courses as its the default database when starting an app with the `rails new...` command and very easy to use. However, I was surprised by how it handles string column lengths as this post will explain.

## Setup

The course uses Ruby 2.7.2 and Rails 6.1.4 to build a Wiki application where users can create, view, and edit posts. It also assumes that [sqlite](https://formulae.brew.sh/formula/sqlite) is installed on the local machine. There's a single model `WikiPost` to persist the author, title, and description.

To get started, the `scaffold` option of the `generate` command is used to generate not just a migration for the model, but also the model class, controller, views, view helpers, styles, routes and tests. For the purpose of this post, we will only be focusing on the migration and model.

```
bin/rails generate scaffold WikiPost title:string description:string author:string
```

Generates this migration:

```ruby
class CreateWikiPosts < ActiveRecord::Migration[6.1]
  def change
    create_table :wiki_posts do |t|
      t.string :title
      t.string :description
      t.string :author

      t.timestamps
    end
  end
end
```

And this model:

```ruby
class WikiPost < ApplicationRecord
end
```

After running the migration with `bin/rails db:migrate`, we can use the [sqlite3](https://www.sqlite.org/cli.html) command line tool that ships with SQLite to see what schema got created for this table. To work with any SQLite database from the terminal, run `sqlite3` passing in the path to the database file. In a Rails project, it will be in `db/{env}.sqlite3`. To open the development database, the command is:

```bash
# cd to the project root
sqlite3 db/development.sqlite3
```

From the sqlite prompt, the `.schema table_name` command can be used to display the schema for the given table name. By default, the display is all on line line which is hard to read. Passing in the `--indent` option produces more human readable output:

```sql
sqlite> .schema wiki_posts --indent
CREATE TABLE IF NOT EXISTS "wiki_posts"(
  "id" integer NOT NULL PRIMARY KEY,
  "created_at" datetime(6) NOT NULL,
  "updated_at" datetime(6) NOT NULL,
  "title" varchar DEFAULT NULL,
  "description" varchar DEFAULT NULL,
  "author" varchar DEFAULT NULL
);
```

## Limit Length

After trying out the generated UI and adding some styles, it's determined that it would be better to limit the title length. In the course it gets set to 50 characters, but for easier demonstration purposes, I will use 10 here. To modify the table definition, we first need to generate a new migration:

```
bin/rails generate migration update_wiki_post_title
```

We use the `change_column` method in the migration file to change the `title` column in `wiki_posts` table to have a max length of 10 characters. Note the use of `up` and `down` methods rather than `change` because otherwise if running a rollback, Rails won't know what the previous state of the column was to undo this change:

```ruby
class UpdateWikiPostTitle < ActiveRecord::Migration[6.1]
  def up
    change_column :wiki_posts, :title, :string, :limit => 10
  end

  def down
    change_column :wiki_posts, :title, :string
  end
end
```

After running this migration with `bin/rails db:migrate`, run the `sqlite3` command line tool again to verify the `wiki_posts` table schema has been updated to limit the title length:

```sql
sqlite> .schema wiki_posts --indent
CREATE TABLE IF NOT EXISTS "wiki_posts"(
  "id" integer NOT NULL PRIMARY KEY,
  "created_at" datetime(6) NOT NULL,
  "updated_at" datetime(6) NOT NULL,
  "title" varchar(10) DEFAULT NULL,
  "description" varchar DEFAULT NULL,
  "author" varchar DEFAULT NULL
);
```

Notice the `title` column now has a column type of `varchar(10)` whereas before it was simply `varchar`. It would be expected that now any rows saved to the table can have at most 10 characters for the title.

## The Problem

Let's try this out using the `WikiPost` model in a Rails console `bin/rails console`, and try to save some invalid data, that is, a model instance with a title longer than 10 characters:

```ruby
# Create a new post with a title of 11 characters
a_post = WikiPost.new(title: "abcdefghijk")

# Try to save it to the database
a_post.save
```

I was expecting an error at this point, however, the output from saving the model shows that it was successfully saved to the database:

```
  TRANSACTION (0.1ms)  begin transaction
  WikiPost Create (3.3ms)  INSERT INTO "wiki_posts" ("created_at", "updated_at", "title") VALUES (?, ?, ?)
  [["created_at", "2022-06-15 11:14:59.474262"], ["updated_at", "2022-06-15 11:14:59.474262"],
  ["title", "abcdefghijk"]]
  TRANSACTION (1.4ms)  commit transaction
=> true
```

Me:

![sqlite surprise huh](../images/sqlite-surprise-huh.jpg "sqlite surprise huh")

Well that was unexpected! What's the point of creating and running a migration to limit a column length if Rails ignores it and goes ahead and saves data that violates the limit?

My first thought was maybe there was an issue with the combination of the Rails and SQLite versions used in the course. To investigate this, we can try bypassing Rails and use  `sqlite3` to try a direct insert into the database with the same too long title:

```sql
-- Try to save invalid data
INSERT INTO wiki_posts(title, created_at, updated_at)
  VALUES("abcdefghijk", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Returns control to the prompt with no error, this means it worked.

-- Verify
SELECT title, created_at, updated_at
FROM wiki_posts
ORDER BY created_at DESC LIMIT 1;
-- Outputs: abcdefghijk|2022-06-16 10:54:27|2022-06-16 10:54:27
```

Surprisingly, the database allows data that violates the length constraint to be inserted. So this isn't a Rails problem, it seems to be a problem with SQLite. I did a little digging, and it turns out SQLite doesn't enforce varchar length limits. From the [FAQ](https://www.hwaci.com/sw/sqlite/faq.html):

> SQLite does not enforce the length of a VARCHAR. You can declare a VARCHAR(10) and SQLite will be happy to store a 500-million character string there. And it will keep all 500-million characters intact. Your content is never truncated. SQLite understands the column type of "VARCHAR(N)" to be the same as "TEXT", regardless of the value of N.

Me:

![sqlite surprise wow](../images/sqlite-surprise-wow.png "sqlite surprise wow")

## A Solution

If the database won't enforce the column length limit, we could instead enhance the `WikiPost` model to use the [length](https://guides.rubyonrails.org/active_record_validations.html#length) validator from ActiveRecord as follows:

```ruby
class WikiPost < ApplicationRecord
  validates :title, length: { maximum: 10 }
end
```

Let's see how this behaves in the console (start with `bin/rails c`):

```ruby
# Create a new post with a title of 11 characters
a_post = WikiPost.new(title: "abcdefghijk")

# Try to save it to the database - this time it fails!
a_post.save
# => false

# Is the object valid? No!
a_post.valid?
# => false

# Show the error
a_post.errors[:title]
# => ["is too long (maximum is 10 characters)"]
```

However, this will only be enforced via the Rails app. There is no data integrity at database level. Invalid data could still be inserted by someone with access to the database.

## Postgres Comparison

I was curious to see how [Postgres](https://www.postgresql.org/) compares in enforcing length limits on string columns. So I scaffolded another project using Postgres instead of SQLite by passing `-d=postgresql` to the `rails new...` and setup the same `WikiPost` model and migration.

Quick reminder, here is the original migration that creates the `wiki_posts` table, and the simple model class with no ActiveRecord validations:

```ruby
class CreateWikiPosts < ActiveRecord::Migration[6.1]
  def change
    create_table :wiki_posts do |t|
      t.string :title
      t.string :description
      t.string :author

      t.timestamps
    end
  end
end
```

```ruby
class WikiPost < ApplicationRecord
end
```

First let's see the schema that got created for this table. Connect to the Postgres database using the [psql](https://www.postgresql.org/docs/current/app-psql.html) command line tool. For example, if the database name is `wiki` and Postgres is running locally:

```bash
psql -U wiki -d wiki
```

At the database prompt, Use the `\d` command to view a table schema. The same initial migration to create the WikiPost model results in the following table in Postgres. Notice the `title` column is of type `character varying`:

```
wiki=> \d wiki_posts
                                          Table "public.wiki_posts"
   Column    |              Type              | Collation | Nullable |                Default
-------------+--------------------------------+-----------+----------+----------------------------------------
 id          | bigint                         |           | not null | nextval('wiki_posts_id_seq'::regclass)
 title       | character varying              |           |          |
 description | character varying              |           |          |
 author      | character varying              |           |          |
 created_at  | timestamp(6) without time zone |           | not null |
 updated_at  | timestamp(6) without time zone |           | not null |
Indexes:
    "wiki_posts_pkey" PRIMARY KEY, btree (id)
```

Now apply the migration that limits the `title` length to 10 characters:

```ruby
class UpdateWikiPostTitle < ActiveRecord::Migration[6.1]
  def up
    change_column :wiki_posts, :title, :string, :limit => 10
  end

  def down
    change_column :wiki_posts, :title, :string
  end
end
```

And check the schema again using `psql`. Notice the `title` column now has a data type of `character varying(10)`:

```
hello=> \d wiki_posts
                                          Table "public.wiki_posts"
   Column    |              Type              | Collation | Nullable |                Default
-------------+--------------------------------+-----------+----------+----------------------------------------
 id          | bigint                         |           | not null | nextval('wiki_posts_id_seq'::regclass)
 title       | character varying(10)          |           |          |
 description | character varying              |           |          |
 author      | character varying              |           |          |
 created_at  | timestamp(6) without time zone |           | not null |
 updated_at  | timestamp(6) without time zone |           | not null |
Indexes:
    "wiki_posts_pkey" PRIMARY KEY, btree (id)
```

Let's exercise the model in a Rails console. Remember, there are no ActiveRecord validations defined on the model.

```ruby
# Create a new post with a title of 11 characters
a_post = WikiPost.new(title: "abcdefghijk")

# Try to save it to the database
a_post.save
```

Unlike with SQLite, the save fails when using Postgres. As shown in the output below, the transaction gets rolled back because the string title length violates the specified limit of 10:
```
   (4.4ms)  BEGIN
  WikiPost Create (7.4ms)  INSERT INTO "wiki_posts" ("title", "created_at", "updated_at") VALUES ($1, $2, $3) RETURNING "id"  [["title", "abcdefghijk"], ["created_at", "2022-06-15 11:11:05.725757"], ["updated_at", "2022-06-15 11:11:05.725757"]]
   (1.9ms)  ROLLBACK
Traceback (most recent call last):
        1: from (irb):4
ActiveRecord::ValueTooLong (PG::StringDataRightTruncation: ERROR:  value too long for type character varying(10))
```

Much better (and less surprising!). This is the behaviour I would expect from a table column that has a length limit.

## MySQL Comparison

For completeness sake, I also did a quick check on how MySQL handles string column length limits. Just focusing on direct database access as we've already learned this is not an issue with Rails. I'm using the [MySQL Command-Line client](https://dev.mysql.com/doc/refman/8.0/en/mysql.html).

Running the two migrations to create the `wiki_posts` table and modify the `title` column to have a length of 10 results in the following table schema created. Notice the `title` column has a data type of `varchar(10)`:

```
mysql -u root -D wiki
mysql> DESCRIBE wiki_posts;
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | bigint(20)   | NO   | PRI | NULL    | auto_increment |
| title       | varchar(10)  | YES  |     | NULL    |                |
| description | varchar(255) | YES  |     | NULL    |                |
| author      | varchar(255) | YES  |     | NULL    |                |
| created_at  | datetime     | NO   |     | NULL    |                |
| updated_at  | datetime     | NO   |     | NULL    |                |
+-------------+--------------+------+-----+---------+----------------+
```

And trying to insert a title that's greater than 10 characters long results in an error, which is what we would expect:

```sql
mysql> INSERT INTO wiki_posts(title, created_at, updated_at)
  VALUES("abcdefghijk", CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());
-- ERROR 1406 (22001): Data too long for column 'title' at row 1
```

<aside class="markdown-aside">
Throughout this post, I've been using command line tools provided by the databases such as <a class="markdown-link" href="https://www.sqlite.org/cli.html">sqlite3</a>, <a class="markdown-link" href="https://www.postgresql.org/docs/current/app-psql.html">psql</a>, and <a class="markdown-link" href="https://dev.mysql.com/doc/refman/8.0/en/mysql.html">mysql</a>. This isn't usually part of Rails courses or tutorials as all access to the database is handled by ActiveRecord. However, I started my career before <a class="markdown-link" href="https://stackoverflow.com/a/1279678/3991687">ORMs</a> were a thing, and have developed the habit of always going one level deeper than the application to check what's going on directly in the database.
</aside>

## Conclusion

This post has covered some troubleshooting techniques you can use when getting an unexpected result from ActiveRecord by interacting directly with the database. SQLite may be an ok choice of database for a demo/learning app or for something where data integrity is not such a big concern. But otherwise consider something more robust such as Postgres or MySQL.