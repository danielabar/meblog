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

A while back, I built a site-wide search bar for a Rails app, one of those "type anything and get relevant results instantly" features. We implemented it using PostgreSQL full-text search via the excellent [pg_search](https://github.com/Casecommons/pg_search) gem.

At first, everything felt effortless. Following the README, search worked instantly in development and even with a moderate dataset. But once the application reached production scale, performance issues started to appear. Not because `pg_search` is slow necessarily, but because some default choices that are perfectly reasonable for small datasets become problematic at scale.

This post focuses on one of those choices: computing PostgreSQL tsvectors at query time. It's an easy trap to fall into, because it works so well, until it doesn't.

Before diving in, I'll also mention what we *didn't* do:

* We'd already tried an AI/RAG-style approach (retrieval-augmented generation) earlier, embedding records into a vector store and letting a model generate search-like responses. The results were unpredictable and hard to explain — especially for business users who expected consistent matches. So we went back to traditional full-text search where we could reason about ranking and performance.
* Elasticsearch or managed solutions like Algolia would've worked too, but for our volumes (low millions) and a small engineering team without full-time ops, they would have been overkill. We wanted something native to PostgreSQL — easy to deploy, easy to back up, and zero external dependencies.

With that context, let's look at the Recipe example and what I learned along the way.

## A Simplified Example

To keep the example concrete and reproducible, I'll use a deliberately simplified Recipe app and focus only on searching recipe titles. The real application was more complex, but the performance issue discussed here shows up even in the simplest possible setup.

In a real application, recipes would have many searchable attribute such as ingredients, descriptions, tags, categories, and so on. But for this post, those details would only add noise. The performance issue we're exploring shows up even in the simplest possible case.

The search needs to handle queries like `"chicken soup"` and return recipes whose **titles** match all query terms, including support for prefix matches (for example, `"chick"` → `"chicken"`).

Imagine the app has a `Recipe` model like:

```ruby
class Recipe < ApplicationRecord
  validates :title, presence: true, uniqueness: true
end
```

To make the performance characteristics visible, the database is seeded with 100,000 recipes rather than the tiny datasets typical of development environments. This volume is large enough to trigger the query planner behavior and latency issues discussed later. The data is generated using Faker and written to CSV, then bulk-loaded into PostgreSQL. This avoids the overhead of creating records one-by-one with Active Record, which would be too slow. If interested, see the demo [recipe seeds](https://github.com/danielabar/recipe_search_demo/blob/main/db/seeds/recipes.rb) and [utilities](https://github.com/danielabar/recipe_search_demo/blob/main/db/seeds/shared/utilities.rb) for more details on this technique.

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

The `rebuild` step creates one search document for every recipe in the database. Each `pg_search_documents` row corresponds to a single `Recipe` record: the `searchable_type` column identifies the model (`"Recipe"`) and the `searchable_id` column points to the recipe's `id`. The `content` column is populated from the attributes declared in the `against:` option of `multisearchable—in this example, just `:title`.

You can verify this in a Rails database console (`bin/rails db`):

```sql
-- Confirm there is one search document per recipe
select count(*) from pg_search_documents;
--  count
-- --------
-- 100000

-- Inspect a sample row
\x
select * from pg_search_documents limit 1;
-- -[ RECORD 1 ]---+-----------------------------------------------
-- id              | 100001
-- content         | Caprese Salad with Bay Leaves #9b1f
-- searchable_type | Recipe
-- searchable_id   | 120001
-- created_at      | 2025-12-20 14:45:27.409956
-- updated_at      | 2025-12-20 14:45:27.409956
```

<aside class="markdown-aside">
In the full production app, we had several different types of searchable content, which is why we used <code>PgSearch.multisearch</code> instead of a simple <code>pg_search_scope</code>. Multisearch lets you query across multiple models in a single search. While this gave us flexibility, the performance issue discussed here is independent of multisearch, it can affect any large dataset, even a single model.
</aside>

## Usage

Now that the search table is populated, we can query it. Here's an example in a Rails console:

```ruby
PgSearch.multisearch("chicken soup").limit(10)
```

Example output (the slightly odd recipe titles are an artifact of synthetic seed data designed to guarantee uniqueness at scale):

```
[#<PgSearch::Document:0x00000001224e4260
  id: 29879,
  content: "Vegetable Soup with Chicken with Chervil #e926",
  searchable_type: "Recipe",
  searchable_id: 149850,
  created_at: "2025-12-20 14:00:01.752899000 +0000",
  updated_at: "2025-12-20 14:00:01.752899000 +0000">,
 #<PgSearch::Document:0x00000001224e4120
  id: 39849,
  content: "Homemade Vegetable Soup with Chicken #227b",
  searchable_type: "Recipe",
  searchable_id: 159815,
  created_at: "2025-12-20 14:00:01.752899000 +0000",
  updated_at: "2025-12-20 14:00:01.752899000 +0000">,
 ...]
```

## On-The-Fly TSVectors

Let's take a closer look at the query that was generated by `PgSearch.multisearch("chicken soup")`. This is displayed in the Rails console when you run `multisearch` or you can run `PgSearch.multisearch("chicken soup").limit(10).to_sql`

<aside class="markdown-aside">
This section assumes some familiarity with PostgreSQL full-text search concepts like <code>tsvector</code>, <code>to_tsvector()</code>, <code>tsquery</code>, and how stemming and lexemes work. If those are new or fuzzy, I walk through them in more detail in an earlier post: <a class="markdown-link" href="https://danielabaron.me/blog/roll-your-own-search-service-for-gatsby-part3/">Roll Your Own Search with Rails and PostgreSQL Full Text Search</a>.
</aside>

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

By default, `pg_search` computes PostgreSQL tsvectors on the fly using `to_tsvector()` function in each query. For a few hundred rows, this is fine. But at larger scales, Postgres has to reprocess every row's text at query time, causing significant latency.

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

At ~283ms for a single search over 100k rows, this is already slow on a single-user machine. In production with thousands of simultaneous users, searches were taking upwards of a minute!

<aside class="markdown-aside">
If you're unfamiliar with reading PostgreSQL <code>EXPLAIN ANALYZE</code> output, I wrote a more in-depth walkthrough in an earlier post: <a class="markdown-link" href="https://danielabaron.me/blog/rails-query-perf/">Rails Query Performance: A Practical Guide</a>.
</aside>

**Why so slow?**

```
->  Parallel Seq Scan on pg_search_documents
      Filter: (
        to_tsvector('english'::regconfig, COALESCE(content, ''::text))
        @@ '''chicken'':* & ''soup'':*'::tsquery
      )
      Rows Removed by Filter: 49980
```

PostgreSQL is forced into a parallel sequential scan and must evaluate `to_tsvector('english', COALESCE(content, ''))` for every row at query time. Because the tsvector is not precomputed or indexed, Postgres cannot use a GIN index and instead re-parses and tokenizes all text on each search, discarding ~50k rows after doing the work. The `Filter:` shown above is the bottleneck. This cost grows linearly with table size and concurrent users.

## Persist TSVectors and Add a GIN Index

The solution is to move tsvector generation out of the query path entirely. Instead of calling `to_tsvector(...)` on every search, we need to persist the result in a dedicated tsvector column and index it with a GIN index. PostgreSQL can then evaluate the tsquery directly against an indexed vector, turning a full table scan into an index lookup.

**What we'll build:**

* A new column of type `tsvector` that stores a precomputed search vector.
* A `GIN` index on that column for fast full-text lookups.
* A database trigger that keeps the vector in sync whenever the source text changes.
* A small configuration change so `pg_search` uses this column instead of recomputing vectors.

**Why a GIN Index?**

A `GIN` (Generalized Inverted Index) is designed for multi-value data types, things like arrays, JSONB, and `tsvector`.
Instead of indexing an entire row value, it indexes *individual tokens* and maps them back to the rows that contain them. This is exactly what we want for full-text search: "find all rows that contain these lexemes".

**Migration**

Creating the column alone isn't enough. We also need a trigger so PostgreSQL automatically updates the `tsvector` whenever the underlying text changes.

Because this table may already be large, we'll follow **strong_migrations** best practices to avoid blocking writes, by creating the index concurrently.

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

<aside class="markdown-aside">
Rails migrations don't have a DSL for defining database triggers, so this migration uses a small amount of raw SQL. If you're curious about managing SQL-backed schemas in Rails, I've written more about that <a class="markdown-link" href="https://danielabaron.me/blog/from-ruby-to-sql-schema/">here</a>.
</aside>

**Update Configuration**

By default, `pg_search` generates a `to_tsvector(...)` expression inline. We now want it to query our persisted column instead.

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

**Verify Search Table Schema and Contents**

Let's inspect the table schema now:

```
\d+ pg_search_documents
                                                                       Table "public.pg_search_documents"
     Column      |              Type              | Collation | Nullable |                     Default                     | Storage  | Compression | Stats target | Description
-----------------+--------------------------------+-----------+----------+-------------------------------------------------+----------+-------------+--------------+-------------
 id              | bigint                         |           | not null | nextval('pg_search_documents_id_seq'::regclass) | plain    |             |              |
 content         | text                           |           |          |                                                 | extended |             |              |
 searchable_type | character varying              |           |          |                                                 | extended |             |              |
 searchable_id   | bigint                         |           |          |                                                 | plain    |             |              |
 created_at      | timestamp(6) without time zone |           | not null |                                                 | plain    |             |              |
 updated_at      | timestamp(6) without time zone |           | not null |                                                 | plain    |             |              |
 content_vector  | tsvector                       |           |          |                                                 | extended |             |              |
Indexes:
    "pg_search_documents_pkey" PRIMARY KEY, btree (id)
    "index_pg_search_documents_on_content_vector" gin (content_vector)
    "index_pg_search_documents_on_searchable" btree (searchable_type, searchable_id)
Not-null constraints:
    "pg_search_documents_id_not_null" NOT NULL "id"
    "pg_search_documents_created_at_not_null" NOT NULL "created_at"
    "pg_search_documents_updated_at_not_null" NOT NULL "updated_at"
Triggers:
    pg_search_documents_content_vector_update BEFORE INSERT OR UPDATE ON pg_search_documents FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('content_vector', 'pg_catalog.english', 'content')
```

Notice the important pieces:

* The original `content` column is still present
* A new `content_vector` column of type `tsvector`
* A `GIN` index on `content_vector`
* A trigger that keeps the vector up to date

Now look at an example row in the table:

```sql
\x
select content, content_vector from pg_search_documents limit 1;
-- -[ RECORD 1 ]--+-----------------------------------------------
-- content        | Caprese Salad with Bay Leaves #9b1f
-- content_vector | '9b1f':6 'bay':4 'capres':1 'leav':5 'salad':2
```

The `content_vector` column contains the tokenized, normalized, and stemmed form of `content`. This is what PostgreSQL can now search directly, without recomputing it on every query.

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

This didn't just make the query faster — it changed it from an O(N) table scan into an indexed lookup, which is why the speedup is so dramatic.

## Lesson Learned

For significant volumes, don't compute tsvectors at query time. Persist them in a dedicated column, index with a GIN index, and configure `pg_search` to use it. The speedup can be dramatic, even on relatively modest datasets.

The Rails ecosystem and its gems makes it incredibly easy to unlock complex functionality with just a few lines of code, and that ease can feel like a superpower. But it also makes it tempting to stop reading once things "work". Performance-critical details could be mentioned later in the README, and they tend to matter only once you hit real data.

Taking the time to read beyond the quick start pays off. The nuances are usually there, clearly explained, just not always at the top. Understanding these early can save you from surprises as your application scales.

## TODO

* mention somewhere: focused on search perf so will not show any UI, will only use rails and psql consoles
* edit
