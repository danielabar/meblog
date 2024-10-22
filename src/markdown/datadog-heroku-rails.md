---
title: "Datadog APM Setup for Rails on Heroku"
featuredImage: "../images/datadog-heroku-rails-leo-wieling-XgxcGUATna4-unsplash.jpg"
description: "Learn how to set up Datadog APM for a Rails app on Heroku, including installation, configuration, and tips for optimizing performance monitoring."
date: "2025-04-01"
category: "devops"
related:
  - "Using Heroku's pg:pull with Docker"
  - "Nomad Tips and Tricks"
  - "Automate Tabs & Commands in iTerm2"
---

Application performance monitoring (APM) is essential for understanding how your web applications behave in production. While Heroku provides basic metrics such as memory usage and CPU load, they aren't enough for in-depth analysis of what’s happening inside a Rails controller or background job. Such as what database queries are running, Redis access, how much time is spent waiting for external services, etc. That’s where Datadog APM steps in, offering detailed insights and monitoring capabilities.

Heroku makes it easy to add some APMs such as NewRelic or Scout APM with a one-click add-on, but sometimes, your company may already be using Datadog across different projects. Integrating everything into the same observability tool keeps things consistent, simplifies cross-project monitoring, and leverages existing Datadog dashboards.

This post will walk through setting up Datadog APM on a Heroku-hosted Rails application.

## 1. Install the Buildpack

Since Heroku doesn't offer a one-click Datadog integration, we need to use the [Datadog Heroku Buildpack](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/). To install it, run the following in a terminal:

```bash
heroku buildpacks:add --index 1 https://github.com/DataDog/heroku-buildpack-datadog.git
```

**Important:** The order of buildpacks matter! If you're running a Rails app, you likely already have the `heroku/ruby` buildpack. The Datadog buildpack needs to be listed *before* the Ruby buildpack. Setting `--index 1` will make it first in the list (it's a 1-based index, not 0-based).

## 2. Enable Dyno Metadata

## TODO
* WIP from `blog-research/datadog-rails-heroku-draft-from-notes.md`
* note at beginning: assuming you've got the heroku cli installed and are already authenticated
* todo: heroku cli command to list buildpacks
* define what is a buildpack and link to Heroku docs: https://docs.datadoghq.com/agent/basic_agent_usage/heroku/
* title
* feature image
* related
* intro para
* main content
* conclusion para
* edit
