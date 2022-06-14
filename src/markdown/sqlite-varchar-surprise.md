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

Setup: Initial migration to create wiki posts table (put together all migrations into one with title, author, etc.)

Task: Limit title length to 50 chars (maybe use 10 for easier demo) - add migration with `change_column`

Show screenshot of SQLite GUI confirming table limit `VARCHAR(50)`

Try out new limit in console: Create new model with title > n chars and save - it saves but was expecting sql error?

Turns out: SQLite doesn't enforce varchar length limits https://www.hwaci.com/sw/sqlite/faq.html:

> SQLite does not enforce the length of a VARCHAR. You can declare a VARCHAR(10) and SQLite will be happy to store a 500-million character string there. And it will keep all 500-million characters intact. Your content is never truncated. SQLite understands the column type of "VARCHAR(N)" to be the same as "TEXT", regardless of the value of N.

Option: ActiveRecord validation (TODO: demonstrate), but will only be enforced via Rails app. No data integrity at database level (TOOD: demo direct sql insert still allows long title length).

Conclusion: SQLite ok for demo/learning app where not as concerned with data integrity, but otherwise consider something more robust such as Postgres or MySQL.

TODO:
- compare how it works on Postgres - hello-visitor add experimental migration to limit url column length in `visits` table, then try to use Rails console to save a new model with longer length.
- compare how it works on MySQL