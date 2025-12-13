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

A while back, I built a site-wide search bar for a Rails app, the kind that lets users type anything and instantly find relevant content across the product. We used PostgreSQL’s full-text search via the excellent [pg_search](https://github.com/Casecommons/pg_search) gem.

At first glance, `pg_search` feels almost magical. If you just follow the README and test locally with a small dataset, everything works instantly. But once you hit production with millions of records, unexpected performance issues can appear. The gem itself is fast — the challenge is knowing **which implementation choices matter at scale** and measuring performance to catch traps before they bite.

In this post, we’ll focus on **one specific performance issue**: computing PostgreSQL `tsvector`s on the fly for queries. To make the example concrete, we’ll use a **simplified Recipe app** — just enough to show the problem and the solution.

Before diving in, I’ll also mention what we *didn’t* do:

* We’d already tried an **AI/RAG-style approach** (retrieval-augmented generation) earlier, embedding records into a vector store and letting a model generate search-like responses. The results were unpredictable and hard to explain — especially for business users who expected consistent matches. So we went back to traditional full-text search where we could reason about ranking and performance.
* **Elasticsearch** or managed solutions like **Algolia** would’ve worked too, but for our volumes (millions of records, not billions) and a small engineering team without full-time ops, they would have been overkill. We wanted something native to Postgres — easy to deploy, easy to back up, and zero external dependencies.

With that context, let’s look at the Recipe example and what I learned along the way.

## The Recipe App: A Simplified Example

Imagine an app where users can browse and create recipes. For simplicity, we’ll just focus on public **Recipe** records. Each recipe has many **ingredients**, and our search needs to handle queries like:

> “chicken soup”

…and return recipes whose titles or ingredient lists match all query terms, supporting prefix matches (e.g., “chick” → “chicken”).

This setup is representative of a common SaaS challenge: multiple text fields to search, large data volume, and user-facing performance expectations.

```
Recipe
 ├── has_many :ingredients
```

## Starting Simple with pg_search

Getting started with [pg_search](https://github.com/Casecommons/pg_search) is straightforward. After adding it to the `Gemfile` and installing it, generate the migration:

```bash
bin/rails g pg_search:migration:multisearch
bin/rails db:migrate
```

This creates the `pg_search_documents` table:

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

Include the `PgSearch::Model` module in your model and add the `multisearchable` macro specifying which attribute to index:

```ruby
class Recipe < ApplicationRecord
  include PgSearch::Model
  multisearchable against: :title
end
```

This keeps `pg_search_documents` in sync automatically via an `after_save` callback. To populate it initially:

```ruby
PgSearch::Multisearch.rebuild(Recipe)
```

> **Aside:** In a full production app, we had several different types of searchable content, which is why we used `PgSearch.multisearch` instead of a simple `pg_search_scope`. Multisearch lets you query across multiple models in a single search. While this gave us flexibility, the performance issue discussed here is **independent of multisearch** — it can affect any large dataset, even a single model.

## On-The-Fly TSVectors

By default, pg_search computes PostgreSQL **tsvectors** on the fly using `to_tsvector()` in each query. For a few hundred rows, this is fine — you won’t notice. But at larger scales, Postgres reprocesses every row’s text at query time, causing significant latency.

Here’s what a generated query looks like:

```sql
SELECT
  pg_search_documents.*
FROM
  pg_search_documents
INNER JOIN (
  SELECT
    pg_search_documents.id AS pg_search_id,
    ts_rank(
      to_tsvector('simple', coalesce(pg_search_documents.content::text, '')),
      to_tsquery('simple', '''chicken'' & ''soup'''),
      0
    ) AS rank
  FROM
    pg_search_documents
  WHERE
    to_tsvector('simple', coalesce(pg_search_documents.content::text, '')) @@
    to_tsquery('simple', '''chicken'' & ''soup''')
) AS pg_search_ce9b9dd18c5c0023f2116f
  ON pg_search_documents.id = pg_search_ce9b9dd18c5c0023f2116f.pg_search_id
ORDER BY
  rank DESC,
  pg_search_documents.id ASC
LIMIT 10;
```

Using `EXPLAIN ANALYZE`:

```
Limit  (cost=2788.26..2788.27 rows=1 width=104) (actual time=59.121..59.122 rows=3 loops=1)
  -> Sort  (cost=2788.26..2788.27 rows=1 width=104) (actual time=59.118..59.119 rows=3 loops=1)
       Sort Key: ts_rank(to_tsvector('simple', COALESCE(content, '')), '''chicken'' & ''soup''', 0) DESC, id
       -> Seq Scan on pg_search_documents  (cost=0.00..2788.25 rows=1 width=104) (actual time=17.203..59.099 rows=3 loops=1)
             Filter: to_tsvector('simple', COALESCE(content, '')) @@ '''chicken'' & ''soup'''
             Rows Removed by Filter: 9997
```

Query time: **~59 ms** for just 10k rows — the bottleneck is computing `to_tsvector` for every row at query time.

## Persist TSVectors and Add a GIN Index

The fix is to **persist a tsvector column** and index it with a **GIN index**. Then, pg_search can query the precomputed vector instead of recalculating it.

### Migration

```ruby
class AddTsvectorColumnAndIndexToPgSearchDocuments < ActiveRecord::Migration[8.0]
  def up
    add_column :pg_search_documents, :content_vector, :tsvector

    execute <<~SQL
      CREATE TRIGGER pg_search_documents_content_vector_update
      BEFORE INSERT OR UPDATE ON pg_search_documents
      FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(
          content_vector, 'pg_catalog.english', content
        );
    SQL

    execute <<~SQL
      CREATE INDEX index_pg_search_documents_on_content_vector
      ON pg_search_documents USING GIN (content_vector);
    SQL

    execute <<~SQL
      UPDATE pg_search_documents
      SET content_vector = to_tsvector('pg_catalog.english', content)
      WHERE content IS NOT NULL;
    SQL
  end

  def down
    execute "DROP INDEX IF EXISTS index_pg_search_documents_on_content_vector;"
    execute "DROP TRIGGER IF EXISTS pg_search_documents_content_vector_update ON pg_search_documents;"
    remove_column :pg_search_documents, :content_vector
  end
end
```

### Configure pg_search to Use the Vector Column

```ruby
# config/initializers/pg_search.rb
PgSearch.multisearch_options = {
  using: {
    tsearch: {
      dictionary: "english",
      tsvector_column: "content_vector",
      prefix: true
    }
  }
}
```

## Performance After the Fix

Querying the same term now uses the GIN index:

```sql
SELECT
  pg_search_documents.*
FROM
  pg_search_documents
INNER JOIN (
  SELECT
    pg_search_documents.id AS pg_search_id,
    ts_rank(
      pg_search_documents.content_vector,
      to_tsquery('english', '''chicken'':* & ''soup'':*'),
      0
    ) AS rank
  FROM
    pg_search_documents
  WHERE
    pg_search_documents.content_vector @@ to_tsquery('english', '''chicken'':* & ''soup'':*')
) AS pg_search_ce9b9dd18c5c0023f2116f
  ON pg_search_documents.id = pg_search_ce9b9dd18c5c0023f2116f.pg_search_id
ORDER BY
  rank DESC,
  pg_search_documents.id ASC
LIMIT 10;
```

`EXPLAIN ANALYZE`:

```
Limit  (cost=114.74..114.77 rows=10 width=212) (actual time=0.524..0.526 rows=3 loops=1)
  -> Sort  (cost=114.74..114.80 rows=22 width=212) (actual time=0.521..0.522 rows=3 loops=1)
       Sort Key: ts_rank(content_vector, '''chicken'':* & ''soup'':*'::tsquery, 0) DESC, id
       -> Bitmap Heap Scan on pg_search_documents  (cost=38.51..114.27 rows=22 width=212) (actual time=0.488..0.500 rows=3 loops=1)
            Recheck Cond: (content_vector @@ '''chicken'':* & ''soup'':*'::tsquery)
            -> Bitmap Index Scan on index_pg_search_documents_on_content_vector  (cost=0.00..38.51 rows=22 width=0) (actual time=0.313..0.314 rows=3 loops=1)
```

Query time drops from **~59 ms → 0.6 ms** — nearly 100× faster.

|            | Before | After   |
| ---------- | ------ | ------- |
| Query time | ~59 ms | ~0.6 ms |

## Lesson Learned

For significant volumes, **don’t compute tsvectors at query time**. Persist them in a dedicated column, index with a GIN index, and configure pg_search to use it. The speedup can be dramatic, even on relatively modest datasets.


## TODO

* WIP main content
* conclusion para
* briefly explain seeding local with larger than usual volumes, point to demo project for specific techniques
* explain how to extract explain analyze output from rails console, or psql session (also link to my other post `Efficient Database Queries in Rails: A Practical Approach`)
* explain the explain/analyze output to show where most of time is being consumed (possibly visualize with tool mentioned in my other pg perf post)
* aside about tsvector and link to my other post on pg fts `Roll Your Own Search with Rails and Postgres: Search Engine`
* explain why we need a trigger
* aside using raw sql since rails migration dsl does not support trigger
* more explain re: `Query time: **~59 ms** for just 10k rows` - mention in production with thousands of simultaneous users, this was taking minutes
* edit
