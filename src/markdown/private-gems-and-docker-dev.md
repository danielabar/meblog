---
title: "Private Gems and Docker for Development"
featuredImage: "../images/private-gem-ilze-lucero-jLWLxX6i3R8-unsplash.jpg"
description: "Use a private gem registry with a Dockerized Rails application for development."
date: "2023-01-01"
category: "ruby"
related:
  - "Dockerize a Rails Application for Development"
  - "Dependabot PRs Need Their Secrets"
  - "Using Heroku's pg:pull with Docker"
---

If you're using Docker for development with a Rails application, and want to introduce a private gem registry hosted with [Github Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-rubygems-registry), you may encounter an authentication error when building the development Docker image, at the point where it tries to pull the private gem(s). This post will walk you through the steps to resolve this.

An important note before moving on - the solution presented in this post is only suitable for a *development* Docker image. That is, an image that remains on the developer's laptop and *never* gets pushed to production or made public.

## Configure Bundler

Given that your projects `Gemfile` is pulling some gems from Github Packages, for example:

```
source 'https://rubygems.pkg.github.com/some-project/' do
  gem 'myprivate_gem'
end
```

The Github documentation on configuring bundler so that you can pull private gems specifies that you must first run the following command:

```
$ bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
```

Where:

* `OWNER` is the user or organization account that owns the repository that contains the gem project source.
* `USERNAME` is in the individual user (Github account) that would like to pull the gem when building the Rails app that depends on it.
* `TOKEN` is a Github personal access token (aka [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)) that each user running the project needs to create.

If everyone on your team was running the Rails project natively on their laptops, you would just update the `README.md` telling each developer to create their  PAT, run the `bundle config...` command locally, then run `bundle install` which will pull the new private gem(s) specified in `Gemfile`. You keep your [project setup docs](../about-those-docs) up to date right?

<aside class="markdown-aside">
The Github documentation on private gems also refers to creating or updating your ~/.gemrc file, including the Github credentials in this file. However, this is only required for publishing gems, and will not be covered in this post.
</aside>

## Dockerized Development

However, things are a little more complicated if using a [Dockerized setup for development](../dockerize-rails-app-for-dev-debug-and-testing). With this setup, it's the `Dockerfile` that runs `bundle install` when the image is being built. For example:

```Dockerfile
FROM ruby:whatever-version
# ...
RUN bundle install
```

However, if any of the gems in the `Gemfile` are coming from a private registry, such as [Github Packages RubyGems](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-rubygems-registry), trying to build this image will fail with the following authentication error:

```
Authentication is required for rubygems.pkg.github.com.
Please supply credentials for this source. You can do this by running:
bundle config rubygems.pkg.github.com username:password
------
executor failed running [bundle install]: exit code: 17
```

This means the `bundle config...` needs to be run as part of the image building, before running `bundle install`, something like this:

```Dockerfile
FROM ruby:whatever-version
# ...
RUN bundle config https://rubygems.pkg.github.com/OWNER USERNAME:TOKEN
RUN bundle install
```

The problem with the above is that the `Dockerfile` is committed in the project. You wouldn't  want to commit this line as is, because `USERNAME` will be different for each developer working on the project. `TOKEN` is a user-specific secret that provides some access to the developer's Github account so that definitely should not be committed.

## Dockerfile ARG

What we need to solve this problem is *dynamic* values during the Docker build process. The [ARG](https://docs.docker.com/engine/reference/builder/#arg) command in a Dockerfile can be used for exactly this. Specify the `ARG`s at beginning of the `Dockerfile`, just after the `FROM` command. Rather than `USERNAME` and `TOKEN` from the Github documentation, I'm going to name these to be more specific as to what they're used for:

```Dockerfile
FROM ruby:your-base-image

ARG GITHUB_USERNAME
ARG GITHUB_PAT_GEMS
```

Then later in Dockerfile, just before bundle install is run, add the `bundle config...` command from the Github documentation, but this time, using the `ARG` variables. Replace `project` with project name where the private gem source is located:

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
docker build -t app-image:latest \
  --build-arg GITHUB_USERNAME=your-github-username \
  --build-arg GITHUB_PAT_GEMS=your-github-pat \
  .
```

To re-emphasize the note from the beginning of this post, using `ARG` in this way is only suitable for a development image that will never be made public. This is because the `ARG` values become part of the image and are viewable in the output of the `docker history` command. If you need build-time secrets for a production image, see the Docker documentation on [BuildKit](https://docs.docker.com/develop/develop-images/build_enhancements/#new-docker-build-secret-information).

<aside class="markdown-aside">
You may be wondering why not use <a class="markdown-link" href="https://docs.docker.com/engine/reference/builder/#env">ENV</a>? The reason is Docker does not provide a way to dynamically set ENV values during the build process, and these values are only needed during the image build time, not container run time. Read this <a class="markdown-link" href="https://www.baeldung.com/ops/dockerfile-env-variable">blog post</a> for more on this topic.
</aside>

## Docker Compose

This project uses several other services including MySQL and Redis, therefore, [Docker Compose](https://docs.docker.com/compose/) is used to build the image and run all the containers together. This means we need to be able to pass through the Docker `ARG`s from the `docker-compose.yml` file to the `Dockerfile`. Fortunately, docker compose provides the [args](https://docs.docker.com/compose/compose-file/compose-file-v3/#args) keyword for the `build` command for just this purpose.

Trying it out however poses a new problem as shown below:

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

Since the `docker-compose.yml` file is also committed into the project, we do not want to hard-code Github user names and tokens in this file either. Fortunately, docker compose supports the use of [environment variables](https://docs.docker.com/compose/environment-variables/). Here's how to specify the Github username and PAT as environment variables in the compose file:

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

Next step is being able to pass the values of these environment variables to docker compose via the command line. This can be accomplished with the `--env-file` argument, passing in a path to a file containing the values:

```
docker-compose --env-file .env.dockercompose.local build
```

Where `.env.dockercompose.local` is a gitignored file that specifies the secrets. You can name the .env file whatever you want, just make sure its in the [gitignore](https://git-scm.com/docs/gitignore) so it doesn't get committed. Here's what the env file will look like:

```
GITHUB_USERNAME=your-github-username
GITHUB_PAT_GEMS=your-github-pat
```

Now, when the docker-compose build command is run, it will have access to the values of `GITHUB_USERNAME` and `GITHUB_PAT_GEMS` from the .env file. Then these will get passed on to the `Dockerfile` as ARG's, where they can be used in building the image.

## Makefile

To save yourself all that typing of the docker compose command with the env file, if your project uses a `Makefile`, you can add the following task:

```makefile
build:
  docker-compose --env-file .env.dockercompose.local build
```

Now whenever you need to build the image (such as when new gems have been added to the project's `Gemfile`), simply run:

```
make build
```

Remember to also update the project's `README.md` with the new setup instructions that everyone wanting to build the image on their laptop needs to create a `.env.dockercompose.local` file and populate it with their Github username and personal access token.

<aside class="markdown-aside">
I've mentioned a few times about keeping the README.md up to date when making changes to the setup process that impact all the other developers working on the project. Although almost no one likes writing engineering documentation, they certainly appreciate having good, up to date docs. See my post on <a class="markdown-link" href="https://danielabaron.me/blog/about-those-docs/">engineering documentation</a> for what kinds of things should get documented and how to get in a good frame of mind for writing it.
</aside>

## Conclusion

This post has covered how to authenticate to the Github Packages RubyGems private registry when using Docker for Rails development. The technique involves use of Docker `ARG`s to specify dynamic build time values, docker compose environment variables to pass them through to the build, and a gitignored env file to avoid committing the secrets. Again a reminder that this technique should only be used for a development image that will never leave the developer's laptop.