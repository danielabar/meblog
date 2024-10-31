---
title: "Datadog APM for Rails on Heroku"
featuredImage: "../images/datadog-heroku-rails-leo-wieling-XgxcGUATna4-unsplash.jpg"
description: "Learn how to set up Datadog APM for a Rails application on Heroku, including installation, configuration, and tips for optimizing performance monitoring."
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

## Install Buildpack

Since Heroku doesn't offer a one-click Datadog integration, we need to use the [Datadog Heroku Buildpack](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/). To install it, run the following:

```bash
heroku buildpacks:add --index 1 https://github.com/DataDog/heroku-buildpack-datadog.git
```

**Buildpack order matters:** If you're running a Rails application, you likely already have the `heroku/ruby` buildpack. The Datadog buildpack needs to be listed *before* the Ruby buildpack. Setting `--index 1` will make it first in the list. The `--index` flag is 1-based, not 0-based.

## Enable Dyno Metadata

Heroku dyno names are ephemeral, meaning their identifiers can change frequently. To maintain continuity of metrics, we need to enable [Heroku Dyno Metadata](https://devcenter.heroku.com/articles/dyno-metadata):

```bash
heroku labs:enable runtime-dyno-metadata -a your-app-name
```

This allows the Heroku app name, dyno type, and dyno number to be used in Datadog for better tracking of performance metrics.

<aside class="markdown-aside">
The Heroku docs for dyno metadata have a warning: "Features added through Heroku Labs are experimental and subject to change.". It's concerning that something so critical as APM is depending on an experimental feature. However, when I reached out to Heroku support for help with setting up Datadog, their reply was "Just use NewRelic" ¯\_(ツ)_/¯
</aside>

## Configure Agent

The next step is to configure the Datadog agent. This requires setting several environment variables, as explained below:

```bash
# Set this if your app uses a Heroku Redis add-on
# Assumes `REDIS_URL` env var is set
heroku config:set DD_ENABLE_HEROKU_REDIS=true -a your-app-name

# Set the Datadog hostname to include app name, dyno type, and dyno number.
# Improves metrics continuity by providing detailed info about dynos.
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

Heroku restarts the application every time an environment variable is set. To avoid numerous restarts, you can set multiple environment variables in a single command as shown below:

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

<aside class="markdown-aside">
The above mentioned environment variables are a minimum to get started. Datadog provides many more <a class="markdown-link" href="https://docs.datadoghq.com/agent/basic_agent_usage/heroku/#configuration">configuration</a> options.
</aside>


## Apply Buildpack

At this point, the agent isn't running yet. This is because it requires the Heroku slug to be re-built. To do this, add an empty commit and push to your `heroku` remote:

```bash
git commit --allow-empty -m "Rebuild slug to apply Datadog setup"
git push heroku main
```

From this point onwards, the Datadog Agent will be started automatically when each dyno starts.

You can verify the agent was started successfully by shelling into a Heroku web or worker dyno, and using the `agent-wrapper` command provided by the Datadog buildpack:

```bash
heroku ps:exec --dyno=web.1 -a your-app-name
agent-wrapper status
```

Ignore the warnings about `DD_API_KEY` not being set. Heroku doesn't set configuration variables for the SSH session, but the Datadog Agent process is able to access them.

Check the output of the status command to verify the API key you configured earlier is valid, and that the APM agent is running:

```
API key ending with xxxxx: API Key valid
[...]

=========
APM Agent
=========
  Status: Running
[...]
```

## Enable Application Tracing

The next step is to install and configure the [datadog](https://github.com/DataDog/dd-trace-rb) gem for the Rails project. Add it to your Gemfile's `production` group, and optionally `staging` if you have another environment setup, as shown below:

```ruby
group :staging, :production do
  gem "datadog", require: "datadog/auto_instrument"
end
```
I intentionally do not install it in `development` and `test` groups because the agent isn't running in those environments, which would result in seeing connection errors every time you run a local Rails server or console. This is because the  code in the datadog gem attempts to connect to the agent running on port 8126 to send traces.

Run `bundle install` to apply the changes.

<aside class="markdown-aside">
Even though the gem repository on GitHub is named `dd-trace-rb`, the name of the gem is `datadog` and that's what goes in the `Gemfile`. If you were expecting it to be `ddtrace`, that's from the old 1.x version of the gem and has since been renamed as of 2.x, which is what's being used here. See the <a class="markdown-link" href="https://github.com/DataDog/dd-trace-rb/blob/release/docs/UpgradeGuide2.md#rename-to-datadog-gem">Upgrade Guide</a> for more details.
</aside>

**Auto Instrumentation**

The `require: "datadog/auto_instrument"` in the Gemfile works for supported Ruby [frameworks and libraries](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/ruby/#integration-instrumentation). This means that the gem will automatically detect calls to controllers, background jobs, ActiveRecord queries, Action Mailer, etc. and send the traces to Datadog. Without `auto_instrument`, you would have to manually instrument your code, which means wrapping every section of code you wanted sent to datadog in trace blocks like this:

```ruby
Datadog::Tracing.trace(name, **options) do |span, trace|
  # Wrap this block around the code you want to instrument
  # Additionally, you can modify the span here.
  # e.g. Change the resource name, set tags, etc...
end
```

You can also combine auto and manual instrumentation. For example, if there's a particular section of code that you want further details sent to Datadog that the auto instrumentation isn't capturing, you can still wrap your code as shown above. See [Manual Instrumentation](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/ruby/#manual-instrumentation) for further details.

Once the `datadog` gem is installed, add a config initializer for further customization. For example:

```ruby
# config/initializers/datadog.rb
if Rails.env.staging? || Rails.env.production?
  Datadog.configure do |c|
    # set DD logger level to ERROR to reduce log noise.
    c.logger.level = Logger::ERROR

    # set environment tag based on the Rails environment
    c.env = Rails.env.production? ? "prod-my-app-name" : "staging-my-app-name"

    # set version tag, eg: `version:v123`
    c.version = ENV["HEROKU_RELEASE_VERSION"] if ENV["HEROKU_RELEASE_VERSION"].present?
  end
end
```

**Explanation:**

* **Rails Environment Check:** By wrapping the initializer in a `Rails.env.staging? || Rails.env.production?` check, we ensure Datadog configuration only runs in environments where the Datadog agent is running.
* **Log Level:** Even though earlier we ran `heroku config:set DD_LOG_LEVEL="error"`, I found it necessary to also set the log level in the initializer to fully quiet all the Datadog logs noise.
* **Environment Tagging:** Datadog uses the `env` tag to segment and filter application data by environment, like "staging" or "production". Setting `c.env` to `prod-my-app-name` or `staging-my-app-name` ensures that traces, are grouped by environment.
* **Version Tagging:** The `version` tag tracks specific app versions, which is handy for tracing changes over deployments. Here, we pull `HEROKU_RELEASE_VERSION` directly from the environment, so each deployment’s metrics reflect its specific version tag, such as `v123`. This allows us to see how a particular deployment performs, compare releases, and track down any regressions or improvements made in recent updates.

<aside class="markdown-aside">
You could simply populate the `env` tag with the value of `Rails.env` if your project is the only one using Datadog at your company. In my case, there were several different teams/projects sharing the same Datadog instance, and we wanted to keep the env tags distinct across project teams.
</aside>

There's a lot more that can be done in the config block, including optionally disabling/enabling integrations. See the [Datadog Ruby](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/ruby/#integration-instrumentation) docs for further details.

At this point, we're nearly done with the APM setup. There's just one last step required to tie everything together.

## Unified Service Tagging

When the Datadog agent runs on the web and worker dyno's, in addition to sending instrumentation data from the Rails application and background jobs to Datadog, it also sends metrics about the web and worker dynos such as memory and CPU utilization. We need to ensure that these are correctly tagged with the service, environment, and release versions so that the host metrics can be filtered on, and correlated to the APM data. For example, when investigating a particular Rails controller action, it would be interesting to see if there's a memory spike every time it runs.

Datadog can display this information all in a single view, but it requires setting up [Unified Service Tagging](https://docs.datadoghq.com/getting_started/tagging/unified_service_tagging/). The documentation mentions several different ways to set this up, but on Heroku, our team found this easiest to accomplish with a [Prerun script](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/#prerun-script).

A Prerun script runs after all of the standard configuration, but immediately before starting the Datadog Agent. Recall earlier we set the following environment variable for Heroku:

```bash
heroku config:set DD_HEROKU_CONF_FOLDER="/app/.datadog" -a your-app-name
```

In this case, Datadog will expect to find a folder named `.datadog` in your project root, with an executable file named `prerun.sh`. In this script, the `env`, `service`, and `version` tags are populated. For example:

```bash
# .datadog/prerun.sh

#!/bin/bash

if [ "$RAILS_ENV" == "production" ]; then
  export DD_ENV="prod-my-app-name"
elif [ "$RAILS_ENV" == "staging" ]; then
  export DD_ENV="staging-my-app-name"
fi

export DD_SERVICE="my-app-name"

if [ -n "$HEROKU_RELEASE_VERSION" ]; then
  export DD_VERSION="${HEROKU_RELEASE_VERSION}"
fi

if [ -n "$DD_ENV" ] && [ -n "$DD_VERSION" ] && [ -n "$DD_SERVICE" ]; then
  export DD_TAGS="env:${DD_ENV},version:${DD_VERSION},service:${DD_SERVICE}"
fi
```

## Deploy

At this point, you would merge all the changes you made to the Rails app to the main branch. As a reminder, here's what's changed:

* `Gemfile` and `Gemfile.lock` to install the `datadog` gem.
* `config/initializers/datadog.rb` to configure Datadog from the Rails side.
* `.datadog/prerun.sh` to configure Datadog for tagging host metrics consistently with the app.

And deploy with `git push heroku main`. Within a few minutes, you should start seeing metrics and telemetry data flowing into your Datadog dashboard. Open APM -> Services in Datadog to start analyzing your data.

## Summary and References

In this guide, we walked through integrating Datadog APM with a Rails app deployed on Heroku. Key steps included adding the Datadog buildpack, enabling Heroku dyno metadata, configuring environment variables for the Datadog agent, and setting up unified service tagging for consistent metrics and traces. We also installed and configured the `datadog` gem in the Rails application.

**References:**

- [Datadog Heroku Buildpack](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/)
- [Heroku Dyno Metadata](https://devcenter.heroku.com/articles/dyno-metadata)
- [Datadog Tracing Ruby Applications](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/ruby/)

## TODO
* WIP main content from `blog-research/datadog-rails-heroku-draft-from-notes.md` AND `blog-research/datadog-rails-heroku.md`
* WIP explain unified host metrics as a separate section, so that metrics such as mem, cpu can be shown alongside resources/spans/traces (where resource === Controller#action)
* Should the "Rails Instrumentation" be split up into two sub-sections for gem installation and config initializer?
* Assumptions: familiarity with running a Rails app on Heroku, and heroku cli installed and authenticated
* Define what is a buildpack and link to Heroku docs: https://docs.datadoghq.com/agent/basic_agent_usage/heroku/
* Command to list buildpacks after agent is installed, to confirm it's there - get command and example output from work laptop
* Note: all the heroku commands shown here include the `-a` flag to specify the app name, this is necessary if you host multiple apps on heroku, or even if its logically one app, if you have a separate app for staging (eg: my-app-staging) vs production (eg: my-app). If you only have a single app on heroku, the `-a` flag can be left out.
* Explain about `/app` for DD prerun path is Heroku level `/app` folder, NOT the Rails `/app` folder!
* Nice to have: a visual showing how the components fit together: Heroku dynos, DD agent installed on dyno and sending host metrics, datadog gem installed as part of Rails app and sending instrumentation data to DD agent, DD site receiving metrics from DD agent.
* After dyno metadata enabled, maybe show expectation that now a bunch of `HEROKU_...` env vars should be populated? (get example from work laptop, make generic if necessary)
* Is it really necessary to specify `c.tracing.instrument...` or does auto_instrument already capture all of those? I couldn't find it in the dd docs, spend some time searching through the source and issues: https://github.com/search?q=repo%3ADataDog%2Fdd-trace-rb%20auto_instrument&type=code and https://github.com/DataDog/dd-trace-rb/issues/2343#issuecomment-1299009009
* Add references (get more links from work laptop?) such as
  * https://docs.datadoghq.com/agent/basic_agent_usage/heroku/
  * terminology: https://docs.datadoghq.com/tracing/glossary/
  * tracing ruby apps: https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/ruby/
  * troubleshooting: https://docs.datadoghq.com/agent/basic_agent_usage/heroku/#troubleshooting
* conclusion para
* edit
