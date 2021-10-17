---
title: "Build a CI/CD Pipeline for a Gatsby Site"
featuredImage: "../images/ci-cd-pipeline-gatsby-possessed-photography-dRMQiAubdws-unsplash.jpg"
description: "Learn how to build a continuous integration and deployment pipeline for a Gatsby site to save time and manual effort."
date: "2021-10-24"
category: "gatsby"
---

This post will walk through how to set up a CI/CD (Continuous Integration and Continuous Deployment) pipeline for a Gatsby site. But first, why would you want to do this?

This blog is built with Gatsby, with the posts being written in Markdown, and deployed to static Github Pages. A relatively simple workflow, and yet, it was taking some non-trivial amount of time and manual effort to publish each article as it was ready, which I was starting to dread. After all, once an article is finished, there's a sense of "phew, got that done, time to share it with the world", but going through manual effort to deploy is no fun.

This is where a CI/CD pipeline can step in to save the day. [Wikipedia](https://en.wikipedia.org/wiki/CI/CD) defines this as:

> In software engineering, CI/CD is the combined practices of continuous integration (CI) and either continuous delivery or continuous deployment (CD). CI/CD bridges the gaps between development and operation activities and teams by enforcing automation in building, testing and deployment of applications.

The idea is to automate all the steps that are currently being done manually and trigger this automation at an appropriate point in the workflow, such as when a branch gets merged to the main line. Often, the initial effort to setup this automation will be greater than the amount of time it takes to do one or even several manual deploys. However, over time, the automation wins out. Think of this as an investment of your time now, to save time in the future.

## Identify the Steps

First part in building an automated pipeline is to identify the steps that are currently being done manually, then they can be automated one by one. Here are the steps involved in publishing an article on this blog:

1. Merge the PR containing the finished article to `main` (and any other changes that may have been needed, for example, may have identified a css change to improve spacing on article pages).
2. Pull the latest `main` branch (which now contains recently merged article) to my local dev environment.
3. Run the [unit tests](../gatsby-unit-testing) and make sure the entire suite is passing. (Even though the tests were run on the branch when writing the article, it's critical to run them after merging in case a bug gets introduced as a result of the merge).
4. If the tests fail, stop and investigate. The remaining steps should *only* be performed if the tests pass.
5. Run the production Gatsby build to generate the optimized bundles for serving the production site.
6. Ingest the markdown content as documents to the [search service](../roll-your-own-search-service-for-gatsby-part5).
7. Deploy the production build to Github Pages.

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

## Continuous Deployment

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

<aside>
Preventing direct pushes to the default branch can be controlled using Github's <a href="https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule">branch protection rules</a>.
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
    branches: [master]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # steps to build and deploy the site...
```

However, there's still one more complication to deal with, `completed` just means the workflow finished, it does not mean it was successful. Unfortunately, there's no `type` keyword to indicate completed successfully, however, the result of the workflow run is available in the github context and can be used in an `if` expression as follows:

```yml
# .github/workflows/cd.yml
name: CD

on:
  workflow_run:
    workflows: ["CI"]
    branches: [master]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      # steps to build and deploy the site...
```