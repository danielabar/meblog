---
title: "Dockerize a Rails application for Development"
featuredImage: "../images/docker-rails-shipping-containers.jpg"
description: "Dockerize a Rails application to support the full development workflow including debugging, testing, and working with databases"
date: "2020-09-20"
category: "rails"
---

At work, I was recently tasked with Dockerizing a Rails monolith. This app has a React front end built with Webpacker, client side dependencies managed with Yarn, and uses a MySQL database and Redis. The existing setup involved developers installing all dependencies on their laptops and took some non-trivial amount of time to get working. The goal of packaging everything with Docker was to make it easier and faster for new developers to get up and running. It was also important to ensure the project could still be run the "old fashioned" way, i.e. all dependencies installed directly on laptop. This was a hedge in case something was found that could not be made to work with Docker.

## Development Workflow

Although there are many benefits to using Docker for development, there are also some challenges such as how to run tests? how to debug? In order for the Docker setup to be effective, it needs to cover the entire development workflow, including:

1. Running the Rails app with changes to server side code made on host machine automatically reflected in container.
2. Running one-time setup tasks such as applying the schema to database and populating it with `db/seeds.rb`.
3. Running a Webpack dev server so that changes in client side code made on host machine are automatically compiled in container and browser is automatically refreshed to reflect these changes.
4. Running a background job processor (this project uses Active Job, but Sidekiq could be used instead).
5. Debugging with either a command line debugger (`binding.pry`) or an IDE such as VS Code.
6. Running one off commands such as applying database migrations or running tests.
7. Being able to access an interactive Rails console.

This post will walk through the setup, to achieve each of the above workflows steps. A quick note first - this post assumes knowledge of Docker concepts such as Images, Containers and Volumes. For those unfamiliar or new to Docker, I recommend the [Docker Deep Dive](https://www.pluralsight.com/courses/docker-deep-dive-update) course on Pluralsight course.

## Introducing docker-compose

According to [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/):
>Each container should have only one concern. Decoupling applications into multiple containers makes it easier to scale horizontally and reuse containers. For instance, a web application stack might consist of three separate containers, each with its own unique image, to manage the web application, database, and an in-memory cache in a decoupled manner.

Looking at what's needed to run a Rails app (server, webpacker, MySQL, Redis, etc), it becomes clear that each of these is a separate concern, therefore should be run in a separate container. However, these containers will need to communicate with each other, and be coordinated such that they run at the appropriate time. For example, it would not make sense for the container that seeds the database to start running before the container that houses the MySQL database is available.

[Docker Compose](https://docs.docker.com/compose/) is a great tool to coordinate and synchronize multiple containers for this purpose. Here is a visual representation of what we will be creating:

![docker compose rails](../images/dockerize-rails.png "Docker Compose Rails")

In order to proceed with the next steps in this post, make sure [Docker](https://docs.docker.com/get-docker/) is installed, this installation also comes with docker-compose.

## 1. Run Rails with changes on host machine reflected in container

Start by creating a `Dockerfile` at the root of the project as follows. This particular project uses Ruby version 2.6.6 and is deployed on Debian Stretch. It's a good idea to have the base image be the same as the projects' production environment. This provides an early warning in case of environment issues such as something that works on a laptop (eg: Mac or Windows) but fails or behaves differently in production (eg: Linux).

```Dockerfile
# Replace this with your Ruby version and Linux flavor/version
FROM ruby:2.6.6-stretch

# Package dependencies
RUN apt-get update && apt-get install -y curl build-essential gnupg mysql-client

# Replace with newer bundler version if using
RUN gem install bundler --no-document -v '1.17.3'

# Replace this with your Node version if newer than 10.x, this is for client side tooling.
# Install Node.js https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-debian-9
RUN curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs

# Skip this if your project uses npm instead of yarn
# Install yarn https://linuxize.com/post/how-to-install-yarn-on-debian-9/
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update
RUN apt install -y yarn
ENV PATH $(yarn global bin):$PATH

# Copy all project source to working directory
WORKDIR /app
COPY . /app

# Run server and client side builds. These steps are performed one time as part of the image build,
# so they don't need to be re-run each time a container is started.
RUN bundle check || bundle install
RUN yarn install --check-files
```

Next, create a `docker-compose.yml` file at the root of the project as follows. Note that the `web` service refers to the Dockerfile created previously:

```yml
version: "3.3"
services:
  # The main service that runs a Rails server
  web:
    build:
      context: .
      dockerfile: Dockerfile
    # This runs when container started as part of docker-compose up.
    command: bash -c "rm -f tmp/pids/server.pid && bundle exec rails s -b '0.0.0.0'"
    depends_on:
      - "db"
      - "redis"
    volumes:
      # Mount current directory as shared volume for development so that changes
      # made to local code will reflect on app running on container.
      - .:/app
      # Mount a persistent docker volume in place of local node_modules directory
      # this prevents yarn (or npm) errors in case developer has also been running the app natively.
      - node_modules:/app/node_modules
    ports:
      # Expose port 3000 from container to host so can run http://localhost:3000 in browser on laptop.
      - "3000:3000"
    environment:
      # Used in database.yml to tell Rails where the database is.
      DB_HOST: db
      RAILS_ENV: development
      REDIS_URL: "redis://redis/"

  # Run MySQL database
  db:
    # Replace with your MySQL version or refer to Postgres image if using.
    image: mysql:5.7
    volumes:
      # Use a named volume so that changes to db state will persist even if container removed.
      - db_data:/var/lib/mysql
    ports:
      # If a MySQL database is also running on laptop, map 3306 in container to a different port on host,
      # such as 3307. Otherwise can use "3306:3306" here. This is useful for connecting a SQL client from
      # host machine to container.
      - "3307:3306"
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
      # Replace with your app's database name
      MYSQL_DATABASE: appdb
      # Enable if required for development
      # MYSQL_USERNAME: appdbuser
      # MYSQL_PASSWORD: appdbpassword

  # Run Redis
  redis:
    image: redis:3
    ports:
      # If you're also running a Redis instance on host, map 6379 in container to a different port on host,
      # such as 6380. Otherwise can use "6379:6379" here. This is useful for connecting a Redis client from
      # host machine to container.
      - "6380:6379"

# All named volumes referenced by services must be listed here.
volumes:
  db_data:
  node_modules:
```

Next, modify the application's `database.yml` file to tell Rails where the database is located:

```yml
development
  adapter: mysql2
  # Use DB_HOST environment variable if set, otherwise default to localhost,
  # This ensures that project can still run the "old fashioned" way when everything
  # is installed directly on laptop.
  host: <%= ENV['DB_HOST'] || "127.0.0.1 %>
  # Replace with your app's database name
  database: appdb
```

Next, open a terminal and run the following commands to build the app image, and run the containers:

```bash
docker-compose build
docker-compose up
```

At this point, the containers should all start up (run `docker ps` to confirm), but the app won't work yet because the database schema has not been loaded. Hit <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop the containers, then continue to next step.

## 2. Run one-time database setup

This project makes use of `db/seeds.rb` to initialize the database with some sample data, which should only run on first time setup. The solution is to use an ephemeral container, based on the app image to issue the `rake db:reset` command, if the `INIT_DB` environment variable is set. This will drop the database if it already exists, then run `db:setup` which will create the database, load the schema (defined in `db/schema.rb` which gets populated every time a new migration is added), and run `db:seed` to populate the database.

Aside: See this [Stack Overflow Answer](https://stackoverflow.com/a/10302357/3991687) for an explanation of what all the various `rake db:xxx` tasks do.

One thing to watch out for, is that the `db:reset` command cannot run until the database is available to handle requests. We will use [wait-for-it.sh](https://github.com/vishnubob/wait-for-it) to solve this synchronization issue.

Download [wait-for-it.sh](https://github.com/vishnubob/wait-for-it) from Github and place it in project root.

Then modify `Dockerfile` so that this file is included in the image and made executable:

```Dockerfile
# Replace this with your Ruby version and Linux flavor/version
FROM ruby:2.6.6-stretch

# Package dependencies
RUN apt-get update && apt-get install -y curl build-essential gnupg mysql-client

# Replace with newer bundler version if using
RUN gem install bundler --no-document -v '1.17.3'

# Replace this with your Node version if newer than 10.x, this is for client side tooling.
# Install Node.js https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-debian-9
RUN curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs

# Skip this if your project uses npm instead of yarn
# Install yarn https://linuxize.com/post/how-to-install-yarn-on-debian-9/
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update
RUN apt install -y yarn
ENV PATH $(yarn global bin):$PATH

############## NEW SECTION TO ADD HERE #############################
# Use wait-for-it.sh to control startup order of containers
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
####################################################################

# Copy all project source to working directory
WORKDIR /app
COPY . /app

# Run server and client side builds. These steps are performed one time as part of the image build,
# so they don't need to be re-run each time a container is started.
RUN bundle check || bundle install
RUN yarn install --check-files
```

Then modify `docker-compose.yml` to define a new `dbcmd` service. Note that it's based on the same app image as the `web` service, which means that when `docker-compose build` is run, it won't need to run a separate build for this service because it can re-use the same image that's already been built for the `web` service.

```yml
version: "3.3"
services:
  # The main service that runs a Rails server
  web:
    build:
      context: .
      dockerfile: Dockerfile
    # This runs when container started as part of docker-compose up.
    command: bash -c "rm -f tmp/pids/server.pid && bundle exec rails s -b '0.0.0.0'"
    depends_on:
      - "db"
      - "redis"
    volumes:
      # Mount current directory as shared volume for development so that changes
      # made to local code will reflect on app running on container.
      - .:/app
      # Mount a persistent docker volume in place of local node_modules directory
      # this prevents yarn (or npm) errors in case developer has also been running the app natively.
      - node_modules:/app/node_modules
    ports:
      # Expose port 3000 from container to host so can run http://localhost:3000 in browser on laptop.
      - "3000:3000"
    environment:
      # Used in database.yml to tell Rails where the database is.
      DB_HOST: db
      RAILS_ENV: development
      REDIS_URL: "redis://redis/"

  # Ephemeral container to issue rake db:reset command
  dbcmd:
    # Use same image as `web` service to avoid multiple builds
    image: app
    # Make sure MySQL is up before attempting db population
    command: ["/wait-for-it.sh", "db:3306", "--", "./docker-entrypoint-dbcmd.sh"]
    depends_on:
      - "db"
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      DB_HOST: db
      RAILS_ENV: development
      # Usage to populate databases with seed data: INIT_DBS=yes docker-compose up
      INIT_DBS:

  # Run MySQL database
  db:
    # Replace with your MySQL version or refer to Postgres image if using.
    image: mysql:5.7
    volumes:
      # Use a named volume so that changes to db state will persist even if container removed.
      - db_data:/var/lib/mysql
    ports:
      # If a MySQL database is also running on laptop, map 3306 in container to a different port on host,
      # such as 3307. Otherwise can use "3306:3306" here. This is useful for connecting a SQL client from
      # host machine to container.
      - "3307:3306"
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
      # Replace with your app's database name
      MYSQL_DATABASE: appdb
      # Enable if required for development
      # MYSQL_USERNAME: appdbuser
      # MYSQL_PASSWORD: appdbpassword

  # Run Redis
  redis:
    image: redis:3
    ports:
      # If you're also running a Redis instance on host, map 6379 in container to a different port on host,
      # such as 6380. Otherwise can use "6379:6379" here. This is useful for connecting a Redis client from
      # host machine to container.
      - "6380:6379"

# All named volumes referenced by services must be listed here.
volumes:
  db_data:
```

Also add `docker-entrypoint-dbcmd.sh` to project root which contains the database reset commands for the development and test databases:

```sh
#!/bin/sh

set -e

if [ "$INIT_DB" = "yes" ]; then
  echo "=== INITIALIZING DATABASES"
  bin/rails db:environment:set RAILS_ENV=development && bundle exec rake db:reset
  bin/rails db:environment:set RAILS_ENV=test && bundle exec rake db:test:reset
fi
```

Now run the build again (since the `Dockerfile` was modified) and bring up the containers with the `INIT_DB` environment variable set to trigger database population:

```bash
docker-compose build
INIT_DB=yes docker-compose up
```

Now open a browser and navigate to [http://localhost:3000](http://localhost:3000), your app's homepage should load. It may be very slow due to webpacker compiling front end assets on demand, but not to worry, this will be resolved in the next step.

Before moving on to next step, make sure that the bind mount is working by making a small change to the server side code on your laptop, then check that it's reflected in the `web` container. For example, add some logging to the `index` method of the main controller:

```ruby
def index
  Rails.logger.info("Hello from Docker!)
end
```

Refresh the app in browser (assuming it's still on the main page) and watch the console output where `docker-compose up` is running, it should display `Hello from Docker!`.