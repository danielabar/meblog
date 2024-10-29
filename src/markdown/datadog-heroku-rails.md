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

Application performance monitoring (APM) is essential for understanding how a web application behaves in production. While Heroku provides basic metrics such as memory usage and CPU load, this is not enough for in-depth analysis of what's happening inside a Rails controller or background job. Such as what database queries are running, Redis access, how much time is spent waiting for external services, etc. That's where Datadog APM steps in, offering detailed insights and monitoring capabilities.

Heroku makes it easy to add some APMs such as NewRelic or Scout APM with a one-click add-on, but sometimes, your company may already be using Datadog across different projects. Integrating everything into the same observability tool keeps things consistent, simplifies cross-project monitoring, and leverages existing Datadog dashboards.

This post will walk through setting up Datadog APM on a Heroku-hosted Rails application.

## 1. Install the Buildpack

Since Heroku doesn't offer a one-click Datadog integration, we need to use the [Datadog Heroku Buildpack](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/). To install it, run the following in a terminal:

```bash
heroku buildpacks:add --index 1 https://github.com/DataDog/heroku-buildpack-datadog.git
```

**IMPORTANT:** The order of buildpacks matter! If you're running a Rails app, you likely already have the `heroku/ruby` buildpack. The Datadog buildpack needs to be listed *before* the Ruby buildpack. Setting `--index 1` will make it first in the list. The `--index` flag is 1-based, not 0-based.

Once the buildpack is added, the Datadog Agent will be started automatically when each dyno starts. It listens on port 8126 to collect traces. However, the agent is not yet running at this point. That requires re-building the slug (i.e. `git push heroku main`). There's still a few more steps to configure it and the Rails app to make everything work so let's continue.

## 2. Enable Dyno Metadata

Heroku dyno names are ephemeral, meaning their identifiers can change frequently. To maintain continuity of metrics, we need to enable [Heroku Dyno Metadata](https://devcenter.heroku.com/articles/dyno-metadata).

```bash
heroku labs:enable runtime-dyno-metadata -a your-app-name
```

This allows the Heroku app name, dyno type, and dyno number to be used in Datadog for better tracking of performance metrics.

## 3. Set Environment Variables

Datadog requires several environment variables to function correctly, as explained below:

```bash
# Set this if your app uses a Heroku Redis add-on
# Assumes `REDIS_URL` env var is set
heroku config:set DD_ENABLE_HEROKU_REDIS=true -a your-app-name

# Set the Datadog hostname to include app name, dyno type, and dyno number.
# Improves metrics continuity by providing detailed info about  dynos.
# This is why we enabled dyno metadata in the previous step!
heroku config:set DD_DYNO_HOST=true -a your-app-name

# Ensures metrics are sent to the correct Datadog site.
heroku config:set DD_SITE="datadoghq.com" -a your-app-name

# Set Datadog agent log level to error to avoid littering Heroku CLI
# and Rails server output with Datadog trace messages.
heroku config:set DD_LOG_LEVEL="error" -a your-app-name

# Add your Datadog API key to Heroku's config.
# Keys are at: https://app.datadoghq.com/organization-settings/api-keys
heroku config:set DD_API_KEY="REDACTED" -a your-app-name

# === THIS WILL BE EXPLAINED FURTHER IN THIS POST ===
# Set the location for the Heroku configuration folder for Datadog.
# This is required to execute the prerun.sh script for unified service tagging
heroku config:set DD_HEROKU_CONF_FOLDER="/app/.datadog" -a your-app-name
```

Note that Heroku restarts the application every time an environment variable is set. To avoid numerous restarts, you can set multiple environment variables in a single command as shown below:

```bash
heroku config:set \
  DD_ENABLE_HEROKU_REDIS=true \
  DD_DYNO_HOST=true \
  DD_SITE="datadoghq.com" \
  DD_LOG_LEVEL="error" \
  DD_API_KEY="your_api_key" \
  DD_HEROKU_CONF_FOLDER="/app/.datadog" \
  -a your-app-name
```

This way the app will only be restarted once.

## TODO
* WIP main content from `blog-research/datadog-rails-heroku-draft-from-notes.md`
* explain unified host metrics as a separate section, so that metrics such as mem, cpu can be shown alongside resources/spans/traces (where resource === Controller#action)
* note at beginning: assuming you've got the heroku cli installed and are already authenticated
* note: all the heroku commands shown here include the `-a` flag to specify the app name, this is necessary if you host multiple apps on heroku, or even if its logically one app, if you have a separate app for staging (eg: my-app-staging) vs production (eg: my-app). If you only have a single app on heroku, the `-a` flag can be left out.
* heroku cli command to list buildpacks
* nice to have: a visual showing how the components fit together: Heroku dynos, DD agent installed on dyno and sending host metrics, datadog gem installed as part of Rails app and sending instrumentation data to DD agent, DD site receiving metrics from DD agent.
* fun fact: when contacted for help with DD, Heroku support replied with "Just use NewRelic"!
* define what is a buildpack and link to Heroku docs: https://docs.datadoghq.com/agent/basic_agent_usage/heroku/
* after dyno metadata enabled, maybe show expectation that now a bunch of `HEROKU_...` env vars should be populated? (get example from work laptop, make generic if necessary)
* Add references (get more links from work laptop?) such as
  * https://docs.datadoghq.com/agent/basic_agent_usage/heroku/
  * terminology: https://docs.datadoghq.com/tracing/glossary/
* conclusion para
* edit
