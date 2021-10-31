---
title: "Build a CI/CD Pipeline for a Gatsby Site"
featuredImage: "../images/ci-cd-pipeline-gatsby-ej-strat-VjWi56AWQ9k-unsplash.jpg"
description: "Learn how to build a continuous integration and deployment pipeline for a Gatsby site to save time and manual effort."
date: "2021-10-23"
category: "gatsby"
---

This post will walk through how to set up a CI/CD (Continuous Integration and Continuous Deployment) pipeline for a Gatsby site. Let's start with a definition from [Wikipedia](https://en.wikipedia.org/wiki/CI/CD):

> In software engineering, CI/CD is the combined practices of continuous integration (CI) and either continuous delivery or continuous deployment (CD). CI/CD bridges the gaps between development and operation activities and teams by enforcing automation in building, testing and deployment of applications.

Why would something like this be needed for a blog? This blog is built with Gatsby, with the posts being written in Markdown, and deployed to static [Github Pages](https://guides.github.com/features/pages/). A relatively simple workflow, and yet, it takes some non-trivial amount of time and manual effort to publish each article as it's ready. Once an article is finished, there's a sense of "phew, got that done, time to share it with the world", but going through manual effort to deploy is no fun.

This is where a CI/CD pipeline can save the day. The idea is to automate all the steps that are currently being done manually and trigger this automation at an appropriate point in the workflow, such as when a branch gets merged to the main line. Often, the initial effort to setup this automation will be greater than the amount of time it takes to do one or even several manual deploys. However, over time, the automation wins out. Think of this as an investment of your time now, to save time in the future.

## Identify the Steps

First part in building an automated pipeline is to identify the steps that are currently being done manually, then they can be automated one by one. Here are the steps involved in publishing an article on this blog:

1. Merge the PR containing the finished article to `main` (and any other changes that may have been needed, for example, may have identified a css change to improve spacing on article pages).
2. Pull the latest `main` branch (which now contains recently merged article) to my local dev environment.
3. Run the [unit tests](../gatsby-unit-testing) and make sure the entire suite is passing. (Even though the tests were run on the branch when writing the article, it's critical to run them after merging in case a bug gets introduced as a result of the merge).
4. If the tests fail, stop and investigate. The remaining steps should *only* be performed if the tests pass.
5. Run the production Gatsby build to generate the optimized bundles for serving the production site.
6. Deploy the production build to Github Pages.
7. Ingest the markdown content as documents to the [search service](../roll-your-own-search-service-for-gatsby-part5) using Heroku's `pg:psql` command.

## Choose an Automation Tool

Next step in building a pipeline is to choose a tool to perform the actions that have been identified in the previous step. There are many to choose from including [Travis CI](https://www.travis-ci.com/), [Circle CI](https://circleci.com/), [Jenkins](https://www.jenkins.io/), and many more.

For side projects, I used to reach for Travis or Circle CI, but ever since the introduction of [Github Actions](https://github.com/features/actions), that has become my go to solution for any automation required on Github projects. It's a nice choice because it integrates with Github seamlessly, (as it's built by the same company) and there's no need to authorize a third party application to your Github account.

The remainder of this post assumes some working knowledge of Github Actions, if you haven't used it before, checkout the [Quickstart Guide](https://docs.github.com/en/actions/quickstart).

## Continuous Integration

Let's start with the "CI" part of the process. This should run on every commit, every branch, to ensure the site can build and the tests are passing. This is to provide feedback as early as possible if a bug has been introduced.

To get this going with Github Actions, add a `.github/workflows` directory in the root of your project. Then add a file named `ci.yml` in this directory. It can be named anything, just choose a name that is descriptive as to what this workflow does.

Since this workflow should run on every branch and every commit that gets pushed, the `on: push` trigger will be used. Workflows run on Github Action runners (specified in the `runs-on` instruction). Keep in mind that unlike a local development environment, these are starting "fresh" each time. This means any dependencies needed by the site such as Node.js and npm packages defined in `package.json` will need to be installed.

Here is the continuous integration workflow used on this blog, with annotations to explain each step. Steps with `uses` are referring to pre-built actions that are available in the [Actions Marketplace](https://github.com/marketplace?type=actions). The other steps are running commands exactly as specified on the runner machine:

```yml
# .github/workflows/ci.yml
name: CI

# Run this workflow on any push to any branch.
on: push

# A workflow can have one or more jobs.
jobs:
  # This workflow has just a single job named `ci`.
  ci:
    # Run this job on a Github hosted action runner with the latest version of ubuntu installed.
    runs-on: ubuntu-latest

    # A job has one or more steps.
    steps:
      # Checkout the project source files to the Github Action runner.
      # This is roughly equivalent to running `git checkout`.
      - name: Checkout source
        uses: actions/checkout@v1

      # Install the version of Node.js used by project.
      - name: Setup node
        uses: actions/setup-node@v2
        with:
          node-version: "14"
          cache: "npm"

      # Install package dependencies as defined in package.json file in root of project.
      - name: install
        run: npm install

      # Run `gatsby build`.
      - name: build
        run: npm run build

      # Run the Jest unit tests and generate a coverage report.
      - name: test
        run: npm test -- --coverage
```

## Continuous Deployment: When

This part needs careful consideration because it will deploy new code to production. The first thing to think about is *when* should it run. Clearly the simple `on: push` trigger used for the CI workflow would not be suitable as we don't want just any work-in-progress branch getting deployed.

One solution is to use a trigger filter to limit which branches a workflow will run on. For example, to indicate that a given workflow should only run when commits are pushed to the `main` branch:

```yml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # steps to build and deploy the site...
```

Given that the only way code should get pushed to `main` is when an approved PR (Pull Request) is merged (either via merge commit or squash & merge), the above workflow trigger would ensure that a deploy only goes out when a PR is merged.

<aside class="markdown-aside">
Preventing direct pushes to the default branch can be controlled using Github's <a class="markdown-link" href="https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule">branch protection rules</a>.
</aside>

However, even if the project is configured to not allow commits to be pushed directly to `main`, there's still a problem. What if the tests fail on `main` as a result of the merge commit (or squash/merge) from the PR? Recall that since the CI workflow has trigger `on: push`, it will also run when a PR gets merged to `main`. Even though the tests would have run on the branch that got merged, there's a chance that something goes wrong as a result of the merge and tests fail on `main`. In this case, the deploy should not run.

So what we want to express is: "Only run this workflow on the main branch, and *after* continuous integration has completed successfully on the main branch." The way to express this with Github Actions is to use the [workflow_run](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#workflow_run) trigger, which allows one workflow to be dependent on another.

For example, to indicate that the CD workflow should only run on the `main` branch, after the CI workflow has completed:

```yml
# .github/workflows/cd.yml
name: CD

on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # steps to build and deploy the site...
```

However, there's still one more complication to deal with, `completed` just means the workflow finished, it does not mean it was successful. i.e. it would run even if the tests in the `CI` workflow failed. Unfortunately, there's no `type` keyword to indicate completed successfully, however, the result of the workflow run is available in the [github context](https://docs.github.com/en/actions/learn-github-actions/contexts) and can be used in an `if` expression as follows:

```yml
# .github/workflows/cd.yml
name: CD

on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      # steps to build and deploy the site...
```

Putting it all together, the above workflow says: Kick off the `CD` workflow  on the `main` branch, after the `CI` workflow has completed on the `main` branch, but only run the `deploy` job if the `CI` workflow completed successfully.

<aside class="markdown-aside">
It seems awkward to implement "If workflow A is successful, then run workflow B" in two different portions of the workflow file. First in the workflow_run -> types section, and second as an if condition in the job. At the time of this writing, this is the only way I could find to do it. I would imagine as Github Actions matures, there will eventually be a more succinct way to express this.
</aside>

## Continuous Deployment: Steps

Now that the "when" part of continuous deployment has been defined, it's time to automate it by scripting all the manual steps into the workflow file. For this blog, it needs some of the same steps as CI (checkout out project source, installing dependencies and running the production build), and then it needs a few other specific steps including generating an `.env` file for production, deploying to Github Pages, and finally ingesting the markdown documents to a [search service](../roll-your-own-search-service-for-gatsby-part5).

Some of these steps require "secrets", that is, values that should not be hard-coded in the workflow file (or anywhere in the source code). Secrets can be added to any Github repository to which you've got admin rights. Click on "Settings" from the main repository page on Github, then select the "Secrets" option. Then the secret values can be accessed as `{{ secrets.MY_SECRET }}` in workflow files.

Here is the workflow file containing all these steps, with annotations:

```yml
# .github/workflows/cd.yml
name: CD

# Run on main branch after CI workflow has completed on main.
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    # Only go ahead with the job if CI completed successfully (i.e. tests passed).
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      # Checkout project source
      - name: Checkout source
        uses: actions/checkout@v1

      # Install Node.js dependency
      - name: Setup node
        uses: actions/setup-node@v2
        with:
          node-version: "14"
          cache: "npm"

      # Install package.json dependencies
      - name: Install
        run: npm install

      # A simple bash script to generate the .env file from repository secrets.
      # This is to avoid hard-coding urls for services such as analytics and search.
      # For production, its important to run this step BEFORE building the site because
      # its a static site, and so environment variables are used at build time rather
      # than run time.
      - name: Generate prod env file
        env:
          HELLO_URL: ${{ secrets.HELLO_URL }}
          SEARCH_URL: ${{ secrets.SEARCH_URL }}
          SEARCH_ENABLED: ${{ secrets.SEARCH_ENABLED }}
        run: |
          touch .env.production
          echo HELLO_URL="$HELLO_URL" >> .env.production
          echo SEARCH_URL="$SEARCH_URL" >> .env.production
          echo SEARCH_ENABLED="$SEARCH_ENABLED" >> .env.production
        shell: bash

      # Run the production build - this runs: gatsby build
      # which generates the "public" directory containing the entire site.
      - name: Build
        run: npm run build

      # Use a community action from the Actions Marketplace to deploy
      # the "public" directory generated by the build to Github Pages.
      - name: Deploy to Github Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public

      # Finally, ingest the search.sql file (also generated by the build)
      # into the Heroku database for the application hosting the search service.
      - name: Ingest search docs
        env:
          HEROKU_APP_NAME: ${{ secrets.HEROKU_APP_NAME }}
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          HEROKU_API_KEY=$HEROKU_API_KEY cat search.sql | heroku pg:psql --app $HEROKU_APP_NAME
        shell: bash
```

Of course your Gatsby site may have some different details. For example, instead of using a custom search service hosted on Heroku, it may be using a commercial service such as Algolia. In that case, it would require researching what are the automation steps to update the search index on Algolia. Or if the site is hosted somewhere other than Github Pages, for example Netlify, it would require some some [automation](https://github.com/netlify/actions) specific to that platform.

## Conclusion

This post has walked through how to think about the process of CI/CD for a Gatsby site. It begins by writing down the current list of manual tasks, figuring out which of these steps need to run when, and setting up Github Action workflows to automate them. It also explained how to use the `workflow_run` trigger to make one workflow dependent on the success of another. I hope this will serve as an inspiration for others to automate some manual tasks they may be doing on their projects.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).
