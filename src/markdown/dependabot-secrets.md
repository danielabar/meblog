---
title: "Dependabot PRs Need Their Secrets"
featuredImage: "../depbot-secrets-30daysreplay-social-media-marketing-ZEDvSzgS4FA-unsplash.jpg"
description: "A simple reason why your dependabot PRs may be failing on Github."
date: "2022-07-01"
category: "github"
related:
  - "Navigate Back & Forth in VS Code"
  - "A VS Code Alternative to Postman"
  - "VS Code Shell Integration"
---

Intro TBD:
* A few months ago I noticed all the Github Dependabot PRs were failing a required check on a project I'm working on.
* Link/briefly define dependabot

Rough Outline:
* Using Github Actions, project has a Continuous Integration workflow that runs on every push. It installs all dependencies including bundle install and webpacker, runs rubocop, and all unit and feature tests. It's configured as a required check in Github which means any PR to be merged must show that the workflow is passing.
* All the dependabot PR's were failing on the feature tests with errors like this:
```
Braintree::ConfigurationError: Braintree::Configuration.merchant_id needs to be set
```
* the braintree initializer looks something like:
```ruby
Braintree::Configuration.merchant_id = ENV["BRAINTREE_MERCHANT_ID"]
# other config...
```
* Locally, the value of this env var comes from a git ignored `.env` file that developers populate on their laptops during project setup.
* For the Continuous Integration workflow on Github, this value is populated in the Github repository secrets, so all of our own PRs use it and pass. Uses `env` in workflow file like:
```yml
env:
  BRAINTREE_MERCHANT_ID: ${{ secrets.BRAINTREE_MERCHANT_ID }}
```
* However, it turns out, dependabot doesn't have access to the main repository secrets, so essentially it was as if the initializer had the following:
```ruby
Braintree::Configuration.merchant_id = nil
# other config...
```
* Solution, go to project settings on Github -> Secrets -> click down caret, notice there's two different sections, one for Actions, and another for Dependabot. (ref image: github-repo-secrets.png)
* Click on Dependabot from Secrets settings and populate the secrets necessary for required checks to pass when run by dependabot.
* Re-run the failed dependabot checks and this time they should pass.