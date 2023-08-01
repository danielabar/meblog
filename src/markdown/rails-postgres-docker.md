---
title: "Setup a Rails Project with Postgres and Docker"
featuredImage: "../images/rails-postgres-docker-guillaume-bolduc-uBe2mknURG4-unsplash.jpg"
description: "Learn how to scaffold a new Rails project with Postgres running in a Docker container for development."
date: "2023-08-01"
category: "rails"
related:
  - "Dockerize a Rails Application for Development"
  - "Using Heroku's pg:pull with Docker"
  - "Use UUID for primary key with Rails and Postgres"
---

When scaffolding a new Rails project, the database flag can be used to specify a database other than the default SQLite, such as Postgres. However, the generated configuration will assume that the database is running on localhost, i.e. installed directly on your laptop or development machine. If instead you'd like the database running in a Docker container, a few more steps are necessary. This post will walk you through how to setup a new Rails project with a Postgres database running in a Docker container rather than the default SQLite running on localhost. It will be demonstrated using the [Rails Getting Started Guide](https://guides.rubyonrails.org/getting_started.html) which builds an example blog application. All the code explained in this post can be found in this [blogpg project](https://github.com/danielabar/blogpg) on Github.

<aside class="markdown-aside">
This post assumes some familiarity with Docker and Docker Compose. If you're new to these, checkout this <a class="markdown-link" href="https://www.pluralsight.com/paths/docker-fundamentals-for-developers">learning path</a> from Pluralsight (paid service). There's also a number of <a class="markdown-link" href="https://docs.docker.com/get-started/resources/">educational resources</a> listed on the Docker website.
</aside>

## Why?

But first, why would you want to use Docker to run your development database rather than simply installing it on your machine? There are a few benefits including:

**Version consistency:** Ideally, everyone on the team is running the same version locally as what's used in production. Suppose the production version gets upgraded, then every developer needs to remember to also upgrade their local installation. When the service is dockerized and run with Docker Compose, an upgrade just involves updating the image tag in the `docker-compose.yml` file and pushing to version control. Next time everyone pulls that change and runs `docker-compose up`, they'll automatically get the upgraded version. Version consistency also eliminates a source of [works on my machine](https://dzone.com/articles/works-on-my-machine) problems.

**Configuration consistency:** If your project requires some custom database configuration, it can be committed into the project and set in the container with a host mount. This leads to faster local setup as compared to adding an instruction in the `README.md` telling each developer to configure their database manually.

**Multiple versions and services:**: For a developer that works on multiple projects, they could be using different database versions and it would be tedious to have to constantly uninstall/re-install versions every time you switch projects. Also as you work on multiple projects, each may have different service requirements such as Postgres, MySQL, Elasticsearch, Redis, etc. I'd rather not have all of those always running on my laptop when not needed, or have to remember to start/stop them for each project. Using Docker, with Docker Compose simplifies this.

<aside class="markdown-aside">
All the benefits discussed above are for development, not production. The issue of whether a production database should be run in a container or not is outside the scope of this post. See some discussion <a class="markdown-link" href="https://stackoverflow.com/questions/48515460/is-it-recommended-to-use-database-as-a-container-in-production-environment">here</a> and follow the links to referenced blog posts if you want to learn more about this.
</aside>

Now that we've covered some benefits of using Docker locally for services, let's see how to setup Postgres in a container for a new Rails project.

## Getting Started

Install Postgres locally. Even though the Postgres database server will be run inside a Docker container, we still need the client installed on our laptop to connect to it. For a Mac, the easiest way is to use Homebrew. Note that you need to select your version. It's not necessary to start the service, so ignore the instruction at the end of the installation about starting Postgres.

```
brew install postgresql@14
```

Scaffold a new Rails app, but specify that you want the database to be Postgres. Otherwise, the default option will use a SQLite database:

```
rails new blogpg --database=postgresql
```

## Docker Compose

We'll use [Docker Compose](https://docs.docker.com/compose/) to manage starting and stopping containers. Typically Docker Compose is used to manage multiple services, but there's still benefits to using it even if you only have one service as in this case. It's more convenient to start a container with a simple command `docker-compose up` than to use the equivalent `docker run...` because the compose file handles passing in all arguments such as volumes, port mapping and environment variables. Also as the project grows, more services such as Redis, Sidekiq, etc may be added that will each require their own container. Using Docker Compose means they can all be started with a single command.

Add the following `docker-compose.yml` file to the root of the project:

```yml
version: "3.8"

services:
  database:
    image: postgres:14
    volumes:
      # Named volume to persist database data outside of container.
      # Format is "named_volume:path/in/container"
      - db_pg_data:/var/lib/postgresql/data

      # Host mount for one-time initialization.
      # Format is "./path/on/host:/path/in/container"
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      # Map to something other than default 5432 on host in case Postgres
      # is also running natively on host.
      # Format is "host:container"
      - "5434:5432"
    environment:
      # Sets the superuser password for PostgreSQL
      POSTGRES_PASSWORD: shhhhItsASecret

volumes:
  db_pg_data:
```

A few things to note here:

**image:** This specifies what image to use. By default, it will pull from the [Docker Hub](https://index.docker.io/search?q=) public registry. The `postgres` image refers to the [Official Postgres Image](https://hub.docker.com/_/postgres). Notice that the version tag `14` is specified. If you don't specify a tag, `latest` will be pulled which may not be what you want. Optionally you can use the `14-alpine` tag for a more minimal image.

**ports:** By default, Postgres listens on port 5432. When the database is running in a container rather than directly on the local machine, this port must be mapped to a port on the host, in order for the Rails application to be able to connect to it. Typically, you'll see the container port mapped to same port number on the host such as `"5432:5432"`. I prefer to choose a different port to map to on the host in case anyone on the team happens to be running Postgres locally on the default port, maybe from an earlier tutorial, or even just installing the client via homebrew, they may have chosen to start the service. The idea here is to avoid a port conflict where Docker is trying to use a port that's already in use by the host. Learn more about [ports](https://docs.docker.com/compose/compose-file/#ports).

**volumes:** There are two entries in the services - volumes section. The first is a named volume `db_pg_data:/var/lib/postgresql/data`. This maps the directory inside the container where Postgres stores all the data to a Docker volume named `db_pg_data`, which is defined at the end of the file in the `volumes` section. This will save all data outside of the container (you can list your volumes with the `docker volume ls` command). This means even if the container is removed, your data is still available.

The second is a host mount `./init.sql:/docker-entrypoint-initdb.d/init.sql`. It maps a file `./init.sql` from the project root (we'll create it in the next section) to a special directory in the container `docker-entrypoint-initdb.d`. This is a property of the official Postgres Docker image. Any sql files located in this directory can be used for one-time initialization. That is, when the container starts, it checks if the default `postgres` database already exists, if not, it runs all sql scripts found in the initdb directory. If a database does exist, then the files are ignored. Learn more about [volumes](https://docs.docker.com/compose/compose-file/#volumes).

**environment:** This section is used to set environment variables that will be available within the container. `POSTGRES_PASSWORD` sets the superuser password for the `postgres` user. Remember this is only a development image so this password isn't being used to protect production data. Optionally, you can set the `POSTGRES_HOST_AUTH_METHOD` to `trust`, and then the `POSTGRES_PASSWORD` environment variable is not required. Learn more about setting [environment variables](https://docs.docker.com/compose/compose-file/#environment) in Docker Compose.

## Initialization

The `docker-compose.yml` file explained in the previous section specifies a host mount for `init.sql`. When the Postgres container is run for the first time, it will detect that there is no default `postgres` database created yet, when this is the case, it will run all sql scripts located in the `docker-entrypoint-initdb.d` directory. Otherwise, if a default database does exist, this directory is ignored. This makes it perfect for performing one-time initialization.

We'll use this feature of the Postgres image to [create a role](https://www.postgresql.org/docs/current/sql-createrole.html) having the same name as the Rails database, in this case `blogpg` for our sample blog application. Create a file `init.sql` in the root of the Rails project with the following content:

```sql
-- Only used for development where Postgres is run in Docker
create role blogpg with createdb login password 'blogpg';
```

<aside class="markdown-aside">
Roles and users are similar concepts in Postgres, although there are some differences. A full discussion of this topic is outside the scope of this post, see this <a class="markdown-link" href="https://dba.stackexchange.com/questions/82271/postgresql-roles-versus-users-grant-permissions">question on DBA Stack Exchange</a> for more details.
</aside>

## Rails Database Config

The next step is to modify `config/database.yml` in the Rails project so that it can connect to the database running in the Docker container for `development` and `test`. It also needs the flexibility to connect to a different database for `production`.

Before making changes to this file, let's take a look at what gets generated from running the `rails new blogpg --database=postgresql` command:

```yml
# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: blogpg_development

test:
  <<: *default
  database: blogpg_test

production:
  <<: *default
  database: blogpg_production
  username: blogpg
  password: <%= ENV['BLOGPG_DATABASE_PASSWORD'] %>
```

Notice that there's no `host` or `port` specified in the default database configuration. This is because it's assumed that the database is running on `localhost`, i.e. the same machine as the Rails app is running on, and listening on the default Postgres port of `5432`. In our case, the database is running on the same machine, but inside a Docker container therefore `localhost` will not resolve. Instead we'll need to specify a host of `127.0.0.1`. As for the port, recall we mapped the default Postgres port of `5432` in the container to `5434` on the host so we'll also need to tell Rails about this.

We also need to make sure that different values can be specified in production. We'll make use of environment variables for this, together with the logical or operator `||` to use a default when the environment variable is not specified.

Here is the modified config file to support connecting to Postgres in a Docker container for development and test, and flexibility to specify a different database host, password, etc with environment variables for production:

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

Note that there's nothing Docker-specific in the `config/database.yml` file. All we've done is make it more flexible than what the Rails scaffold generated so that development and test can connect to databases other than that running on localhost and the default port.

## Start Container

Now it's time to try all this out and make sure everything's connected. Start the container(s) with docker compose:

```
docker-compose up
```

Since this is the first time this container is running, the default `postgres` database doesn't yet exist, so the console output should show that the `init.sql` script was run to create the `blogpg` role:

```
database_1  | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
database_1  | CREATE ROLE
...
database_1  | 2022-09-06 10:33:56.184 UTC [1] LOG:  database system is ready to accept connections
```

Note that you can stop the database at any time with `docker-compose stop` and then use the `up` command to restart it. The `CREATE ROLE` from `init.sql` will not run again because the default `postgres` database already exists. Next time you start the database, the following message will be displayed:

```
PostgreSQL Database directory appears to contain a database; Skipping initialization
```

### Force Init

This section is optional. If you made a typo in `init.sql` or for whatever reason want to force it to run again, this can be accomplished by removing the named volume that contains the Postgres data (make sure there's nothing important saved there or back it up first!). Since a container exists that is using the volume, it must be stopped and removed first, here are the steps to force init to run again:

```bash
# stop the running Postgres container
docker-compose stop

# remove the container (otherwise the volume cannot be removed)
docker-compose rm -f

# list all volumes - should see blogpg_db_pg_data in the output
docker volume ls

# remove the named volume
docker volume rm blogpg_db_pg_data

# start database container again - should show its running CREATE ROLE
docker-compose up
```

## Create Database

Next step is to create the Rails application database. Run the usual Rails command to do so:

```
bin/rails db:create
```

Use the `psql` command line tool (this got installed with homebrew earlier) to connect to Postgres running in the Docker container to verify the application database got created. Notice this command specifies `127.0.0.1` as the host and `5434` as the port because we need to connect to the Docker container rather than a database running directly on the laptop:

```bash
psql -h 127.0.0.1 -p 5434 -U blogpg
# enter password from init.sql
```

Use the `\l` command to list all databases - you should see `blogpg` and `blogpg_test` in the listing, which were created from running the `bin/rails db:create` command:

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

## Create and Populate Table

Now let's follow along with the Getting Started Rails Guide so we can get to the point of creating a table and populating it. Add the following to `config/routes.rb` to expose a route that will list all articles in the application:

```ruby
Rails.application.routes.draw do
  root "articles#index"
  get "/articles", to: "articles#index"
end
```

Use the Rails generator to scaffold an Articles controller and model, then run the migration (migration file got generated by the model generator) to create the `articles` table in the database:

```
bin/rails generate controller Articles index --skip-routes
bin/rails generate model Article title:string body:text
bin/rails db:migrate
```

Go back to the tab where `psql` is running and verify the `articles` table got created in the Postgres database running within Docker container. The `\dt` command lists all tables in the database you're connected to:

```
blogpg=> \dt
               List of relations
 Schema |         Name         | Type  | Owner
--------+----------------------+-------+--------
 public | ar_internal_metadata | table | blogpg
 public | articles             | table | blogpg
 public | schema_migrations    | table | blogpg
(3 rows)
```

We can see the `articles` table got created as well as the `schema_migrations` table Rails uses to keep track of migrations.

Now launch a Rails console with `bin/rails console` and create a new article:

```ruby
Article.create(
  title: "Hello Postgres Docker",
  body: "I'm being created in Postgres running in a Docker container"
)
```

Go back to the tab where `psql` is running and verify the new article record has been created:

```
blogpg=> select * from articles;
 id |         title         |                            body                             |         created_at         |         updated_at
----+-----------------------+-------------------------------------------------------------+----------------------------+----------------------------
  1 | Hello Postgres Docker | I'm being created in Postgres running in a Docker container | 2022-09-09 10:31:13.032458 | 2022-09-09 10:31:13.032458
(1 row)
```

## Verify Full Stack

To tie this all together, let's update the Articles controller `index` method and the Articles index view to display the articles so we can verify the full stack is working with the Dockerized database:

```ruby
# app/controllers/articles_controller.rb
class ArticlesController < ApplicationController
  def index
    @articles = Article.all
  end
end
```

```erb
<!-- app/views/articles/index.html.erb -->
<h1>Articles</h1>
<table>
  <tr>
    <th>Title</th>
    <th>Body</th>
  </tr>
  <% @articles.each do |article| %>
    <tr>
      <td><%= article.title %></td>
      <td><%= article.body %></td>
    </tr>
  <% end %>
</table>
```

Start the server with `bin/rails s`, navigate to `http://localhost:3000` and you should see an unstyled HTML table listing the one article created earlier:

![rails postgres docker articles index](../images/rails-postgres-docker-articles-index.png "rails postgres docker articles index")

Congratulations! You now have a running Rails application that is using a Dockerized Postgres database.

<aside class="markdown-aside">
Since the test database is also running in a Docker container, this will require Docker-specific setup to work on whatever CI (continuous integration) system your project is using. If using <a class="markdown-link" href="https://github.com/features/actions">Github Actions</a>, the host mount to the project source for initializing the database role doesn't work due to the order of how services and source checkout works. See my post on <a class="markdown-link" href="https://danielabaron.me/blog/debug-github-action/">Debugging Github Actions</a> for more details.
</aside>

## Conclusion

This post has walked through the steps required to setup a Rails application with a Postgres database running in a Docker container. It requires adding a `docker-compose.yml` file to the project. This file defines the database service including what Docker image to use, port mapping, volumes, and environment variables. Then the Rails project file `config/database.yml` must be modified so that the development and test databases are configured to point to the Dockerized database rather than assuming they're available on localhost. Finally the `psql` command line tool can be used to connect to the database in the container to verify the Rails application is populating it as expected.

## References

* [Example Rails Project with Postgres in Docker](https://github.com/danielabar/blogpg)
* [Homebrew Package Manager for Mac](https://brew.sh/)
* [Postgresql on Homebrew](https://formulae.brew.sh/formula/postgresql@14) - notice they're all versioned now!
* [Rails Getting Started Building Blog App](https://guides.rubyonrails.org/getting_started.html)
* [Rails Command Line Option for Database](https://guides.rubyonrails.org/command_line.html#rails-with-databases-and-scm)
* [Postgres Official Image on Docker Hub](https://hub.docker.com/_/postgres)
* [Postgres Docker Image Full Readme](https://github.com/docker-library/docs/blob/master/postgres/README.md)
* [Postgres user vs role](https://stackoverflow.com/questions/27709456/what-is-the-difference-between-a-user-and-a-role)
