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

Scaffold a new Rails app, but specify that you want the database to be Postgres. Otherwise, the default option will use a SQLite database:

```
rails new blogpg --database=postgresql
```

Introduce a docker compose file... Explain about port mapping, host mount for one-time init, named volume for data persistence. Explain that even though there's only one service, its still more convenient to use docker compose than docker directly, less to type when starting, and we may add more services in the future such as Redis, Elasticsearch, Sidekiq etc. Also preference for using official images from Docker Hub where possible. Specify version rather than `latest` to match database version used in production.

```yml
version: "3.8"

services:
  database:
    image: postgres:14
    volumes:
      - db_pg_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      # Map to something other than default 5432 on host in case Postgres is also running natively on host.
      - "5434:5432"
    environment:
      # Sets the superuser password for PostgreSQL
      POSTGRES_PASSWORD: shhhhItsASecret

volumes:
  db_pg_data:
```

Introduce init.sql to create role. Making use of Postgres image feature that any sql file mounted to init dir will run one time for initialization. It only runs if it detects that no database exists yet. This will create the role (aka user in Postgres):

```sql
-- Only used for development where Postgres is run in Docker
create role blogpg with createdb login password 'blogpg';
```

Modify database.yml... Explain about ENV || syntax so that for prod, it can use defaults. We're only using Docker for the database in development mode. Notice the port `5434` for development and test databases is from the port mapping in `docker-compose.yml`:

```yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  database: <%= ENV['DATABASE_NAME'] || "blogpg" %>
  username: <%= ENV['DATABASE_USER'] || "blogpg" %>
  password: <%= ENV['DATABASE_PASSWORD'] || "blogpg" %>
  port: <%= ENV['DATABASE_PORT'] || "5432" %>
  host: <%= ENV['DATABASE_HOST'] || "127.0.0.1" %>

development:
  <<: *default
  port: 5434

test:
  <<: *default
  database: blogpg_test
  port: 5434

production:
  <<: *default
  database: blogpg_production
  username: blogpg
  password: <%= ENV['BLOGPG_DATABASE_PASSWORD'] %>
```

Start container(s) with docker compose.

```
docker-compose up
```

Since we haven't yet created the `blogpg` database, the console output should show that the `init.sql` script was run to create the `blogpg` role:

```
database_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
database_1  | CREATE ROLE
...
database_1  | 2022-09-06 10:33:56.184 UTC [1] LOG:  database system is ready to accept connections
```

Create database with `bin/rails db:create`

Verify with `psql` command line tool (got installed with homebrew earlier)

```bash
psql -h 127.0.0.1 -p 5434 -U postgres
psql -h 127.0.0.1 -p 5434 -U blogpg
# enter password from init.sql
```

List all databases:

```
blogpg=> \l
                                  List of databases
    Name     |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges
-------------+----------+----------+------------+------------+-----------------------
 blogpg      | blogpg   | UTF8     | en_US.utf8 | en_US.utf8 |
 blogpg_test | blogpg   | UTF8     | en_US.utf8 | en_US.utf8 |
 postgres    | postgres | UTF8     | en_US.utf8 | en_US.utf8 |
 template0   | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
             |          |          |            |            | postgres=CTc/postgres
 template1   | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
             |          |          |            |            | postgres=CTc/postgres
(5 rows)
```

Keep this tab open, we'll come back to it to verify tables after creating and populating some models.

Now let's follow along with the Getting Started Rails Guide. Add the following to `config/routes.rb`:

```ruby
Rails.application.routes.draw do
  root "articles#index"
  get "/articles", to: "articles#index"
end
```

Generate controller with `bin/rails generate controller Articles index --skip-routes`.

Generate model with `bin/rails generate model Article title:string body:text`.
TODO: Why is this frozen?

Verify `articles` table got created in the Postgres database running within Docker container.
List all tables in `blogpg` database (where we're connected currently):

```
\dt
```



## References

* [Homebrew Package Manager for Mac](https://brew.sh/)
* [Postgresql on Homebrew](https://formulae.brew.sh/formula/postgresql@14) - notice they're all versioned now!
* [Rails Getting Started Building Blog App](https://guides.rubyonrails.org/getting_started.html)
* [Rails Command Line Option for Database](https://guides.rubyonrails.org/command_line.html#rails-with-databases-and-scm)
* [Postgres Official Image on Docker Hub](https://hub.docker.com/_/postgres)
* [Postgres Docker Image Full Readme](https://github.com/docker-library/docs/blob/master/postgres/README.md)
* [Postgres user vs role](https://stackoverflow.com/questions/27709456/what-is-the-difference-between-a-user-and-a-role)

## TODO

* Intro para - something like: By default, when running `rails new...` will use SQLite database. This can be changed to specify a different database but will assume that the database is running on localhost. If you want the database running in a Docker container rather than locally, need to do a few more steps, this post will walk you through how to do this. We'll do this by going through the Rails Getting Started Guide which builds a blog application, but rather than using the default SQLite database, we'll setup Postgres running in a Docker container.
* Mention that if you stop docker-compose and start up again, should not init role again, should see `PostgreSQL Database directory appears to contain a database; Skipping initialization`. This is because you ran create db and still have the named volume. If you delete the volume and start container again, role will be created again.
* Organize into subsections
* Feature image
* Specify what Ruby, Rails, and Node versions I'm using.
* Why would you want database in container for development? If switch between multiple projects, using different versions of database, or simply don't want a mess of databases always on and running locally (or have to remember to start/stop them).
* Explain port mapping to a different port than default 3306 in case someone does have Postgres running natively on laptop, avoid port conflict or strange situation where Rails app is attempting to read from the wrong database.
* Explain Postgres role === user
* Note that running database in Docker container only recommended for development, not production (performance).
* Conclusion para