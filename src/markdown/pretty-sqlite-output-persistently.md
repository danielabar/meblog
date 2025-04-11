---
title: "Pretty SQLite Output Persistently"
featuredImage: "../images/pretty-sqlite-output-nipun-haldar-X1V6aogS9XY-unsplash.jpg"
description: "Learn how to improve SQLite's default query output for better readability in Rails 8, where SQLite is now a serious option for production apps thanks to Solid Queue, Solid Cable, and Solid Cache."
date: "2025-06-01"
category: "sqlite"
related:
  - "ActiveRecord JSON Column with MySQL and MariaDB"
  - "Rails Enums with MySQL or Postgres"
  - "Efficient Database Queries in Rails: A Practical Approach"
---

With Rails 8, SQLite has quietly grown into a serious option for production use. A big part of this shift is Rails' move toward reducing external dependencies: no need for PostgreSQL, MySQL, or Redis just to get full-featured apps running. Thanks to the new **Solid Queue**, **Solid Cable**, and **Solid Cache** adapters, SQLite can now power jobs, caching, and WebSockets in a production-capable setup.

> “Now all of it can be done with SQLite…”
> — [Rails 8 Beta 1 Announcement](https://rubyonrails.org/2024/9/27/rails-8-beta1-no-paas-required)

As developers begin using SQLite more regularly, there's a small but annoying detail: the default query output is difficult to read. This post will cover a quick solution to this problem.

## The Problem

Here’s what a query looks like in SQLite's default mode:

```
sqlite> select id, key, filename, content_type from active_storage_blobs;
1|6081val5vwpz691v8ukv8tc4zma0|receipt-1.pdf|application/pdf
```

All the values are crammed together with pipes (`|`), no headers, and no alignment. Compare that to PostgreSQL’s default output, which is far more readable out of the box:

TODO: Get actual example from psql

```
myapp_development=# select id, key, filename, content_type from active_storage_blobs;
 id |             key              |    filename    |   content_type
----+------------------------------+----------------+------------------
  1 | 6081val5vwpz691v8ukv8tc4zma0 | receipt-1.pdf  | application/pdf
(1 row)
```

For quick debugging or manual inspection, the SQLite format can be a headache.

## Temporary Fix

You can improve the output by typing a couple commands into the SQLite prompt:

```sql
.headers on
.mode column
```

This turns on column headers and switches to a padded, readable column layout:

TODO: Show improved output

Much better! But the moment you quit and start a new session (e.g., with `bin/rails db`), those settings are lost.

## Permanent Fix

To keep this formatting in every SQLite session, create a config file in your home directory:

```bash
# Create a sqlite config file in your home directory
touch ~/.sqliterc

# Open it in your editor of choice
code ~/.sqliterc  # or use vim, nano, etc.
```

Add the following lines:

```
.headers on
.mode column
```

Now every time you open a SQLite session, including `bin/rails db`, you’ll get readable output by default:

```
-- Loading resources from /Users/dbaron/.sqliterc
sqlite> select id, key, filename, content_type from active_storage_blobs;
id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf
```

A tiny change, but a big boost to developer ergonomics.

## Other Options

According to the [SQLite CLI documentation](https://sqlite.org/cli.html), `.sqliterc` can include any valid SQLite shell command (those starting with a dot, like `.mode`, `.headers`, etc.). Here are a few other useful options you might consider:

**.nullvalue**

Set how NULLs are displayed in results (default is empty string):

```
.nullvalue NULL
```

**.width**

Manually set column widths (useful if `.mode column` wraps weirdly):

```
.width 5 35 20 25
```

**.prompt**

Customize the shell prompt (might help distinguish from `psql` if you use both):

```
.prompt 'sqlite> '
```

**.echo**

Echo each command before execution (handy for debugging):

```
.echo on
```

SQLite may be lightweight, but its CLI is surprisingly customizable. With just a couple of lines in a dotfile, you can make it way more comfortable to work with, especially now that it’s increasingly at home in production Rails apps.

## TODO
* verify bonus options
* explain `bin/rails db` as shortcut to get into a database shell for whatever is configured in `config/database.yml`
* edit
