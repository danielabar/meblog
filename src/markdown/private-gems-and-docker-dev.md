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

Rough outline...

If you're using Docker for development with a Rails application, and want to introduce a private gem registry hosted with [Github Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-rubygems-registry), you may run into some authentication errors when building the development Docker image. This post will walk you through the steps to resolve this.

Reading the Github docks on configuring bundler so that you can pull private gems:

```
$ bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
```

`OWNER` is the user or organization account that owns the repository that contains the gem project source. `USERNAME` is in the individual user (Github account) that would like to pull the gem when building the Rails app that depends on it. `TOKEN` is a Github personal access token (aka PAT) that each user running the project needs to create.

If everyone on your team was running the Rails project natively on their laptops, you would just update the README.md telling them to create their PAT, run the `bundle config...` command locally, then run `bundle install` which will pull the new private gem(s) specified in `Gemfile`.

However, things are a little more complicated if using a Dockerized setup for development. In this setup, it's the `Dockerfile` that runs `bundle install` when the image is being built. In this case, the `bundle config...` needs to be run as part of the image building, before bundle install, otherwise will get an authentication error when bundler tries to pull the private gem.

For example:

```Dockerfile
FROM ruby:whatever-version
# ...
RUN bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
RUN bundle install
```

The problem with the above is that the `Dockerfile` is committed in the project. Don't want to commit this line because `USERNAME` will be different for each developer on the team and `TOKEN` is a user-specific secret that provides some access to the developer's Github account so that definitely should not be committed.

Solution:

Use `ARG` at beginning of Dockerfile, just after the `FROM` command. You can name these anything you want, but I like to be specific as to what these are used for:

```Dockerfile
FROM ruby:your-base-image

ARG GITHUB_USERNAME
ARG GITHUB_PAT_GEMS
```

Then later in Dockerfile, just before bundle install is run, add the `bundle config...` command. Replace `project` with project name where the private gem is hosted:

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

This project however uses several other services including MySQL and Redis, therefore, docker compose is used to build the image and run all the containers together. This means we need to be able to pass through the Docker `ARG`s from the docker-compose.yml file to the Dockerfile. Fortunately, docker compose provides the `args` keyword for the `build` command for just this purpose, however, this poses a new problem as you can see below:

```yml
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

Since the docker-compose.yml file is also committed into the project, we do not want to hard-code Github user names and PAT in this file either. Fortunately, docker compose supports the use of environment variables, *and* a way to pass them in via the CLI:

```yml
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

To build the app image with docker compose, specifying the environment variables, you can pass in a file as follows:

```
docker-compose --env-file .env.dockercompose.local build
```

Where `.env.dockercompose.local` is a gitignored file that specifies the secrets:

```
GITHUB_USERNAME=your-github-username
GITHUB_PAT_GEMS=your-github-pat
```

## TODO

* Convenience Makefile task
* Why not `ENV`? Dockerfile does not provide a dynamic tool to set ENV value during the build process, and these values are only needed during build-time, not run time.
* Organize into subsections
* Link to earlier post on Dockerizing Rails App for Development
* Link to docker compose official docs
* Link to docker compose re: env vars: https://docs.docker.com/compose/environment-variables/
* Include example line from Gemfile using a private gem
* Explanation of Docker `ARG` - link to official docs ref: https://docs.docker.com/engine/reference/builder/#arg
* Note that there's also ~/.gemrc config but that's only if you need to *publish* a gem to private registry. For pulling with bundler, you need to run the `bundle config...` command.
* WARNING this is only suitable for a development image that never gets pushed to production because the secrets become part of the image, and are also viewable in `docker history...`. From docs: "It is not recommended to use build-time variables for passing secrets like github keys, user credentials etc. Build-time variable values are visible to any user of the image with the docker history command."
* conclusion
* consider References section with all links