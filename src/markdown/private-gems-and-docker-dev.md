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

So if everyone on your team is running the Rails project natively on their laptops, you would just update the README.md telling them to create their PAT, run the `bundle config...` command locally, then run `bundle install` which will pull the new private gem(s) specified in `Gemfile`.

However, things are a little more complicated if using a Dockerized setup for development. In this setup, it's the `Dockerfile` that runs `bundle install` when the image is being built. In this case, the `bundle config...` needs to be run as part of the image building, before bundle install, otherwise will get an authentication error when bundler tries to pull the private gem.

For example (TODO: hard-coded just for demo):

```Dockerfile
...
```

The `Dockerfile` is committed in the project. Don't want to commit this line because `USERNAME` will be different for each developer on the team and `TOKEN` is a user-specific secret that provides some access to the developer's Github account so that definitely should not be committed.

Solution:

Use `ARG` at beginning of Dockerfile, just after the `FROM` command. You can name these anything you want, but I like to be specific as to what these are used for:

```Dockerfile
FROM ruby:your-base-image

ARG GITHUB_USERNAME
ARG GITHUB_PAT_GEMS
```

Then later in Dockerfile, just before bundle install is run, add the config command. Replace `project` with project name where the private gem is hosted:

```Dockerfile
...
bundle config https://rubygems.pkg.github.com/project GITHUB_USERNAME:GITHUB_PAT_GEMS
```

Add gitignored `.env.dockercompose.local` with secrets

TODO...

Docker Compose File

TODO...

Build the image with docker compose

TODO...

Convenience Makefile task

## Other TODO

* Link to earlier post on Dockerizing Rails App for Development
* Include example line from Gemfile using a private gem
* Explanation of Docker `ARG`
* Note that there's also ~/.gemrc config but that's only if you need to *publish* a gem to private registry. For pulling with bundler, you need to run the `bundle config...` command.
* Warning this is only suitable for a development image that never gets pushed to production because the secrets become part of the image, and are also viewable in `docker history...`.