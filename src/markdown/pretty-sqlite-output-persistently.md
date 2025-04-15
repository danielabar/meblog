---
title: "Pretty SQLite Output Persistently"
featuredImage: "../images/pretty-sqlite-output-maryn-brayfield-MaDKBVyaVOY-unsplash.jpg"
description: "Learn how to improve SQLite's default query output for better readability in Rails 8, where SQLite is now a serious option for production apps thanks to Solid Queue, Solid Cable, and Solid Cache."
date: "2025-06-01"
category: "sqlite"
related:
  - "SQLite Varchar Surprise"
  - "Rails Enums with MySQL or Postgres"
  - "Efficient Database Queries in Rails: A Practical Approach"
---

With Rails 8, SQLite has quietly grown into a serious option for production use. A big part of this shift is Rails' move toward reducing external dependencies: no need for PostgreSQL, MySQL, or Redis just to get full-featured apps running. Thanks to the new Solid Queue, Solid Cable, and Solid Cache adapters, SQLite can now power jobs, caching, and WebSockets in a production-capable setup.

> “Now all of it can be done with SQLite…”
> — [Rails 8 Beta 1 Announcement](https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required)

As developers begin using SQLite more regularly, there's a small but annoying detail: the default query output is difficult to read. This post will cover a quick solution to this problem.

## Accessing the SQLite Session

Before getting into improving SQLite’s query output, let’s quickly cover how to access a SQLite session. You can either use the command `sqlite3 storage/development.sqlite3` to open it directly, specifying the path to the database file. Or take advantage of the shortcut `bin/rails db`, which launches the database shell for the database configured in your `config/database.yml`. The `bin/rails db` command is especially useful for working with Rails apps, as it automatically points to the correct database file based on the yaml config file in the project.

## The Problem

Here’s what a query looks like in SQLite's default mode:

```
sqlite> select id, key, filename, content_type from active_storage_blobs;
1|6081val5vwpz691v8ukv8tc4zma0|receipt-1.pdf|application/pdf
2|yepiy78vt33lrxw2olnzvllpw36w|receipt-2.pdf|application/pdf
3|bkbzp8qgom9h6lpbp582fuzn8u7u|approval.pdf|application/pdf
```

All the values are crammed together with pipes (`|`), no headers, and no alignment. Compare that to PostgreSQL’s default output, which is more legible out of the box:

```
 id |             key              |   filename     |  content_type
----+------------------------------+----------------+-----------------
  1 | 6081val5vwpz691v8ukv8tc4zma0 | receipt-1.pdf  | application/pdf
  2 | yepiy78vt33lrxw2olnzvllpw36w | receipt-2.pdf  | application/pdf
  3 | bkbzp8qgom9h6lpbp582fuzn8u7u | approval.pdf   | application/pdf
(3 rows)
```

## Temporary Fix

You can improve the output by typing the following commands in the SQLite shell:

```
.headers on
.mode column
```

This turns on column headers and switches to a padded, readable column layout:

```
id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf
2   yepiy78vt33lrxw2olnzvllpw36w  receipt-2.pdf  application/pdf
3   bkbzp8qgom9h6lpbp582fuzn8u7u  approval.pdf   application/pdf
```

Much better! But the moment you quit and start a new session, those settings are lost.

## Permanent Fix

To keep this formatting in every SQLite session, create a config file in your home directory:

```bash
# Create a sqlite config file in your home directory
touch ~/.sqliterc

# Open it in your editor of choice
code ~/.sqliterc  # or use vim, nano, etc.
```

Add the following lines and save the file:

```
.headers on
.mode column
```

Now every time you open a SQLite session, the output will be formatted as per the settings in the config file. A message is also displayed on startup indicating the custom settings file has been loaded:

```
-- Loading resources from /Users/youruser/.sqliterc
sqlite> select id, key, filename, content_type from active_storage_blobs;
id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf
2   yepiy78vt33lrxw2olnzvllpw36w  receipt-2.pdf  application/pdf
3   bkbzp8qgom9h6lpbp582fuzn8u7u  approval.pdf   application/pdf
```

Alternatively, specifying `.mode box` (instead of `column`) will draw a box around the results, which some might find even easier to read:

```
.mode box
select id, key, filename, content_type from active_storage_blobs;
┌────┬──────────────────────────────┬───────────────┬─────────────────┐
│ id │             key              │   filename    │  content_type   │
├────┼──────────────────────────────┼───────────────┼─────────────────┤
│ 1  │ 6081val5vwpz691v8ukv8tc4zma0 │ receipt-1.pdf │ application/pdf │
│ 2  │ yepiy78vt33lrxw2olnzvllpw36w │ receipt-2.pdf │ application/pdf │
│ 3  │ bkbzp8qgom9h6lpbp582fuzn8u7u │ approval.pdf  │ application/pdf │
└────┴──────────────────────────────┴───────────────┴─────────────────┘
```

A tiny change, but a big boost to developer ergonomics.

## Other Options

Here are some other options that can be added to the `~/.sqliterc` file:

**.nullvalue**

Set how NULLs are displayed in results (default is empty string):

```
.nullvalue NULL
```

**.changes**

Show how many rows were affected by inserts, updates, deletes. Otherwise by default sqlite is silent about this:

```
.changes on
```

**.echo**

Echo each command before execution:

```
.echo on
```

**.timer**

Show timing information after executing queries:

```
.timer on
```

Check out the [SQLite CLI documentation](https://sqlite.org/cli.html) for even more options. SQLite may be lightweight, but the CLI is fairly customizable. With a few lines in a dotfile, you can make it more comfortable to work with, especially now that it’s increasingly at home in Rails apps.
