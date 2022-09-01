---
title: "Setup a Rails Project with Postgres and Docker"
featuredImage: "../images/multiple-tabs-cake-annie-spratt-6SHd7Q-l1UQ-unsplash.jpg"
description: "Learn how to scaffold a new Rails project with Postgres running in a Docker container for development."
date: "2023-02-01"
category: "rails"
related:
  - "Dockerize a Rails Application for Development"
  - "Using Heroku's pg:pull with Docker"
  - "Use UUID for primary key with Rails and Postgres"
---

## Steps

Install Postgres locally. Even though the Postgres database server will be run inside a Docker container, we still need the client installed on our laptop to connect to it. For a Mac, the easiest way is to use Homebrew. Note that you need to select your version, for example:

```
brew install postgresql@14
```

Scaffold a new Rails app, but specify that you want the database to be Postgres. Otherwise, the default option will use the SQLite database:

```
rails new blogpg --database=postgresql
cd blogpg
bundle install
```

Introduce a docker compose file... Explain about port mapping, host mount for one-time init, named volume for data persistence. Explain that even though there's only one service, its still more convenient to use docker compose than docker directly, less to type when starting, and we may add more services in the future such as Redis, Elasticsearch, Sidekiq etc.

Introduce init.sql to create role. Making use of Postgres image feature that any sql file mounted to init dir will run one time for initialization. It only runs if it detects that no database exists yet.

Modify database.yml... Explain about ENV || syntax so that for prod, it can use defaults. We're only using Docker for the database in development mode.

Start container(s) with docker compose.

Create database with `bin/rails db:create`

Verify with `psql` command line tool (got installed with homebrew earlier)

Using Rails Guide, generate model with `bin/rails generate model Article title:string body:text`. First - do the steps in router and generate Articles controller so we can be at same point that Rails Guide is.

## References

* [Homebrew Package Manager for Mac](https://brew.sh/)
* [Postgresql on Homebrew](https://formulae.brew.sh/formula/postgresql@14) - notice they're all versioned now!
* [Rails Getting Started Building Blog App](https://guides.rubyonrails.org/getting_started.html)
* [Rails Command Line Option for Database](https://guides.rubyonrails.org/command_line.html#rails-with-databases-and-scm)
* [Postgres Official Image on Docker Hub](https://hub.docker.com/_/postgres)

## TODO

* Intro para - something like: By default, when running `rails new...` will use SQLite database. This can be changed to specify a different database but will assume that the database is running on localhost. If you want the database running in a Docker container rather than locally, need to do a few more steps, this post will walk you through how to do this.
* Organize into subsections
* Feature image
* Specify what Ruby, Rails, and Node versions I'm using.
* Why would you want database in container for development? If switch between multiple projects, using different versions of database, or simply don't want a mess of databases always on and running locally (or have to remember to start/stop them).
* Explain port mapping to a different port than default 3306 in case someone does have Postgres running natively on laptop, avoid port conflict or strange situation where Rails app is attempting to read from the wrong database.
* Explain Postgres role === user
* Note that running database in Docker container only recommended for development, not production (performance).
* Conclusion para