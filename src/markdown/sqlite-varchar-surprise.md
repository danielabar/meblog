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

Intro para wip: I recently completed the Getting Started with Rails 6 course on Pluralsight and ran into a surprise with the use of SQLite and string column lengths. From having taken a number of these courses and going through Rails books, SQLite is a popular  choice as its the default database used when running the `rails new...` command. The newly scaffolded application will connect to it without any additional configuration required.

TBD: Specify Ruby version used in course.

## Setup

The courses uses the `scaffold` option of the `generate` command to generate not just a migration for the model, but also all the model class, controller, views, view helpers, styles, routes and tests. For the purposes of this post, will only focus on the migration:

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

Let's use the [sqlite3](https://www.sqlite.org/cli.html) command line tool that ships with SQLite to see what schema got created for this table. To work with any SQLite database at the command line, simply launch `sqlite3` passing in the path to the database file. In a Rails project, it will be in `db/{env}.sqlite3`. So to open the development database:

```bash
# cd to the project root
sqlite3 db/development.sqlite3
```

From the sqlite prompt, the `.schema table_name` command can be used to display the schema for just the given table name. By default, the display is all on line line which is hard to read, passing in the `--indent` option produces more human readable output:

```
sqlite> .schema wiki_posts --indent
CREATE TABLE IF NOT EXISTS "wiki_posts"(
  "id" integer NOT NULL PRIMARY KEY,
  "created_at" datetime(6) NOT NULL,
  "updated_at" datetime(6) NOT NULL,
  "title" varchar(50) DEFAULT NULL,
  "description" varchar DEFAULT NULL,
  "author" varchar DEFAULT NULL
);
```

## Limit Length

After trying out the generated UI and adding some styles, it's determined that it would be better to limit the title length. In the course we set it to 50 characters, but for easier demonstration purposes, will use 10.

```
bin/rails g migration update_wiki_post_title
```

Use the `change_column` method in the migration to change the title column in wiki_posts table to have a max length of 10 characters.

Note the use of `up` and `down` methods rather than `change_column` because otherwise if running a rollback, Rails won't know what the previous state of the column as to undo this change:

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

Use the `sqlite3` command line tool again to verify the `wiki_posts` table schema has been updated to limit the title length:

```
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

Try out new limit in console: Create new model with title > n chars and save - it saves but was expecting sql error?

```ruby
a_post = WikiPost.new(title: "abcdefghijk")
a_post.save
  TRANSACTION (0.1ms)  begin transaction
  WikiPost Create (3.3ms)  INSERT INTO "wiki_posts" ("created_at", "updated_at", "title") VALUES (?, ?, ?)  [["created_at", "2022-06-15 11:14:59.474262"], ["updated_at", "2022-06-15 11:14:59.474262"], ["title", "abcdefghijk"]]
  TRANSACTION (1.4ms)  commit transaction
=> true
```

TODO: Image - headscratcher/huh???

Turns out: SQLite doesn't enforce varchar length limits https://www.hwaci.com/sw/sqlite/faq.html:

> SQLite does not enforce the length of a VARCHAR. You can declare a VARCHAR(10) and SQLite will be happy to store a 500-million character string there. And it will keep all 500-million characters intact. Your content is never truncated. SQLite understands the column type of "VARCHAR(N)" to be the same as "TEXT", regardless of the value of N.

Option: ActiveRecord validation (TODO: demonstrate), but will only be enforced via Rails app. No data integrity at database level (TOOD: demo direct sql insert still allows long title length).

## Postgres Comparison

Connect to the Postgres database using the [psql](https://www.postgresql.org/docs/current/app-psql.html) command line tool. For example, if the database name is `wiki` and Postgres is running locally:

```bash
psql -U wiki
```

Use the `\d` command to view a table schema. The same initial migration to create the WikiPost model results in the following table in Postgres:

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

After running the update migration that limits the title column to 10 characters, the updated schema looks as follows:

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

Notice the `title` column is now of type `character varying(10)` whereas before it was just `character varying`.

Let's exercise the updated model in a Rails console:

```ruby
a_post = WikiPost.new(title: "abcdefghijk")
a_post.save
   (4.4ms)  BEGIN
  WikiPost Create (7.4ms)  INSERT INTO "wiki_posts" ("title", "created_at", "updated_at") VALUES ($1, $2, $3) RETURNING "id"  [["title", "abcdefghijk"], ["created_at", "2022-06-15 11:11:05.725757"], ["updated_at", "2022-06-15 11:11:05.725757"]]
   (1.9ms)  ROLLBACK
Traceback (most recent call last):
        1: from (irb):4
ActiveRecord::ValueTooLong (PG::StringDataRightTruncation: ERROR:  value too long for type character varying(10))
```

## Conclusion

SQLite ok for demo/learning app where not as concerned with data integrity, but otherwise consider something more robust such as Postgres or MySQL.

TODO:
- compare how it works on MySQL