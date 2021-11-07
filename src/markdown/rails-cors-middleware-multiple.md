---
title: "Rails CORS Middleware For Multiple Resources"
featuredImage: "../images/rails-middleware-erik-witsoe-bluVshKGwKQ-unsplash.jpg"
description: "Add multiple blocks to Rails CORS middleware to support multiple endpoints."
date: "2021-06-04"
category: "rails"
related:
  - "Construct a PATCH request for a JSON API"
  - "Fix Rails Blocked Host Error with Docker"
  - "Dockerize a Rails Application for Development"
---

A short post for today on a usage of [CORS Middleware](https://github.com/cyu/rack-cors) for Rails (well any Rack application) that wasn't obvious from the docs - how to specify multiple endpoints, or resources?

If you want Javascript from a web page that is hosted on a different domain than your Rails app (or any app actually) to make HTTP API calls to the Rails app, it will require adding CORS support (Cross-Origin Resource Sharing) on the app server. Otherwise the request will fail due to the [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).

In my case, I have a Rails server that provides some back end services for this blog (which is statically hosted on Github Pages). So the blog and Rails server live on different domains. One of the services is privacy focused analytics. Visits to blog pages are recorded via a `POST {{my-rails-server}}/visits` with some information about the page being visited and user agent (but no cookie is used for further tracking, hence the privacy focus).

In order for the POST from the blog hosted on Github Pages to be allowed through to the Rails server, the Rails server needs to have CORS middleware configured as follows:

```ruby
# Gemfile
gem 'rack-cors'
```

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://danielabaron.me'
    resource '/visits', headers: :any, methods: %i[post]
  end
end
```

This allows the `POST` HTTP method on the `/visits` resource, only from the origin `https://danielabaron.me`.

## Multiple Resources

This has been working well, but recently I added a second service to the Rails server which also needed to be accessible to the blog with CORS. This is a search service, backed by Postgres full-text search. The API is available via a `GET {{my-rails-server}}/search?q=whatever`.

Looking at the [Configuration Reference](https://github.com/cyu/rack-cors#configuration-reference) for the Rails/Rack CORS middleware gem, I couldn't determine how to add a second `resource` to the cors middleware configuration. It says:

> A Resource path can be specified as exact string match (/path/to/file.txt) or with a * wildcard (/all/files/in/*)

I already had an exact string match `/visits`, and only wanted to allow exactly one more `/search`. A wildcard wouldn't work for this.

## Solution

Turns out, this middleware supports multiple blocks. To allow CORS for two different, exactly specified resources, the following works:

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://danielabaron.me'
    resource '/visits', headers: :any, methods: %i[post]
  end

  allow do
    origins 'https://danielabaron.me'
    resource '/search', headers: :any, methods: %i[get]
  end
end
```

## Local Development

One final tweak to support local development. When developing on this blog (or whatever web app you're working on), it will be running on localhost, for example `http://localhost:8000`, and the Rails server also runs locally at `http://localhost:3000`. In this case, the Rails server should accept CORS requests from `http://localhost:8000`. To get this flexibility, use an environment variable `ALLOWED_ORIGIN` as follows:

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['ALLOWED_ORIGIN'] || 'http://localhost:8000'
    resource '/visits', headers: :any, methods: %i[post]
  end

  allow do
    origins ENV['ALLOWED_ORIGIN'] || 'http://localhost:8000'
    resource '/search', headers: :any, methods: %i[get]
  end
end

Rails.logger.info("Cors Configured to allow origin: #{ENV['ALLOWED_ORIGIN'] || 'http://localhost:8000'}")
```

When the Rails server runs locally, don't specify any environment variable and it defaults to allowing `localhost` requests. For production (or any other environment), run the server with the `ALLOWED_ORIGIN` environment variable set to the origin that requires access.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.
