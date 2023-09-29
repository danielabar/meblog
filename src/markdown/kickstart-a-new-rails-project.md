---
title: "Kickstart a New Rails Project"
featuredImage: "../images/tbd.jpg"
description: "Discover the essential steps and gems for launching a new Rails project. From setting up services in Docker containers to harnessing the power of RSpec, FactoryBot, and other must-have tools."
date: "2024-03-01"
category: "rails"
related:
  - "tbd"
  - "tbd"
  - "tbd"
---

Embarking on a new Rails project is both thrilling and challenging. To ensure a smooth start, it's essential to lay down a practical and efficient groundwork. In this guide, we'll dive into the nuts and bolts of setting up a new Rails project with a focus on simplicity and productivity. We'll explore critical steps like configuring PostgreSQL and integrating Tailwind CSS, optimizing your development environment through Docker, and adopting developer-friendly tools like RSpec, FactoryBot, and more. This guide is all about sharing practical tips and proven practices that I've found invaluable in my own journey. So, let's cut to the chase and get your Rails project off to a strong start.

## Rough Notes WIP...

## Initialization

At the time of this writing:

```bash
ruby --version
# ruby 3.2.2 (2023-03-30 revision e51014f9c0) [arm64-darwin22]

rails --version
# Rails 7.0.8
```

Generate new project with Postgres and TailwindCSS:

```bash
rails new retro-pulse --css tailwind --database=postgresql
```

Note: This assumes you're previously installed postgres, for example: `brew install postgresql@14`

Aside: Yes TailwindCSS can be controversial, and before I had tried it, my thought was "why not just stick with vanilla CSS?", but then I took a course (share notes and course link) and formed a different opinion. I guess this goes in the bucket of "don't knock it till you try it".

## Database

Run Postgres in a Docker container (link to my other post), also mention its convenient if you later want to add redis for sidekiq or actioncable for example.
Maybe quickly show docker-compose.yml, init.sql and database.yml, without all the explanations, and link to my post for more details.

Ensure `structure.sql` will be generated instead of `schema.rb`, when migrations are run:
```ruby
# config/application.rb
config.active_record.schema_format = :sql
```

Before moving on to further setup, this is a good time to ensure database can be started and created with `bin/setup`, should see output like:
```
== Preparing database ==
Created database 'retro_pulse'
Created database 'retro_pulse_test'
```

Then launch a psql session with `bin/rails db`, which will connect you to the dev database. Then run `\d` at the psql prompt to list tables, you should see:
```
                 List of relations
 Schema |         Name         | Type  |    Owner
--------+----------------------+-------+-------------
 public | ar_internal_metadata | table | retro_pulse
 public | schema_migrations    | table | retro_pulse
(2 rows)
```

Add [annotate](https://github.com/ctran/annotate_models) gem to development and test sections of Gemfile:

```ruby
# Gemfile
group :development, :test do
  gem "annotate"
  # ...
end
```

Run the [install command](https://github.com/ctran/annotate_models#configuration-in-rails) so that running database migrations will automatically prepend schema information to the models and tests (more on testing later). This is beneficial when working with a model, such as adding scopes or other methods, to see what columns, indexes, and constraints are available.

```bash
bundle install
rails g annotate:install
```

## Code Quality and Style

Add Rubocop and a few extensions, then my .rubocop.yml in project root

## Testing...

RSpec instead of Minitest, FactoryBot for creating test data (mention use build_stubbed where possible over create for performance), shoulda matchers

## Other Dev Tooling

Add solargraph gem, TODO: explanation! Cmd + click into gems from VSCode (goes along with VSCode extension). Ideally the RubyLSP extension from Shopify would provide this, but not yet at the time of this writing

Faker gem for seed data (can also use it in factories for test data)

## Service Layer Placeholder

Configure `services` dir. Needs explanation, Rails not opinionated about how you organize business logic. Projects go through phases like:
- at first simple, not too many models, logic is in controller - easy to write but hard to test
- gradually some logic starts to move to AR models - but these are really about querying the database, and they get too big, especially the main models such as a `Product` model in an e-commerce app
- then eventually services (or interactors - todo link) get introduced. But there's never time to go back and refactor all business logic out of controllers and models into services so the project ends up like an archaeological dig, depending on how far back in time you go, will find different techniques. I've seen this so often that might as well go in with a services layer from the beginning to keep things clean and organized.

## TODO
* Mention will walkthrough setting up an actual application that I'm starting on retro-pulse
* Include example of model class with result of annotate
* Explain why I prefer structure.sql over schema.rb
* if applicable, organize into subsections by category such as database, style, dev convenience?
* Maybe mention each project may require more, but this is the bare bones I've found that I always reach for in every project
* feature image
* related
* intro para needs work
* main content
* conclusion para
* edit
