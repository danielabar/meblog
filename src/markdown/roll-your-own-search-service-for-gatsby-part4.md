---
title: "Roll Your Own Search with Rails and Postgres: Search API"
featuredImage: "../images/roll-search-4.jpg"
description: "Learn how to build search service using Rails and Postgres Full Text Search for a Gatsby blog."
date: "2021-07-11"
category: "rails"
---

This is the fourth in a multi-part series of posts detailing how I built the search feature for this blog. This post will explain how to build a search API with Rails, using the [pg-search](https://github.com/Casecommons/pg_search) gem and how to deploy it to production.

In case you missed it, [Part 1: Search Introduction](../roll-your-own-search-service-for-gatsby-part1) of this series covers the existing options for adding search to a Gatsby site, and why I decided not to use any of them, and instead build a custom search service. [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2) covers the design and population of the `documents` table that contains all the content to be searched. [Part 3: Search Engine](../roll-your-own-search-service-for-gatsby-part3) provides an introduction to PostgreSQL Full Text Search, showing some examples of using it to write queries to search against a documents table.

## Install

First step is to add the `pg-search` gem to the `Gemfile` and run `bundle install`:

```ruby
# Postgres Full Text Search
gem 'pg_search'
```

## Model

Next step is to add a search scope to the `Document` model. This model and the population of the underlying `documents` table was covered in [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2). As a quick reminder, here are a few rows from this table, `body` column shortened for legibility:

```
hello=> select title, category, slug, left(body, 40) as body from documents;
                               title                                |     category     |                          slug                           |                   body
--------------------------------------------------------------------+------------------+---------------------------------------------------------+------------------------------------------
 Add a Language to gatsby-remark-vscode                             | web development  | /blog/add-language-gatsby-remark-vscode/                |  This blog is built with [Gatsby](https:
 A VS Code Alternative to Postman                                   | Web Development  | /blog/postman-alternative-vscode/                       |  If youve been doing web development for
 Rails CORS Middleware For Multiple Resources                       | rails            | /blog/rails-cors-middleware-multiple/                   |  A short post for today on a usage of [C
 TDD by Example: Fixing a Bug                                       | javascript       | /blog/tdd-by-example-bugfix/                            |  This post will demonstrate an example o
 Saving on monthly expenses - A Cautionary Tale                     | personal finance | /blog/save-monthly-expense-caution/                     |  Today I want to share a cautionary tale
 Rails Blocked Host Solved by Docker Cleanup                        | rails            | /blog/rails-blocked-host-docker-clean/                  |  Today I want to share a debugging story
 ...
```

And here is the current model class:

```ruby
# app/models/document.rb

class Document < ApplicationRecord
  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
end
```

`pg_search_scope` from the `pg_search` gem is used to define a method on the model class that will execute a full text search against the `documents` table. It accepts a hash of options, of which the `against` property is required, to specify an array of fields to be searched. The `PgSearch::Model` module must also be included in the model. For example, to search the  `body` field:

```ruby
# app/models/document.rb

class Document < ApplicationRecord
  include PgSearch::Model
  pg_search_scope :search_doc,
                  against: %i[body]

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
end
```

To see this in action, open a Rails console with `bin/rails c` and run the `search_doc` method on the `Documents` model for search term `tdd`.

I've inserted some line breaks in the query that the gem generated and the results for legibility:

```ruby
irb(main):003:0> Document.search_doc('tdd')

  Document Load (138.8ms)
  SELECT "documents".*
  FROM "documents"
  INNER JOIN (
    SELECT "documents"."id" AS pg_search_id,
      (ts_rank((to_tsvector('english', coalesce("documents"."body"::text, ''))), (to_tsquery('english', ''' ' || 'tdd' || ' ''')), 0)) AS rank
    FROM "documents"
    WHERE ((to_tsvector('english', coalesce("documents"."body"::text, ''))) @@ (to_tsquery('english', ''' ' || 'tdd' || ' ''')))) AS pg_search_9b16b44d0e0a5cac4f968b
  ON "documents"."id" = pg_search_9b16b44d0e0a5cac4f968b.pg_search_id
  ORDER BY pg_search_9b16b44d0e0a5cac4f968b.rank DESC, "documents"."id" ASC
  LIMIT $1  [["LIMIT", 11]]

=> #<ActiveRecord::Relation [
    #<Document id: 15, title: "TDD by Example", description: "A practical example of using TDD to add a new feat...", category: "javascript", published_at: "2021-01-02", slug: "/blog/tdd-by-example/", body: " If youve been coding for any length of time, youv...", created_at: "2021-06-26 19:18:51", updated_at: "2021-06-26 19:18:51", excerpt: "If youve been coding for any length of time, youve...">,

    #<Document id: 6, title: "TDD by Example: Fixing a Bug", description: "A practical example of using TDD to fix a bug and ...", category: "javascript", published_at: "2021-05-16", slug: "/blog/tdd-by-example-bugfix/", body: " This post will demonstrate an example of using TD...", created_at: "2021-06-26 19:18:51", updated_at: "2021-06-26 19:18:51", excerpt: "This post will demonstrate an example of using TDD...">,

    #<Document id: 12, title: "Solving a Python Interview Question in Ruby", description: "Learn how to model tuples in Ruby and solve a Pyth...", category: "ruby", published_at: "2021-03-01", slug: "/blog/python-interview-question-in-ruby/", body: " A few months ago, I came across a tweet posing a ...", created_at: "2021-06-26 19:18:51", updated_at: "2021-06-26 19:18:51", excerpt: "A few months ago, I came across a tweet posing a t...">
  ]>
```

The `ts_vector`, `ts_query`, and `ts_rank` Postgres functions were covered in [Part 3: Search Engine](../roll-your-own-search-service-for-gatsby-part3) of this series. As a reminder, here was the query to search the documents `body` field for the search term `tdd` and order results by descending rank:

```sql
SELECT
  title,
  slug,
  ts_rank(
   to_tsvector('english', body),
   to_tsquery('english', 'TDD')
  ) as rank
FROM documents
WHERE
  to_tsvector('english', body) @@ to_tsquery('english', 'TDD')
ORDER BY rank DESC;
```

Adding the `pg_search_scope` to the model enabled executing a full text search against PostgreSQL, without having to write this query in the model. The generated query also uses the PostgreSQL `coalesce` function which returns the first non null value from its given list of arguments. This is to ensure that a null value will not get passed to the ts_vector function. For example `coalesce("documents"."body"::text, '')` will return an empty string if it encounters a null `body` field in the `documents` table.

Also note the generated query returns a max of 11 results, as set by the `LIMIT` option.

The result of the generated `search_doc` function is an `ActiveRecord::Relation`, representing the list of `Document` model results that match the query. In this example, the first two are articles explicitly on TDD, and the last is an article about solving an interview question, in which the TDD approach is used. These are the same results we saw when running the simpler version of the query against using the `psql` client in [Part 3: Search Engine](../roll-your-own-search-service-for-gatsby-part3) of this series.

The gem also supports searching by multiple fields. For example, to search by `body`, and `title`:

```ruby
# app/models/document.rb

class Document < ApplicationRecord
  include PgSearch::Model
  pg_search_scope :search_doc,
                  against: %i[body title]

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
end
```

Now the generated query includes both `documents.body` and `documents.title`:

```ruby
irb(main):007:0> Document.search_doc('tdd')

Document Load (131.1ms)
SELECT "documents".*
FROM "documents"
INNER JOIN (
  SELECT "documents"."id" AS pg_search_id,
    (ts_rank((to_tsvector('english', coalesce("documents"."title"::text, '')) || to_tsvector('english', coalesce("documents"."body"::text, ''))), (to_tsquery('english', ''' ' || 'tdd' || ' ''')), 0)) AS rank
  FROM "documents"
  WHERE ((to_tsvector('english', coalesce("documents"."title"::text, '')) || to_tsvector('english', coalesce("documents"."body"::text, ''))) @@ (to_tsquery('english', ''' ' || 'tdd' || ' ''')))) AS pg_search_9b16b44d0e0a5cac4f968b
ON "documents"."id" = pg_search_9b16b44d0e0a5cac4f968b.pg_search_id
ORDER BY pg_search_9b16b44d0e0a5cac4f968b.rank DESC, "documents"."id" ASC
LIMIT $1  [["LIMIT", 11]]

# Results are the same as before for this example
```

For my blog search, this is all I need from the `pg-search` gem. However, I've barely scratched the surface of all the available features, see the [docs](https://github.com/Casecommons/pg_search) if you need more features.

## Route and Controller

It's great that there's an easy way to search the `Document` model, but recall the goal of this exercise is to build a search API accessible over HTTP so that the Gatsby blog can make use of it. This will require exposing a route such as `GET /search?q=foo` and a controller to handle this route, delegating the heavy lifting of search to the `Document` model.

Starting with the route. This will be read only so only exposing the `index` method:

```ruby
# config/routes.rb

Rails.application.routes.draw do
  resources :search, only: %i[index]
end
```

Since the resource is named `search`, Rails will expect a search controller with an `index` method. This will only be used for an HTTP API so it only returns json:

```ruby
# app/controllers/search_controller.rb

class SearchController < ApplicationController
  def index
    q = params[:q]

    respond_to do |format|
      format.json { render json: Document.search(q) }
    end
  end
end
```

What is this method `Document.search`? Recall earlier when hooking up the `pg_search` gem to the `Document` model, we defined a search scope of `search_doc`. However, this won't be suitable for calling directly from the API because that would expose *all* fields from the Document model including the `body` field, primary id and auto generated timestamps. These aren't necessary for the API results.

The `body` field specifically is huge and unnecessary because the blog contains the actual article content. It only needs the slug returned in API results to generate a link to the article.

So I've added a new `search` method on the `Document` model to wrap the call to `search_doc` and convert the results to an api format that limits the returned fields:

```ruby
# app/models/document.rb

class Document < ApplicationRecord
  include PgSearch::Model
  pg_search_scope :search_doc,
                  against: %i[title body]

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true

  # NEW METHOD:
  #   1. Wrap call to search_doc generated by pg_search gem.
  #   2. Convert results to limit which fields are returned.
  def self.search(query)
    docs = Document.search_doc(query)
    docs.map(&:to_api)
  end

  def to_api
    {
      title: title,
      description: description,
      category: category,
      published_at: published_at,
      slug: slug,
      excerpt: excerpt
    }
  end
end
```

Now that the route and controller are in place, run `bin/rails routes` to verify the route is available:

```
$ bin/rails routes
Prefix        Verb   URI Pattern                   Controller#Action
search_index  GET    /search(.:format)             search#index
```

## API

To see the search route in action, we'll create a `search.http` file and use a VS Code REST client extension to execute some search requests. I've written about this [useful extension](../postman-alternative-vscode) before.

Start by defining the `host` variable as a rest-client environment variable in a project-specific `settings.json` file:

```json
// .vscode/settings.json

{
  "rest-client.environmentVariables": {
    "local": {
      "host": "http://localhost:3000",
    },
    "production": {
      "host": "https://prod-host.com",
    }
  }
}

```

Then create an http file to contain all the search requests, let's start with just one request to search for `tdd`:

```http
# http/search.http

GET {{host}}/search?q=tdd
Accept: application/json
```

Hit <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Opt</kbd> + <kbd class="markdown-kbd">E</kbd> to select the `local` environment from the environment selector that pops up.

Then hit <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Opt</kbd> + <kbd class="markdown-kbd">R</kbd> while the cursor is anywhere on the `GET` request line to run it.

A new editor tab will open up in a side-by-side view with the results of executing the search request against the local Rails server. Here are the results. These are the same three articles we saw before when invoking the `search_doc` method on the `Document` model, but this time, only the API fields are returned.

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "title": "TDD by Example",
    "description": "A practical example of using TDD to add a new feature to an existing project.",
    "category": "javascript",
    "published_at": "2021-01-02",
    "slug": "/blog/tdd-by-example/",
    "excerpt": "If youve been coding for any length of time, youve probably heard that you should test your code, and by that I mean writing automated…"
  },
  {
    "title": "TDD by Example: Fixing a Bug",
    "description": "A practical example of using TDD to fix a bug and do some refactoring on an existing project.",
    "category": "javascript",
    "published_at": "2021-05-16",
    "slug": "/blog/tdd-by-example-bugfix/",
    "excerpt": "This post will demonstrate an example of using TDD (test driven development) to fix a bug on an existing project. If youre not familiar…"
  },
  {
    "title": "Solving a Python Interview Question in Ruby",
    "description": "Learn how to model tuples in Ruby and solve a Python data science interview question in Ruby.",
    "category": "ruby",
    "published_at": "2021-03-01",
    "slug": "/blog/python-interview-question-in-ruby/",
    "excerpt": "A few months ago, I came across a tweet posing a technical interview question for a data science position using Python:  Lets set aside for…"
  }
]
```

To add more search examples to the http file, separate them with `###`. For example, to see how it behaves when no results are found:

```http
```http
# http/search.http

# Example request that returns results
GET {{host}}/search?q=tdd
Accept: application/json

###

# Example request when no results found
GET {{host}}/search?q=zzzzzzzzz
Accept: application/json
```

Running the search for `zzzzzzzzz` returns an empty array because no documents match this search term:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[]
```
## Automated Tests

This article is getting quite lengthy, so rather than going over the document and search request tests in detail, here are the links to the RSpec test files for these:

* [Document Model Tests](https://github.com/danielabar/hello-visitor/blob/main/spec/models/document_spec.rb)
* [Search Request Tests](https://github.com/danielabar/hello-visitor/blob/main/spec/requests/search_spec.rb)

## CORS

The last thing that is needed for the search feature is to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) because the blog that needs to make requests to the search service is hosted on a different server (Github Pages) than the Rails search service (Heroku). In Rails, this can be configured using the `rack-cors` middleware. See an earlier [article](../rails-cors-middleware-multiple) I wrote about this for more details.

Here is the configuration. `ALLOWED_ORIGIN` gets set to the blog url in production. For example, if the blog (or any web site really) that needs to access the search service is hosted at `https://my-awesome-blog.com`, then the `ALLOWED_ORIGIN` environment variable would be set to `https://my-awesome-blog.com`.

```ruby
# config/initializers/cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['ALLOWED_ORIGIN'] || 'http://localhost:8000'
    resource '/search', headers: :any, methods: %i[get]
  end
end
```

## Deployment

Now that the search service is working locally, it's time to deploy it. I'm using Heroku with the PostgreSQL add-on so these instructions will be specific to that platform.

The `search.sql` file mentioned in instructions below was covered in [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2) of this series.

```bash
# Install the Heroku CLI
brew tap heroku/brew && brew install heroku

# Create an app
cd /path/to/project
heroku create

# Given that all changes are merged to main branch, deploy to Heroku
git push heroku main

# Run migrations (this will create the documents table)
heroku run rake db:migrate

# Configure environment variable used by CORS initializer
heroku config:set ALLOWED_ORIGIN=https://your.blog.com

# Ingest search documents
cat ~/path/to/search.sql | heroku pg:psql --app app-name
```

To test that it's working on Heroku:

* Update the `.vscode/settings.json` file, `production` section with the Heroku host. This will be something like `https://your-app-name.herokuapp.com`.
* Hit <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Opt</kbd> + <kbd class="markdown-kbd">E</kbd> to select the `production` environment from the environment selector that pops up.
* Run the `GET {{host}}/search?q=tdd` search request, this time it should return the same results but from the production server.

If the production request doesn't succeed, check the Heroku logs with `heroku logs --tail` for further investigation.
## What's Next?

This post explained how to build a search service API using Rails and PostgreSQL with the help of the [pg-search](https://github.com/Casecommons/pg_search) gem and how to deploy it. Next up, see [Part 5: Search GUI](../roll-your-own-search-service-for-gatsby-part5) for how to build the search UI components of the Gatsby blog, which will tie everything in this series together.