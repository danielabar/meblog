---
title: "Using Heroku's pg:pull with Docker"
featuredImage: "../images/pull-rebecca-campbell-81UDWsR6Ehw-unsplash.jpg"
description: "Learn how to use Heroku's pg:pull command to get a copy of your production data when running Postgres locally in a Docker container."
date: "2021-04-01"
category: "PostgreSQL"
---

I recently starting using [Heroku](https://www.heroku.com/) to deploy a side project built with Rails and Postgres. Heroku is a PaaS (Platform as a Service) that makes it really easy to deploy web applications, and other related services such as a database. Since I'm not currently monetizing my side project, I selected the free tier, together with the Hobby Dev package for the database, which provides a limited amount of storage.

One thing you might like to do once there's some significant amount of production data in the database, is to make a copy of it to import into a locally running database. For local development you'd usually be using fake or test data (i.e. seeds in Rails). However, it can sometimes be useful to develop against real data. For example, when working on a data visualization app, having real data can help to determine if the data viz is providing any insight.

Heroku provides a convenient `pg:pull` command to pull data from a production database on Heroku to a locally running database. It's run from a terminal (given that you've already authenticated via `heroku login`). The basic structure of the command is:

```bash
heroku pg:pull your-heroku-db-name target-local-db-name --app your-heroku-app-name
```

Note that this command requires a postgres client to be installed locally, the easiest way on a Mac is via Homebrew: `brew update && brew cleanup && brew install postgresql` (actually installs both client and server but only client portion is needed).

The value of `your-heroku-app-name` is found on your Heroku dashboard, for example `mystic-wind-83`. The value of `your-heroku-db-name` can also be found from the Heroku dashboard by clicking on the app, the database name will be listed in the "Installed add-ons" section, for example `postgresql-sushi-123`. Finally, `target-local-db-name` is the name of a new database that will be created on your local Postgres, for example `my_prod_copy`. You can name this any valid database name but it must not already exist on your system. Putting this all together, the command would look like:

```bash
heroku pg:pull postgresql-sushi-123 my_prod_copy --app mystic-wind-83
```

However, since I'm running Postgres in a Docker container for my app, the `pg:pull` command returned the following error message:

```
heroku-cli: Pulling postgresql-sushi-123 ---> my_prod_copy
createdb: error: could not connect to database template1: could not connect to server: No such file or directory
	Is the server running locally and accepting
	connections on Unix domain socket "/tmp/.s.PGSQL.5432"?
```

According to the Heroku [docs](https://devcenter.heroku.com/articles/heroku-postgresql#pg-push-and-pg-pull), this error can result from not having the Postgres binaries in the `$PATH` because `pg:pull` ie essentially a wrapper around `pg_dump`. But this was not the root cause of this error in my case as `pg_dump` was indeed in the PATH. This can be verified as follows:

```bash
> type pg_dump
pg_dump is /usr/local/bin/pg_dump
> echo $PATH
...:/usr/local/bin:...
```

When running Postgres in a Docker container, the `PG_HOST` environment variable must be specified to tell Heroku where the running Postgres instance is (otherwise it's assuming localhost). For Docker, the value is `127.0.0.1`. Also, if you've specified a Postgres root user and password, those must also be specified as environment variables for the `pg:pull` command.

For example, my Postgres container is started via `docker-compose up` using the following `docker-compose.yml` file:

```yml
version: "3.8"

services:
  database:
    image: postgres:13
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: somethingSomething
      POSTGRES_USER: postgres

volumes:
  db_data:
```

So the final working command for Heroku to pull the production database to a local copy when using Docker is:

```bash
PGUSER=postgres PGPASSWORD=somethingSomething PGHOST=127.0.0.1 heroku pg:pull postgresql-sushi-123 my_prod_copy --app mystic-wind-83
```

Now you can connect to your newly created local database `my_prod_copy`. Note that the `pg:pull` command will not copy the production user/role, so you'll have to connect with your POSTGRES_USER/POSTGRES_PASSWORD credentials.