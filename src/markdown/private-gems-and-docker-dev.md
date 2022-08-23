---
title: "Private Gems and Docker for Development"
featuredImage: "../images/documentation-david-bruno-silva-Z19vToWBDIc-unsplash.jpg"
description: "Use a private gem registry with a Dockerized Rails application for development."
date: "2023-01-01"
category: "ruby"
related:
  - "Dockerize a Rails Application for Development"
  - "Dependabot PRs Need Their Secrets"
  - "Using Heroku's pg:pull with Docker"
---

If you're using Docker for development with a Rails application, and want to introduce a private gem registry hosted with [Github Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-rubygems-registry), you may encounter an authentication error when building the development Docker image, at the point where it tries to pull the private gem(s). This post will walk you through the steps to resolve this.

The Github documentation on configuring bundler so that you can pull private gems specifies the following command:

```
$ bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
```

`OWNER` is the user or organization account that owns the repository that contains the gem project source. `USERNAME` is in the individual user (Github account) that would like to pull the gem when building the Rails app that depends on it. `TOKEN` is a Github personal access token (aka PAT) that each user running the project needs to create.

If everyone on your team was running the Rails project natively on their laptops, you would just update the `README.md` telling them to create their PAT, run the `bundle config...` command locally, then run `bundle install` which will pull the new private gem(s) specified in `Gemfile`. You do keep your [project setup docs](../about-those-docs) up to date right?

However, things are a little more complicated if using a [Dockerized setup for development](../dockerize-rails-app-for-dev-debug-and-testing). In this setup, it's the `Dockerfile` that runs `bundle install` when the image is being built. In this case, the `bundle config...` needs to be run as part of the image building, before bundle install, otherwise will get an authentication error when bundler tries to pull the private gem.

For example:

```Dockerfile
FROM ruby:whatever-version
# ...
RUN bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
RUN bundle install
```

The problem with the above is that the `Dockerfile` is committed in the project. You wouldn't  want to commit this line as is, because `USERNAME` will be different for each developer on the team and `TOKEN` is a user-specific secret that provides some access to the developer's Github account so that definitely should not be committed.

## Dockerfile ARG

The [ARG](https://docs.docker.com/engine/reference/builder/#arg) command in a Dockerfile can be used when you need dynamic values as part of the build process. Specify the `ARG`s at beginning of Dockerfile, just after the `FROM` command. Rather than `USERNAME` and `TOKEN` from the Github documentation, I'm going to name these to be more specific as to what they're used for as shown below:

```Dockerfile
FROM ruby:your-base-image

ARG GITHUB_USERNAME
ARG GITHUB_PAT_GEMS
```

Then later in Dockerfile, just before bundle install is run, add the `bundle config...` command from the Github documentation, but this time, using the `ARG` variables. Replace `project` with project name where the private gem is hosted:

```Dockerfile
FROM ruby:whatever-version

ARG GITHUB_USERNAME
ARG GITHUB_PAT_GEMS

# ...

RUN bundle config https://rubygems.pkg.github.com/project GITHUB_USERNAME:GITHUB_PAT_GEMS
RUN bundle install
```

Now if you were building the Docker image directly, you could run:

```
docker build -t app-image:latest
  --build-arg GITHUB_USERNAME=your-github-username
  --build-arg GITHUB_PAT_GEMS=your-github-pat
  .
```

## Docker Compose

This project however uses several other services including MySQL and Redis, therefore, [Docker Compose](https://docs.docker.com/compose/) is used to build the image and run all the containers together. This means we need to be able to pass through the Docker `ARG`s from the `docker-compose.yml` file to the Dockerfile. Fortunately, docker compose provides the `args` keyword for the `build` command for just this purpose, however, this poses a new problem as you can see below:

```yml
# docker-compose.yml
version: "3.3"
services:
  app:
    build:
      args:
        GITHUB_USERNAME: uh oh, what to put here?
        GITHUB_PAT_GEMS: uh oh, what to put here?
      context: .

  db:
    image: mysql
    # ...

  redis:
    image: redis
    # ...
```

Since the `docker-compose.yml` file is also committed into the project, we do not want to hard-code Github user names and PAT in this file either. Fortunately, docker compose supports the use of [environment variables](https://docs.docker.com/compose/environment-variables/). Here's how to specify the Github username and PAT as environment variables in the compose file:

```yml
# docker-compose.yml
version: "3.3"
services:
  app:
    build:
      args:
        GITHUB_USERNAME: ${GITHUB_USERNAME}
        GITHUB_PAT_GEMS: ${GITHUB_PAT_GEMS}
      context: .

  db:
    image: mysql
    # ...

  redis:
    image: redis
    # ...
```

Next step is being able to pass the values of these environment variables to docker compose via the CLI. You can do this using the `--env-file` argument, passing in a path to a file containing the values:

```
docker-compose --env-file .env.dockercompose.local build
```

Where `.env.dockercompose.local` is a gitignored file that specifies the secrets. You can name this whatever you want, just make sure its in the `.gitignore` so it doesn't get committed:

```
GITHUB_USERNAME=your-github-username
GITHUB_PAT_GEMS=your-github-pat
```

This will make the values of `GITHUB_USERNAME` and `GITHUB_PAT_GEMS` from the .env file available to docker compose, which will then pass these on to the Dockerfile as ARG's, where they can then be used for the build.

## Makefile

To save yourself all that typing of the docker compose command with the env file, if your project uses a Makefile, you can add the following task:

```makefile
build:
  docker-compose --env-file .env.dockercompose.local build
```

Now whenever you need to build the image (such as when new gems have been added to the project's `Gemfile`), simply run:

```
make build
```

## TODO

* Featured image
* Why not `ENV`? Dockerfile does not provide a dynamic tool to set ENV value during the build process, and these values are only needed during build-time, not run time.
* Include example line from Gemfile using a private gem
* Note that there's also ~/.gemrc config but that's only if you need to *publish* a gem to private registry. For pulling with bundler, you need to run the `bundle config...` command.
* WARNING this is only suitable for a development image that never gets pushed to production because the secrets become part of the image, and are also viewable in `docker history...`. From docs: "It is not recommended to use build-time variables for passing secrets like github keys, user credentials etc. Build-time variable values are visible to any user of the image with the docker history command."
* conclusion
* consider References section with all links