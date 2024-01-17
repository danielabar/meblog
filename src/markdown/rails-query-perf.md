---
title: "Efficient Database Queries in Rails: A Practical Approach"
featuredImage: "../images/rails-query-perf-kurt-cotoaga-0b5g9_pnMqc-unsplash.jpg"
description: "Explore a practical guide to optimizing database queries in Rails applications. Learn step-by-step enhancements, from indexing strategies to column selection."
date: "2024-02-01"
category: "rails"
related:
  - "A Tale of Rails, ChatGPT, and Scopes"
  - "Understanding ActiveRecord Dependent Options"
  - "Homebrew Postgresql Service not Starting Resolved"
---

This post will walk through a step-by-step approach to PostgreSQL query enhancement in Rails applications. From indexing strategies to efficient column selection, you'll learn some techniques to ensure optimal query performance.

## Getting Started

To get started quicker with a Rails app, schema design, and data, I've forked the Rideshare Rails application. Rideshare is a Rails app on [GitHub](https://github.com/andyatkinson/rideshare) that's used for exercises in the book High Performance PostgreSQL for Rails. I had the opportunity to provide a technical review for the beta version of this book. Many insights shared in this post are derived from the valuable lessons learned during that review process. If you're interested in the book, it can be [purchased here](https://pragprog.com/titles/aapsql/high-performance-postgresql-for-rails/)

## Business Requirement

Create a dashboard view for admins that shows all trips that where completed within the last week. Each row in this view should display:
- completed date
- rating
- driver first and last name
- rider first and last name
- city where the trip started


## First Attempt

Before getting into the complexity of joins, let's just focus on the main requirement, which is to show recently completed trips, using `completed_at` timestamp column on the `Trip` model.

```ruby
class Trip < ApplicationRecord
  def self.admin_report
    where('completed_at >= ?', 1.week.ago)
  end
end
```

Given 50,000 rows in trip_requests.

Run in Rails console `Trip.admin_report` to see query that is generated. Then take this query and run explain/analyze in `bin/rails db` console. Explain to show query execution plan, and analyze to run it and get information on how long it takes.

```sql
EXPLAIN (ANALYZE) SELECT "trips"."id"
  , "trips"."trip_request_id"
  , "trips"."driver_id"
  , "trips"."completed_at"
  , "trips"."rating"
  , "trips"."created_at"
  , "trips"."updated_at"
FROM "trips"
WHERE (completed_at >= '2024-01-04 12:20:54.270716');

--                                               QUERY PLAN
-- ------------------------------------------------------------------------------------------------------
--  Seq Scan on trips  (cost=0.00..1106.00 rows=3521 width=48) (actual time=0.013..11.413 rows=3863 loops=1)
--    Filter: (completed_at >= '2024-01-04 12:20:54.270716'::timestamp without time zone)
--    Rows Removed by Filter: 46137
--  Planning Time: 1.193 ms
--  Execution Time: 11.880 ms
```

## Second Attempt: Add Index

```bash
rails generate migration AddIndexToTripsCompletedAt
```

Note use of `disable_ddl_transaction!` and `algorithm: :concurrently`. This will avoid locking table while index is being added, so that the application can remain responsive.

[Strong Migrations](https://github.com/ankane/strong_migrations)

```ruby
class AddIndexToTripsCompletedAt < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_index :trips, :completed_at, algorithm: :concurrently
  end
end
```

Run explain/analyze on same query again after adding index:
```
                                                                 QUERY PLAN
 -------------------------------------------------------------------------------------------------------------------------------------------
  Bitmap Heap Scan on trips  (cost=67.58..592.59 rows=3521 width=48) (actual time=0.724..3.849 rows=3863 loops=1)
    Recheck Cond: (completed_at >= '2024-01-04 12:20:54.270716'::timestamp without time zone)
    Heap Blocks: exact=481
    ->  Bitmap Index Scan on index_trips_on_completed_at  (cost=0.00..66.70 rows=3521 width=0) (actual time=0.603..0.604 rows=3863 loops=1)
          Index Cond: (completed_at >= '2024-01-04 12:20:54.270716'::timestamp without time zone)
  Planning Time: 0.242 ms
  Execution Time: 4.229 ms
```

The difference in the query plans before and after adding an index on the `completed_at` column is significant, and it demonstrates the performance improvements gained by utilizing an index.

1. **Before Index: Sequential Scan**
   ```sql
   Seq Scan on trips  (cost=0.00..1106.00 rows=3521 width=48) (actual time=0.013..11.413 rows=3863 loops=1)
   ```
   - The query planner is performing a sequential scan on the `trips` table, examining every row in the table to find those that match the condition (`completed_at >= '2024-01-04 12:20:54.270716'`).
   - The cost of this operation is relatively high (1106.00), and the actual execution time is 11.880 ms.

2. **After Index: Bitmap Heap Scan**
   ```sql
   Bitmap Heap Scan on trips  (cost=67.58..592.59 rows=3521 width=48) (actual time=0.724..3.849 rows=3863 loops=1)
   ```
   - The query planner is now using a Bitmap Heap Scan, which indicates that it's leveraging an index on the `completed_at` column.
   - The cost of this operation is significantly lower (592.59 compared to 1106.00 in the sequential scan).
   - The actual execution time is also reduced to 4.229 ms, which is faster than the sequential scan.

3. **Index Usage Details**
   ```sql
   Bitmap Index Scan on index_trips_on_completed_at  (cost=0.00..66.70 rows=3521 width=0) (actual time=0.603..0.604 rows=3863 loops=1)
   ```
   - This part of the plan shows the Bitmap Index Scan operation on the `index_trips_on_completed_at`.
   - The index condition (`completed_at >= '2024-01-04 12:20:54.270716'`) is used to efficiently identify relevant rows.
   - The cost of the index scan is very low (66.70).

**Summary of Improvements:**
   - The addition of the index has reduced the execution time from 11.880 ms to 4.229 ms.
   - The query planner now utilizes a Bitmap Heap Scan with a Bitmap Index Scan, which is more efficient than the previous sequential scan.
   - The overall cost of the query has been significantly reduced, leading to improved performance.

In conclusion, adding an index on the `completed_at` column has substantially improved the query performance by allowing the database engine to quickly locate and retrieve the relevant rows without the need for a full table scan.

### Maybe Visualize

To use free web based tool: https://explain.dalibo.com/ (need to be ok with sharing query and plan publicly):

Put your query in a file (eg in `queries` dir):
```sql
-- queries/explain1.sql
EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)
SELECT ...
```

Run it, redirecting output to file, then copy to clipboard. These flags make it suitable for machine consumption:
```bash
psql -h 127.0.0.1 -p 5439 -U owner -d rideshare_development -XqAt -f queries/explain1.sql > queries/analyze1.json
cat queries/analyze1.json | pbcopy
# OR
psql -h 127.0.0.1 -p 5439 -U owner -d rideshare_development -XqAt -f queries/explain1.sql | tee queries/analyze1.json | pbcopy
```

## Third Attempt: Joins

Now that use of `completed_at` is optimized, we can continue development of the admin dashboard query. Recall we also need to show driver and rider information, as well as the trip location.

Note use of nested joins and custom string joins.
Naive approach with select *:
Problem with naive select * approach is second time pulling in users table attributes override drivers/users

```ruby
class Trip < ApplicationRecord
  def self.admin_report
    joins(trip_request: [:start_location])
      .joins('INNER JOIN users AS riders ON riders.id = trip_requests.rider_id')
      .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
      .where('trips.completed_at > ?', 1.week.ago)
      .select('trips.*, locations.*, drivers.*, riders.*')
  end
end
```

In Rails console. Note that even though results is a relation of Trip models, each instance contains attributes from trips, locations, and users table. However, since both drivers and riders are actually from the same `users` table, the last one pulled in (riders in this case) "wins" and so the result only has the rider attributes.

```ruby
results = Trip.admin_report

results.first.attributes
{"id"=>61943,
 "trip_request_id"=>56017,
 "driver_id"=>60456,
 "completed_at"=>Wed, 10 Jan 2024 07:21:26.462838000 CST -06:00,
 "rating"=>5,
 "address"=>"New York, NY",
 "city"=>nil,
 "state"=>"NY",
 "position"=>#<struct ActiveRecord::Point x=40.7143528, y=-74.0059731>,
 "first_name"=>"Shantelle",
 "last_name"=>"Kris",
 "email"=>"Shantelle-Kris-522@email.com",
 "type"=>"Rider",
 "password_digest"=>"$2a$12...",
 "trips_count"=>nil,
 "drivers_license_number"=>nil}
```

Take generated SQL and run through explain/analyze:

```sql
EXPLAIN (ANALYZE) SELECT
    trips.*,
    locations.*,
    drivers.*,
    riders.*
FROM "trips"
INNER JOIN "trip_requests" ON "trip_requests"."id" = "trips"."trip_request_id"
INNER JOIN "locations" ON "locations"."id" = "trip_requests"."start_location_id"
INNER JOIN users AS riders ON riders.id = trip_requests.rider_id
INNER JOIN users AS drivers ON drivers.id = trips.driver_id
WHERE (trips.completed_at > '2024-01-10 12:05:39.639423');
```

The execution time has gone up, even though the query is still using the index on `trips.completed_at`, this query is more complex due to the multiple joins.

```
                                                                              QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Hash Join  (cost=1399.44..2692.88 rows=524 width=453) (actual time=11.736..24.510 rows=559 loops=1)
   Hash Cond: (trips.driver_id = drivers.id)
   ->  Nested Loop  (cost=529.22..1821.28 rows=524 width=294) (actual time=1.109..13.507 rows=559 loops=1)
         ->  Hash Join  (cost=528.93..1643.10 rows=524 width=139) (actual time=1.085..12.227 rows=559 loops=1)
               Hash Cond: (trip_requests.start_location_id = locations.id)
               ->  Hash Join  (cost=527.89..1637.76 rows=524 width=56) (actual time=1.054..11.992 rows=559 loops=1)
                     Hash Cond: (trip_requests.id = trips.trip_request_id)
                     ->  Seq Scan on trip_requests  (cost=0.00..917.10 rows=50010 width=16) (actual time=0.004..4.868 rows=50010 loops=1)
                     ->  Hash  (cost=521.34..521.34 rows=524 width=48) (actual time=1.028..1.032 rows=559 loops=1)
                           Buckets: 1024  Batches: 1  Memory Usage: 53kB
                           ->  Bitmap Heap Scan on trips  (cost=12.35..521.34 rows=524 width=48) (actual time=0.116..0.896 rows=559 loops=1)
                                 Recheck Cond: (completed_at > '2024-01-10 12:05:39.639423'::timestamp without time zone)
                                 Heap Blocks: exact=328
                                 ->  Bitmap Index Scan on index_trips_on_completed_at  (cost=0.00..12.22 rows=524 width=0) (actual time=0.060..0.060 rows=559 loops=1)
                                       Index Cond: (completed_at > '2024-01-10 12:05:39.639423'::timestamp without time zone)
               ->  Hash  (cost=1.02..1.02 rows=2 width=87) (actual time=0.019..0.021 rows=2 loops=1)
                     Buckets: 1024  Batches: 1  Memory Usage: 9kB
                     ->  Seq Scan on locations  (cost=0.00..1.02 rows=2 width=87) (actual time=0.011..0.013 rows=2 loops=1)
         ->  Index Scan using users_pkey on users riders  (cost=0.29..0.34 rows=1 width=159) (actual time=0.002..0.002 rows=1 loops=559)
               Index Cond: (id = trip_requests.rider_id)
   ->  Hash  (cost=595.10..595.10 rows=22010 width=159) (actual time=10.601..10.601 rows=22010 loops=1)
         Buckets: 32768  Batches: 1  Memory Usage: 3221kB
         ->  Seq Scan on users drivers  (cost=0.00..595.10 rows=22010 width=159) (actual time=0.021..4.849 rows=22010 loops=1)
 Planning Time: 1.046 ms
 Execution Time: 24.936 ms
```

## Fourth Attempt: Select only the columns you need

The previous query selected all columns from all of the joined tables. But recall the business requirements were that we only need to display a few of these. Let's "narrow" the amount of data by restricting the columns in the select to only what we need. This also allows us to do some string concatenation to distinguish between driver and rider names.

```ruby
  def self.admin_report
    joins(trip_request: [:start_location])
      .joins('INNER JOIN users AS riders ON riders.id = trip_requests.rider_id')
      .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
      .where('trips.completed_at > ?', 1.week.ago)
      .select('trips.completed_at, trips.rating, locations.address,
               drivers.first_name || \' \' || drivers.last_name AS driver_name,
               riders.first_name || \' \' || riders.last_name AS rider_name')
  end
```

In Rails console, attributes contain exactly what's needed to display in the view, and no more:

```ruby
results = Trip.admin_report
results.first.attributes
# {
#   "completed_at" => Wed, 10 Jan 2024 07:12:42.960652000 CST -06:00,
#   "rating" => nil,
#   "address" => "New York, NY",
#   "driver_name" => "Rasheeda Brakus",
#   "rider_name" => "Corina Gorczany",
#   "id" => nil
# }
```

Explain/analyze the query:

```sql
EXPLAIN (ANALYZE) SELECT
  trips.completed_at,
  trips.rating,
  locations.address,
  drivers.first_name || ' ' || drivers.last_name AS driver_name,
  riders.first_name || ' ' || riders.last_name AS rider_name
FROM trips
INNER JOIN trip_requests ON trip_requests.id = trips.trip_request_id
INNER JOIN locations ON locations.id = trip_requests.start_location_id
INNER JOIN users AS riders ON riders.id = trip_requests.rider_id
INNER JOIN users AS drivers ON drivers.id = trips.driver_id
WHERE trips.completed_at > '2024-01-10 12:27:19.062944';
```

```
                                                                              QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Hash Join  (cost=1398.27..2693.98 rows=516 width=88) (actual time=8.572..20.188 rows=559 loops=1)
   Hash Cond: (trips.driver_id = drivers.id)
   ->  Nested Loop  (cost=528.05..1817.24 rows=516 width=41) (actual time=1.246..12.363 rows=559 loops=1)
         ->  Hash Join  (cost=527.76..1641.78 rows=516 width=32) (actual time=1.224..11.156 rows=559 loops=1)
               Hash Cond: (trip_requests.start_location_id = locations.id)
               ->  Hash Join  (cost=526.71..1636.51 rows=516 width=24) (actual time=1.191..10.985 rows=559 loops=1)
                     Hash Cond: (trip_requests.id = trips.trip_request_id)
                     ->  Seq Scan on trip_requests  (cost=0.00..917.10 rows=50010 width=16) (actual time=0.005..4.199 rows=50010 loops=1)
                     ->  Hash  (cost=520.26..520.26 rows=516 width=24) (actual time=1.167..1.174 rows=559 loops=1)
                           Buckets: 1024  Batches: 1  Memory Usage: 38kB
                           ->  Bitmap Heap Scan on trips  (cost=12.29..520.26 rows=516 width=24) (actual time=0.138..1.060 rows=559 loops=1)
                                 Recheck Cond: (completed_at > '2024-01-10 12:27:19.062944'::timestamp without time zone)
                                 Heap Blocks: exact=328
                                 ->  Bitmap Index Scan on index_trips_on_completed_at  (cost=0.00..12.16 rows=516 width=0) (actual time=0.081..0.081 rows=559 loops=1)
                                       Index Cond: (completed_at > '2024-01-10 12:27:19.062944'::timestamp without time zone)
               ->  Hash  (cost=1.02..1.02 rows=2 width=20) (actual time=0.020..0.021 rows=2 loops=1)
                     Buckets: 1024  Batches: 1  Memory Usage: 9kB
                     ->  Seq Scan on locations  (cost=0.00..1.02 rows=2 width=20) (actual time=0.012..0.013 rows=2 loops=1)
         ->  Index Scan using users_pkey on users riders  (cost=0.29..0.34 rows=1 width=21) (actual time=0.002..0.002 rows=1 loops=559)
               Index Cond: (id = trip_requests.rider_id)
   ->  Hash  (cost=595.10..595.10 rows=22010 width=21) (actual time=7.296..7.296 rows=22010 loops=1)
         Buckets: 32768  Batches: 1  Memory Usage: 1492kB
         ->  Seq Scan on users drivers  (cost=0.00..595.10 rows=22010 width=21) (actual time=0.007..3.716 rows=22010 loops=1)
 Planning Time: 1.649 ms
 Execution Time: 20.553 ms
```

Comparing results of reduced select columns. Recall this query has the same joins as previous, but have reduced the "width" of the output:

1. **Smaller Result Width:**
   - Query A selects all columns from the involved tables using `SELECT *`.
   - Query B specifies a smaller set of columns, including only those needed for the final result.

2. **Smaller Hash Join Width:**
   - The Hash Join operations in both queries involve joining on the "driver_id" column.
   - In Query A, the result width of the Hash Join is larger (453) compared to Query B (88) due to the larger number of selected columns.

3. **Index Scan and Bitmap Heap Scan:**
   - The Bitmap Heap Scan on the "trips" table in both queries involves checking the condition "completed_at > '2024-01-10 12:05:39.639423'" or "completed_at > '2024-01-10 12:27:19.062944'".
   - The reduced number of selected columns in Query B might lead to a smaller index and bitmap size, potentially improving performance.

4. **Memory Usage:**
   - The Hash Join in Query A has a larger memory usage (3221kB) compared to Query B (1492kB).
   - The reduction in the number of selected columns contributes to a smaller memory footprint in Query B.

In general, selecting only the necessary columns can lead to performance improvements for several reasons, such as reduced disk I/O, smaller memory requirements, and potentially faster data transmission between nodes.

## Fifth Attempt: Restrict rows further if possible

Eg: Use case might be to only focus on trips with low ratings. i.e. discussions between engineering and product to make sure data is focused on solving the underlying business problem, in this case, admins would like to focus on trips with low ratings, so we can further restrict the volume of data by reducing the rows.

Note that there already is an index on `trips.rating`.

```ruby
  def self.admin_report
    joins(trip_request: [:start_location, :rider])
      .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
      .where('trips.completed_at > ?', 1.week.ago)
      .where('trips.rating <= ?', 3)
      .select('trips.completed_at, trips.rating, locations.address,
               drivers.first_name || \' \' || drivers.last_name AS driver_name,
               users.first_name || \' \' || users.last_name AS rider_name')
      .order(completed_at: :desc)
  end
```

Results are "shaped" the same as before but have less of them:

```ruby
results = Trip.admin_report
results.length
# => 78
```

Explain/analyze the query:

```sql
EXPLAIN (ANALYZE) SELECT
  trips.completed_at,
  trips.rating,
  locations.address,
  drivers.first_name || ' ' || drivers.last_name AS driver_name,
  riders.first_name || ' ' || riders.last_name AS rider_name
FROM trips
INNER JOIN trip_requests ON trip_requests.id = trips.trip_request_id
INNER JOIN locations ON locations.id = trip_requests.start_location_id
INNER JOIN users AS riders ON riders.id = trip_requests.rider_id
INNER JOIN users AS drivers ON drivers.id = trips.driver_id
WHERE (trips.completed_at > '2024-01-10 13:08:58.257990')
  AND (trips.rating <= 3);
```

```
                                                                                 QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=97.88..1340.17 rows=75 width=88) (actual time=0.514..1.937 rows=78 loops=1)
   Join Filter: (trip_requests.start_location_id = locations.id)
   Rows Removed by Join Filter: 78
   ->  Seq Scan on locations  (cost=0.00..1.02 rows=2 width=20) (actual time=0.012..0.015 rows=2 loops=1)
   ->  Materialize  (cost=97.88..1336.34 rows=75 width=42) (actual time=0.247..0.937 rows=78 loops=2)
         ->  Nested Loop  (cost=97.88..1335.96 rows=75 width=42) (actual time=0.488..1.819 rows=78 loops=1)
               ->  Nested Loop  (cost=97.59..862.59 rows=75 width=33) (actual time=0.463..1.492 rows=78 loops=1)
                     ->  Nested Loop  (cost=97.30..837.09 rows=75 width=24) (actual time=0.449..1.240 rows=78 loops=1)
                           ->  Bitmap Heap Scan on trips  (cost=97.01..298.02 rows=75 width=24) (actual time=0.436..0.645 rows=78 loops=1)
                                 Recheck Cond: ((completed_at > '2024-01-10 13:08:58.25799'::timestamp without time zone) AND (rating <= 3))
                                 Heap Blocks: exact=72
                                 ->  BitmapAnd  (cost=97.01..97.01 rows=75 width=0) (actual time=0.419..0.421 rows=0 loops=1)
                                       ->  Bitmap Index Scan on index_trips_on_completed_at  (cost=0.00..12.05 rows=501 width=0) (actual time=0.083..0.083 rows=559 loops=1)
                                             Index Cond: (completed_at > '2024-01-10 13:08:58.25799'::timestamp without time zone)
                                       ->  Bitmap Index Scan on index_trips_on_rating  (cost=0.00..84.67 rows=7518 width=0) (actual time=0.314..0.314 rows=7531 loops=1)
                                             Index Cond: (rating <= 3)
                           ->  Index Scan using trip_requests_pkey on trip_requests  (cost=0.29..7.19 rows=1 width=16) (actual time=0.007..0.007 rows=1 loops=78)
                                 Index Cond: (id = trips.trip_request_id)
                     ->  Index Scan using users_pkey on users riders  (cost=0.29..0.34 rows=1 width=21) (actual time=0.003..0.003 rows=1 loops=78)
                           Index Cond: (id = trip_requests.rider_id)
               ->  Memoize  (cost=0.30..6.55 rows=1 width=21) (actual time=0.004..0.004 rows=1 loops=78)
                     Cache Key: trips.driver_id
                     Cache Mode: logical
                     Hits: 8  Misses: 70  Evictions: 0  Overflows: 0  Memory Usage: 9kB
                     ->  Index Scan using users_pkey on users drivers  (cost=0.29..6.54 rows=1 width=21) (actual time=0.003..0.003 rows=1 loops=70)
                           Index Cond: (id = trips.driver_id)
 Planning Time: 1.168 ms
 Execution Time: 2.360 ms
```

Significant execution time improvement from further restricting the number of rows.

The performance improvement in Query C compared to Query B can be attributed to several factors, as indicated by the execution plans. Here are some key reasons why Query C is faster:

1. **Index Scans Optimization:**
   - Both Query B and Query C use Bitmap Index Scans on the "index_trips_on_completed_at" and "index_trips_on_rating" indexes. However, Query C benefits from the additional filter condition `(trips.rating <= 3)`, allowing the database to leverage the "index_trips_on_rating" index efficiently.

2. **BitmapAnd Operation:**
   - Query C introduces a BitmapAnd operation that combines the results of two Bitmap Index Scans, optimizing the process of satisfying both filter conditions (`completed_at` and `rating <= 3`). This can lead to a more efficient evaluation of the WHERE clause.

3. **Materialization and Caching:**
   - Query C includes a Materialize operation, which caches the result of the Nested Loop Join involving the "trips," "trip_requests," and "users" tables. This caching mechanism can contribute to performance improvement by avoiding repeated calculations.

4. **Smaller Result Set:**
   - The additional filter condition in Query C (`rating <= 3`) reduces the number of rows that need to be processed in subsequent join operations. This can lead to a smaller result set, potentially requiring less processing and memory.

5. **Nested Loop Join Optimization:**
   - The Nested Loop Join in Query C involves joining with the "locations" table. The Join Filter condition is `trip_requests.start_location_id = locations.id`. The optimizer may choose a more efficient strategy for this join, considering the additional filter condition.

6. **Reduced Memory Usage:**
   - The overall memory usage for Query C might be lower due to optimizations and the smaller result set, leading to better utilization of system resources.

## Brainstorming Outline

- start with task of admin dashboard to show recently completed trips (will just focus on query logic rather than display/view)
- simple schema diagram: User, TripRequest, Trip, Location (note that User is using STI with type for Driver and Rider)
- Also show corresponding Ruby models with associations and delegate so its clear how they can be joined (eg: TripRequest joins to Location twice, once as start_location and again as end_location: `belongs_to :start_location, class_name: 'Location'`)
- First Attempt: where there's no index on `trips.completed_at` (don't do joins at this point to keep explain analyze output simple): `Trip.where('trips.completed_at > ?', 1.week.ago)`
- show explain analyze -> sequence scan
- add index on completed_at -> note strong_migrations gem installed on project that errors on "naive" approach to adding index, fix it with concurrently, explain about avoiding locking table for reads and writes while index is applied
- Second Attempt: run `Trip.where(...)` again with explain analyze and compare improvement with index
- possibly also reference free visualization tool and how to extract detailed explain/analyze in json format
- Third Attempt: join location, riders, and drivers info but naively select *
- Fourth Attempt: reduce number of columns by selecting only what's needed in the report
- Fifth Attempt: reduce rows by focusing only on low trip ratings

## Scratch Schema

```sql
CREATE TABLE rideshare.trips (
    id bigint NOT NULL,
    trip_request_id bigint NOT NULL,
    driver_id integer NOT NULL,
    completed_at timestamp without time zone,
    rating integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

CREATE TABLE rideshare.users (
    id bigint NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    type character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    password_digest character varying,
    trips_count integer,
    drivers_license_number character varying(100)
);

CREATE TABLE rideshare.locations (
    id bigint NOT NULL,
    address character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    city character varying,
    state character(2) NOT NULL,
    "position" point NOT NULL,
    CONSTRAINT state_length_check CHECK ((length(state) = 2))
);

CREATE TABLE rideshare.trip_positions (
    id bigint NOT NULL,
    "position" point NOT NULL,
    trip_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);

CREATE TABLE rideshare.trip_requests (
    id bigint NOT NULL,
    rider_id integer NOT NULL,
    start_location_id integer NOT NULL,
    end_location_id integer NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);
```

## Scratch Models

```ruby
class User < ApplicationRecord
end

class Trip < ApplicationRecord
  belongs_to :trip_request
  belongs_to :driver, class_name: 'User', counter_cache: true
  has_many :trip_positions

  delegate :rider, to: :trip_request, allow_nil: false
end

class Location < ApplicationRecord
end

class TripRequest < ApplicationRecord
  belongs_to :rider, class_name: 'User'
  belongs_to :start_location, class_name: 'Location'
  belongs_to :end_location, class_name: 'Location'
  has_one :trip
end
```

## Scratch Trip Model with all versions of admin_report

```ruby
class Trip < ApplicationRecord
  belongs_to :trip_request
  belongs_to :driver, class_name: 'User', counter_cache: true
  delegate :rider, to: :trip_request, allow_nil: false

  # First attempt: Only focus on recently completed trips with no index on completed_at column
  # Second attempt: Re-run after adding index on completed_at, check results of explain/analyze for perf improvement
  def self.admin_report
    where('trips.completed_at > ?', 1.week.ago)
      .order(completed_at: :desc)
  end

  # Third attempt: Get additional data needed for admin report using joins, nested joins, and custom string join
  # ref: https://api.rubyonrails.org/classes/ActiveRecord/QueryMethods.html#method-i-joins
  # problem with naive select * approach is second time pulling in users table attributes override drivers/users
  # also, loads in more data than what we need because admin report doesn't need all those columns from every table
  # def self.admin_report
  #   joins(trip_request: [:start_location, :rider])
  #     .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
  #     .where('trips.completed_at > ?', 1.week.ago)
  #     .select('trips.*, locations.*, drivers.*, users.*')
  #     .order(completed_at: :desc)
  # end

  # Fourth attempt: Specify only the columns you need in select rather than *
  # def self.admin_report
  #   joins(trip_request: [:start_location, :rider])
  #     .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
  #     .where('trips.completed_at > ?', 1.week.ago)
  #     .select('trips.completed_at, trips.rating, locations.address,
  #              drivers.first_name || \' \' || drivers.last_name AS driver_name,
  #              users.first_name || \' \' || users.last_name AS rider_name')
  #     .order(completed_at: :desc)
  # end

  # Fifth attempt: focus only on trips with low ratings
  # def self.admin_report
  #   joins(trip_request: [:start_location, :rider])
  #     .joins('INNER JOIN users AS drivers ON drivers.id = trips.driver_id')
  #     .where('trips.completed_at > ?', 1.week.ago)
  #     .where('trips.rating <= ?', 3)
  #     .select('trips.completed_at, trips.rating, locations.address,
  #              drivers.first_name || \' \' || drivers.last_name AS driver_name,
  #              users.first_name || \' \' || users.last_name AS rider_name')
  #     .order(completed_at: :desc)
  # end

  # Maybe also mention pagination with limit/offset
end
```

## Scratch Pure SQL Solution

```sql
SELECT t.completed_at
  , t.rating
  , l.address
  , ud.first_name || ' ' || ud.last_name as driver_name
  , ur.first_name || ' ' || ur.last_name as rider_name
FROM trips t
  INNER JOIN trip_requests tr ON tr.id = t.trip_request_id
  INNER JOIN locations l on l.id = tr.start_location_id
  INNER JOIN users ud ON ud.id = t.driver_id
  INNER JOIN users ur on ur.id = tr.rider_id
ORDER BY t.completed_at DESC;
```

## Scratch Working with Rideshare

```bash
bin/rails db:truncate_all
bin/rails data_generators:generate_all
```



## TODO
* Only have 50_000 rows in trips/trip_requests, need 10M or more to see effect of index? Need pure sql loading solution, will be too slow via db/seeds.rb
* need more work on explanation of why at each step there was perf improvement based on analyzing the plan
* add results.length to the previous queries (was ~559?)
* `EXPLAIN` vs `EXPLAIN (ANALYZE)` (both show the plan but analyze option passed to explain also executes the query to get actual cost rather than just estimate produced  by explain alone)
* introduce rideshare schema and models
* main content
* conclusion para
* remove scratch content
* edit
