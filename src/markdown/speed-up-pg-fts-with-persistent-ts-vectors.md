---
title: "Speeding Up PostgreSQL Full-Text Search with Persistent TSVectors"
featuredImage: "../images/speed-up-pg-fts-ts-vectpr-charles-etoroma-jC5blC1BZ0U-unsplash.jpg"
description: "Learn how to dramatically speed up PostgreSQL full-text search by persisting TSVectors and using GIN indexes in Rails apps."
date: "2026-03-01"
category: "rails"
related:
  - "Efficient Database Queries in Rails: A Practical Approach"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
  - "Setup a Rails Project with Postgres and Docker"
---

A while back, I built a site-wide search bar for a Rails app, the kind that lets users type anything and instantly find relevant content across the product. We used PostgreSQL's full-text search via the excellent [pg_search](https://github.com/Casecommons/pg_search) gem.

At first glance, `pg_search` feels almost magical. If you just follow the early part of the README and test locally with a small dataset, everything works instantly. But once you hit production with millions of records, unexpected performance issues can appear. These aren't necessarily the gem's fault. The challenge is knowing which implementation choices matter at scale and measuring performance to catch issues early.

In this post, we'll focus on one performance issue I ran into, computing PostgreSQL `tsvector`s on the fly for queries. To make the example concrete, we'll use a simplified Recipe app.

Before diving in, I'll also mention what we *didn't* do:

* We'd already tried an **AI/RAG-style approach** (retrieval-augmented generation) earlier, embedding records into a vector store and letting a model generate search-like responses. The results were unpredictable and hard to explain — especially for business users who expected consistent matches. So we went back to traditional full-text search where we could reason about ranking and performance.
* Elasticsearch or managed solutions like Algolia would've worked too, but for our volumes (low millions) and a small engineering team without full-time ops, they would have been overkill. We wanted something native to PostgreSQL — easy to deploy, easy to back up, and zero external dependencies.

With that context, let's look at the Recipe example and what I learned along the way.

## The Recipe App: A Simplified Example

Imagine an app where users can browse and create recipes. Each recipe has a title and many ingredients. The search needs to handle queries like "chicken soup" or "garlic", and return recipes whose titles or ingredient lists match all query terms, supporting prefix matches (e.g., “chick” → “chicken”).

```
Recipe
 ├── has_many :ingredients
```

## Setup Search

Getting started with [pg_search](https://github.com/Casecommons/pg_search) is straightforward. After adding it to the `Gemfile` and installing it, generate and run the migration:

```bash
bin/rails g pg_search:migration:multisearch
bin/rails db:migrate
```

This creates the `pg_search_documents` table, which uses a polymorphic association (`searchable_type` / `searchable_id`), allowing many different models to share a single search index table:

```sql
\d pg_search_documents
                                            Table "public.pg_search_documents"
     Column      |              Type              | Collation | Nullable |                     Default
-----------------+--------------------------------+-----------+----------+-------------------------------------------------
 id              | bigint                         |           | not null | nextval('pg_search_documents_id_seq'::regclass)
 content         | text                           |           |          |
 searchable_type | character varying              |           |          |
 searchable_id   | bigint                         |           |          |
 created_at      | timestamp(6) without time zone |           | not null |
 updated_at      | timestamp(6) without time zone |           | not null |
Indexes:
    "pg_search_documents_pkey" PRIMARY KEY, btree (id)
    "index_pg_search_documents_on_searchable" btree (searchable_type, searchable_id)
```

Next, configure `pg_search` to use the English text search dictionary (for stemming and stopwords) and enable prefix matching so partial terms like "chi" will match "chicken" or "chickpeas":

```ruby
# config/initializers/pg_search.rb
PgSearch.multisearch_options = {
  using: {
    tsearch: {
      dictionary: "english",
      prefix: true
    }
  }
}
```

Include the `PgSearch::Model` module in any Active Record model, and add the `multisearchable` macro specifying which attribute to index:

```ruby
class Recipe < ApplicationRecord
  include PgSearch::Model
  multisearchable against: :title
end
```

The `multisearchable` macro adds an Active Record `after_save` callback that extracts the configured attributes and writes (or updates) the corresponding row in `pg_search_documents`.

Because this callback only runs on future saves, you need to explicitly backfill existing records once to generate their initial search documents. The gem provides a command you can run at the Rails console:

```ruby
PgSearch::Multisearch.rebuild(Recipe)
```

<aside class="markdown-aside">
In the full production app, we had several different types of searchable content, which is why we used <code>PgSearch.multisearch</code> instead of a simple <code>pg_search_scope</code>. Multisearch lets you query across multiple models in a single search. While this gave us flexibility, the performance issue discussed here is independent of multisearch, it can affect any large dataset, even a single model.
</aside>

## Usage

Now that the search table is populated, we can query it. Here's an example in a Rails console:

```ruby
PgSearch.multisearch("chicken soup").limit(10)
```

Example output:

Disregard "weird" recipe titles due to faker and trying to make large number of unique titles, the recipes table is seeded with 100,000 recipes.

```
[#<PgSearch::Document:0x00000001224e4260
  id: 29879,
  content: "Vegetable Soup with Chicken with Chervil",
  searchable_type: "Recipe",
  searchable_id: 149850,
  created_at: "2025-12-20 14:00:01.752899000 +0000",
  updated_at: "2025-12-20 14:00:01.752899000 +0000">,
 #<PgSearch::Document:0x00000001224e4120
  id: 39849,
  content: "Homemade Vegetable Soup with Chicken",
  searchable_type: "Recipe",
  searchable_id: 159815,
  created_at: "2025-12-20 14:00:01.752899000 +0000",
  updated_at: "2025-12-20 14:00:01.752899000 +0000">,
 ...]
```

## On-The-Fly TSVectors

Let's take a closer look at the query that was generated by `PgSearch.multisearch("chicken soup")`. This is displayed in the Rails console when you run `multisearch` or you can run `PgSearch.multisearch("chicken soup").limit(10).to_sql`

```sql
SELECT
  "pg_search_documents".*
FROM
  "pg_search_documents"
INNER JOIN (
  SELECT
    "pg_search_documents"."id" AS pg_search_id,
    ts_rank(
      to_tsvector(
        'english',
        COALESCE(("pg_search_documents"."content")::text, '')
      ),
      (
        to_tsquery('english', ''' ' || 'chicken' || ' ''' || ':*')
        &&
        to_tsquery('english', ''' ' || 'soup' || ' ''' || ':*')
      ),
      0
    ) AS rank
  FROM
    "pg_search_documents"
  WHERE
    to_tsvector(
      'english',
      COALESCE(("pg_search_documents"."content")::text, '')
    ) @@ (
      to_tsquery('english', ''' ' || 'chicken' || ' ''' || ':*')
      &&
      to_tsquery('english', ''' ' || 'soup' || ' ''' || ':*')
    )
) AS pg_search_ce9b9dd18c5c0023f2116f
  ON "pg_search_documents"."id" =
     pg_search_ce9b9dd18c5c0023f2116f.pg_search_id
ORDER BY
  pg_search_ce9b9dd18c5c0023f2116f.rank DESC,
  "pg_search_documents"."id" ASC
LIMIT 10;
```

By default, pg_search computes PostgreSQL tsvectors on the fly using `to_tsvector()` function in each query. For a few hundred rows, this is fine. But at larger scales, Postgres has to reprocess every row's text at query time, causing significant latency.

Let's use PostgreSQL's `EXPLAIN ANALYZE` to see what's going on under the hood when this query runs:

```
 Limit  (cost=18087.10..18087.13 rows=10 width=105) (actual time=281.914..283.388 rows=10.00 loops=1)
   Buffers: shared hit=1738
   ->  Sort  (cost=18087.10..18087.20 rows=40 width=105) (actual time=281.912..283.385 rows=10.00 loops=1)
         Sort Key: (ts_rank(to_tsvector('english'::regconfig, COALESCE(pg_search_documents.content, ''::text)), '''chicken'':* & ''soup'':*'::tsquery, 0)) DESC, pg_search_documents.id
         Sort Method: top-N heapsort  Memory: 28kB
         Buffers: shared hit=1738
         ->  Gather  (cost=1000.00..18086.24 rows=40 width=105) (actual time=8.348..283.359 rows=39.00 loops=1)
               Workers Planned: 1
               Workers Launched: 1
               Buffers: shared hit=1738
               ->  Parallel Seq Scan on pg_search_documents  (cost=0.00..17082.24 rows=24 width=105) (actual time=15.422..278.848 rows=19.50 loops=2)
                     Filter: (to_tsvector('english'::regconfig, COALESCE(content, ''::text)) @@ '''chicken'':* & ''soup'':*'::tsquery)
                     Rows Removed by Filter: 49980
                     Buffers: shared hit=1738
 Planning Time: 0.326 ms
 Execution Time: 283.426 ms
```

At ~283ms for a single search over 100k rows, this is already slow on a single-user machine!

**Why so slow?**

```
->  Parallel Seq Scan on pg_search_documents
      Filter: (
        to_tsvector('english'::regconfig, COALESCE(content, ''::text))
        @@ '''chicken'':* & ''soup'':*'::tsquery
      )
      Rows Removed by Filter: 49980
```

PostgreSQL is forced into a parallel sequential scan and must evaluate `to_tsvector('english', COALESCE(content, ''))` for every row at query time. Because the tsvector is not precomputed or indexed, Postgres cannot use a GIN index and instead re-parses and tokenizes all text on each search, discarding ~50k rows after doing the work. The highlighted filter line in the plan is the bottleneck. This cost grows linearly with table size and concurrent users.

## Persist TSVectors and Add a GIN Index

TODO: Better sequence of steps explained here: https://github.com/Casecommons/pg_search?tab=readme-ov-file#using-tsvector-columns

To improve performance we need to persist a new column of type `tsvector` column and index it with a GIN index. Then, pg_search can query the precomputed vector instead of recalculating it.

TODO: Brief definition of GIN index and what it's for, multi-value...

But it's not enough to just create the column, we also need to add a `TRIGGER` so that this new column will be automatically populated every time the `content` in that row is created or updated.

**Migration**

We use techniques from the strong migration gem to avoid table locks during lengthy operations such as adding an index.

```ruby
class AddTsvectorColumnAndIndexToPgSearchDocuments < ActiveRecord::Migration[8.0]
  # Required for CREATE INDEX CONCURRENTLY
  disable_ddl_transaction!

  def up
    # 1. Add the column (fast metadata change)
    add_column :pg_search_documents, :content_vector, :tsvector

    # 2. Create trigger function binding
    execute <<~SQL
      CREATE TRIGGER pg_search_documents_content_vector_update
      BEFORE INSERT OR UPDATE ON pg_search_documents
      FOR EACH ROW
      EXECUTE FUNCTION tsvector_update_trigger(
        content_vector,
        'pg_catalog.english',
        content
      );
    SQL

    # 3. Create GIN index concurrently to avoid table locking
    execute <<~SQL
      CREATE INDEX CONCURRENTLY index_pg_search_documents_on_content_vector
      ON pg_search_documents
      USING GIN (content_vector);
    SQL
  end

  def down
    # Index must be dropped concurrently as well
    execute <<~SQL
      DROP INDEX CONCURRENTLY IF EXISTS index_pg_search_documents_on_content_vector;
    SQL

    execute <<~SQL
      DROP TRIGGER IF EXISTS pg_search_documents_content_vector_update
      ON pg_search_documents;
    SQL

    remove_column :pg_search_documents, :content_vector
  end
end
```

**Update Configuration**

We also need to update the pg_search gem's configuration to tell it to use the new tsvector column when it's writing search queries:

```ruby
# config/initializers/pg_search.rb
PgSearch.multisearch_options = {
  using: {
    tsearch: {
      dictionary: "english",
      tsvector_column: "content_vector", # === NEW ===
      prefix: true
    }
  }
}
```

Then we can rebuild to ensure the new column is populated: `PgSearch::Multisearch.rebuild(Recipe)`

## Performance After the Fix

Let's take a look at the query that is now generated from `PgSearch.multisearch("chicken soup").limit(10).to_sql`:

```sql
SELECT
  "pg_search_documents".*
FROM
  "pg_search_documents"
INNER JOIN (
  SELECT
    "pg_search_documents"."id" AS pg_search_id,
    ts_rank(
      "pg_search_documents"."content_vector",
      (
        to_tsquery('english', ''' ' || 'chicken' || ' ''' || ':*')
        &&
        to_tsquery('english', ''' ' || 'soup' || ' ''' || ':*')
      ),
      0
    ) AS rank
  FROM
    "pg_search_documents"
  WHERE
    "pg_search_documents"."content_vector" @@ (
      to_tsquery('english', ''' ' || 'chicken' || ' ''' || ':*')
      &&
      to_tsquery('english', ''' ' || 'soup' || ' ''' || ':*')
    )
) AS pg_search_ce9b9dd18c5c0023f2116f
  ON "pg_search_documents"."id" =
     pg_search_ce9b9dd18c5c0023f2116f.pg_search_id
ORDER BY
  pg_search_ce9b9dd18c5c0023f2116f.rank DESC,
  "pg_search_documents"."id" ASC
LIMIT 10;
```

Notice how this time, it's querying the new `content_vector` column rather than invoking the `to_tsvector` function to compute it on the fly from the `content` column.

Running this query through EXPLAIN ANALYZE shows performance has improved considerably:

```
 Limit  (cost=734.10..734.13 rows=10 width=214) (actual time=2.253..2.257 rows=10.00 loops=1)
   Buffers: shared hit=52
   ->  Sort  (cost=734.10..734.62 rows=209 width=214) (actual time=2.250..2.252 rows=10.00 loops=1)
         Sort Key: (ts_rank(pg_search_documents.content_vector, '''chicken'':* & ''soup'':*'::tsquery, 0)) DESC, pg_search_documents.id
         Sort Method: top-N heapsort  Memory: 31kB
         Buffers: shared hit=52
         ->  Bitmap Heap Scan on pg_search_documents  (cost=35.26..729.59 rows=209 width=214) (actual time=2.067..2.213 rows=39.00 loops=1)
               Recheck Cond: (content_vector @@ '''chicken'':* & ''soup'':*'::tsquery)
               Heap Blocks: exact=39
               Buffers: shared hit=52
               ->  Bitmap Index Scan on index_pg_search_documents_on_content_vector  (cost=0.00..35.21 rows=209 width=0) (actual time=2.022..2.022 rows=39.00 loops=1)
                     Index Cond: (content_vector @@ '''chicken'':* & ''soup'':*'::tsquery)
                     Index Searches: 1
                     Buffers: shared hit=13
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.542 ms
 Execution Time: 2.409 ms
```

The query went from ~283ms to ~2.4ms — a ~118× speedup (~99% reduction in runtime). This improvement isn't a small optimization — it's a fundamental change in how PostgreSQL can execute the query.

**Before the fix**

* PostgreSQL had to run `to_tsvector('english', content)` for every row at query time.
* Because the expression was computed on the fly, PostgreSQL could not use an index.
* The planner was forced into a parallel sequential scan over ~100k rows.
* Full-text ranking (`ts_rank`) was evaluated for many rows that would ultimately be discarded.
* Total work scaled linearly with table size.

**After the fix**

* The `content_vector` column stores a precomputed `tsvector`.
* A GIN index exists on `content_vector`.
* PostgreSQL can use the index instead of computing `to_tsvector` at query time.
* The planner performs a bitmap index scan rather than a sequential scan.
* Only rows matching the tsquery are visited (39 heap rows).
* `ts_rank` is computed only for rows that already matched the query.
* Sorting is limited to a top-N heapsort for the requested limit.
* Total work now scales with the number of matches, not the total table size.

This didn’t just make the query faster — it changed it from an O(N) table scan into an indexed lookup, which is why the speedup is so dramatic.

## Lesson Learned

For significant volumes, don't compute tsvectors at query time. Persist them in a dedicated column, index with a GIN index, and configure `pg_search` to use it. The speedup can be dramatic, even on relatively modest datasets.

The Rails ecosystem and its gems makes it incredibly easy to unlock complex functionality with just a few lines of code, and that ease can feel like a superpower. But it also makes it tempting to stop reading once things "work". Performance-critical details could be mentioned later in the README, and they tend to matter only once you hit real data.

Taking the time to read beyond the quick start pays off. The nuances are usually there, clearly explained, just not always at the top. Understanding these early can save you from surprises as your application scales.

## TODO

* maybe explain multisearch vs pg_search_scope a little earlier and explain in our app we needed multisearch but to keep this demo simple only searching a single model `Recipe`
* briefly explain seeding local with larger than usual volumes (eg: 100,000 recipes), point to demo project for specific techniques
  * also mention to disregard "weird" recipe titles, this was done to generate more variety and uniqueness
* explain how to extract explain analyze output from rails console, or psql session (also link to my other post `Efficient Database Queries in Rails: A Practical Approach`)
* explain the explain/analyze output to show where most of time is being consumed (possibly visualize with tool mentioned in my other pg perf post)
* aside about tsvector and link to my other post on pg fts `Roll Your Own Search with Rails and Postgres: Search Engine`
* explain why we need a trigger
* aside using raw sql since rails migration dsl does not support trigger
* more explain re: `Query time: **~59 ms** for just 10k rows` - mention in production with thousands of simultaneous users, this was taking minutes
* mention somewhere: focused on search perf so will not show any UI, will only use rails and psql consoles
* even ingredients isn't really relevant to the ts vector perf issue, maybe leave it out? (it was relevant to the bulk population though, maybe second blog post or make this one bigger?)
* edit
