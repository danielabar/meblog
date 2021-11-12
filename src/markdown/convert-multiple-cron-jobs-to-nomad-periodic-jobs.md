---
title: "Migrate Cron Jobs to Nomad the Lazy Way"
featuredImage: "../images/lazy-david-clode-BCI9_1eJfO0-unsplash.jpg"
description: "Learn how to use some bash scripting to generate multiple Nomad periodic jobs from a crontab and deploy them."
date: "2021-11-21"
category: "devops"
related:
  - "Build a CI/CD Pipeline for a Gatsby Site"
  - "Automate Tabs & Commands in iTerm2"
  - "Dockerize a Rails Application for Development"
---

Laziness is usually considered a negative or insulting term, but when it comes to software engineering, this can be a valuable attribute. This post will walk through a problem I was facing in converting multiple cron jobs from a legacy platform to a new one, and how being lazy saved manual effort and made future maintenance easier.

The application I'm working on has a custom build and deploy pipeline based on [xen](https://en.wikipedia.org/wiki/Xen) and some home grown promotion tools. Our team is working on switching to a more modern workflow including building out a private cloud with Openstack, the Hashicorp stack for infrastructure as code (including Terraform, Nomad, Vault, and Consul), and Github Actions for CI/CD automation.

<aside class="markdown-aside">
The remainder of this post assumes some familiarity with Hashicorp's Nomad. If you haven't used it before, checkout this excellent <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-80f57cd403ca">primer</a> and <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-running-traefik-on-hashiqube-7d6dfd8ef9d8">tutorial</a>.
</aside>

As part of this migration, 30+ cron jobs from the old xen based build had to be converted to run on Nomad. Nomad has a [periodic](https://www.nomadproject.io/docs/job-specification/periodic) stanza that is designed to run a given task on a particular schedule, so this is perfect for running cron jobs. However, the `periodic` stanza which defines the `cron` schedule can only be placed at the Nomad `job` level. This means that each entry in the application's crontab needs its own `.nomad` job file. Each resulting `.nomad` job file would end up looking very similar, the only differences being in the job/group/task names, the cron schedule, and the command to run.

Being a [lazy](https://medium.com/the-lazy-developer/on-laziness-26d7a9f32066) developer, there was no way I wanted to manually write over 30 nomad files. Not only would the initial work be tedious, but what if they all required a change in the future? Even with global find/replace in files, that would still be too much manual effort. Instead, I decided to write a generator - a bash script to parse the existing crontab (well, a modified version of it which I'll discuss soon) and generate each nomad file from a template file.

## Cron

To start, let's take a look at the existing crontab. This is for a Rails application so all the jobs are written using rake:

```
* * * * * nobody bundle exec rake app:frequent_tasks
5,10,15,25,30 * * * * nobody bundle exec rake app:export_widgets
0 * * * * nobody bundle exec rake app:cleanup_widgets
...
```

## Nomad Example

Now let's look at what the first job would look like written as a Nomad file. This project uses the [Github Container Registry](https://github.blog/2020-09-01-introducing-github-container-registry/) to store its Docker images. The same image is used to run the app with Puma, database migrations, and cron jobs, therefore it intentionally doesn't have a `CMD` or `ENTRYPOINT` specified in its `Dockerfile`, rather, each Nomad task specifies the command to run:

```nomad
job "app_frequent_tasks" {
  datacenters = ["us-east-1"]

  periodic {
    cron = "* * * * *"
    prohibit_overlap = true
  }

  group "frequent_tasks" {
    task "frequent_tasks" {
      driver = "docker"

      config {
        image   = "ghcr.io/org/project/app:latest"
        command = "/bin/sh"
        args    = ["-c", "bundle exec rake app:frequent_tasks"]
      }

      resources {
        cpu    = 500
        memory = 256
      }

      env {
        RAILS_ENV=production
      }

      template {
        # Access secrets from Vault.
        # Details not relevant for this example.
      }
    }
  }
}
```

## Nomad "Template"

To express this in a more general way, the rake task name from the cron entry (eg: `frequent_tasks`) becomes the job name, pre-pended with app (eg: `app_frequent_tasks`). The cron schedule (eg: `* * * * *`) becomes the periodic cron value. The rake task name is also used for the Nomad group and task name, and as the last value in the `args` for the Docker command configuration in the Nomad file.

In order to write a script that will generate these Nomad files for each cron, start with a "template" Nomad file that is structured as the above, but with the specific values as strings `JOB_NAME` and `CRON_VALUE` that can be replaced. Use of the word template here refers to a file template that the script will use, not the `template` Nomad stanza used to read values from Vault or Consul:

```nomad
# template.nomad
job "app_JOB_NAME" {
  datacenters = ["us-east-1"]

  periodic {
    cron = "CRON_VALUE"
    prohibit_overlap = true
  }

  group "JOB_NAME" {
    task "JOB_NAME" {
      driver = "docker"

      config {
        image   = "ghcr.io/org/project/app:latest"
        command = "/bin/sh"
        args    = ["-c", "bundle exec rake app:JOB_NAME"]
      }

      resources {
        cpu    = 500
        memory = 256
      }

      env {
        RAILS_ENV=production
      }

      template {
        # Access secrets from Vault.
        # Details not relevant for this example.
      }
    }
  }
}
```

## Generator Script

The generator script will have to iterate over each line of the cron, and parse it into the cron value, and job name. I ran into a snag here as there was no natural character to separate on. Couldn't use space or comma since these can also occur within the cron value. This required a one-time manual task of creating a file `cron-input` to add a pipe character separating the cron schedule from remainder of command. Also removed the `nobody` user:

```
* * * * *|bundle exec rake app:frequent_tasks
5,10,15,25,30 * * * *|bundle exec rake app:export_widgets
0 * * * *|bundle exec rake app:cleanup_widgets
...
```

And finally, here is the annotated script to iterate over `cron-input` and generate the `.nomad` files:

```bash
#!/bin/bash

# This is the pipe separated version
INPUT_FILE=/path/to/cron-input

# The "template" nomad file with strings JOB_NAME and CRON_VALUE to be replaced
TEMPLATE_FILE=/path/to/template.nomad

# Record the original value of Internal File Separator so we can put it back later
OIFS=$IFS

# Iterate over each line in input file (aka pipe separated cron)
while read line; do

  # Temporarily set Internal File Separator to pipe character for parsing cron input
  IFS='|'

  # Parse line of cron-input into cron and command values
  # Example, given a line: * * * * *|bundle exec rake app:frequent_tasks
  # Then cron_value will be "* * * * *"
  # and command_value will be "bundle exec rake app:frequent_tasks"
  read -r cron_value command_value <<< "$line"

  # Temporarily set Internal File Separate to colon character to parse out the job name
  IFS=':'

  # Parse `command_value` from previous step to extract the job name.
  # Example, given a command_value: bundle exec rake app:frequent_tasks
  # Then discard will be "bundle exec rake app"
  # and job_name will be "frequent_tasks"
  # The first part is not needed so the variable is called `discard`
  read -r discard job_name <<< "$command_value"

  # Generate nomad file for job from the template file.
  # Example, if the job_name extracted from previous step was: "frequent_tasks"
  # then generate a file named frequent_tasks.nomad
  # Assumes there is a directory named `generated` to contain all the resulting .nomad files
  cp TEMPLATE_FILE generated/$job_name.nomad

  # Replace all strings JOB_NAME and CRON_VALUE in generated file with values parsed from cron input file
  # On a mac, must provide a bakup extension when editing files in place, on Linux, this can be skipped
  sed -i '.bak' "s/JOB_NAME/$job_name/g;s/CRON_VALUE/$cron_value/" $job_name.nomad

done < $INPUT_FILE

# remove temporary .bak files from sed
rm generated/*.bak

# reset original Internal File Separator
IFS=$OIFS
```

Running this script will result in a `.nomad` file being generated for each entry in the `cron-input` file. For example:

```
.
└── generated
    ├── frequent_tasks.nomad
    ├── export_widgets.nomad
    ├── cleanup_widgets.nomad
    └── ...
```

## Deploy

It's not enough to generate the files, they also need to be deployed to Nomad so that it can start scheduling each periodic job to run based on the given cron schedule. For just a single file, the command is:

```
nomad job run generated/frequent_tasks.nomad
```

However, since the theme of this post is laziness, there's no way anyone wants to enter 30+ commands like the above to submit each job. Instead, the following script can be used to iterate over each nomad file in the generated directory:

```bash
#!/bin/bash

# This directory should contain all the generated nomad files from previous step
GENERATED_DIR=/path/to/generated

# Iterate over each file in generated directory and submit it to nomad
for i in $GENERATED_DIR/*; do
  nomad job run $i
done
```

<aside class="markdown-aside">
In order to run nomad commands like the above, you must have nomad <a class="markdown-link" href="https://www.nomadproject.io/docs/install">installed</a> and have configured environment variables NOMAD_ADDR, NOMAD_NAMESPACE, AND NOMAD_TOKEN in your profile.
</aside>

This can also be incorporated into a CI/CD workflow. Modify the script slightly to accept arguments for the nomad address, namespace, and token (so that they can be provided by the pipeline) and set them before invoking nomad:

```bash
#!/bin/bash

# Will be provided by pipeline when invoking this script
NOMAD_ADDR=$1
NOMAD_NAMESPACE=$2
NOMAD_TOKEN=$3

# This directory should contain all the generated nomad files from previous step
GENERATED_DIR=/path/to/generated

# Iterate over each file in generated directory and submit it to nomad
for i in $GENERATED_DIR/*; do
  nomad job run $i
done
```

Given that this script is named `run-nomad-periodic.sh`, here's an example of running it in a step as part of a Github Actions based workflow. It assumes that all the Nomad environment variables have been configured as Github repository [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets):

```yml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  build_image:
    steps:
      # build Docker image for app and push to container registry...

  deploy_prod:
    needs: build_image
    env:
      NOMAD_ADDR: ${{ secrets.NOMAD_ADDR }}
      NOMAD_NAMESPACE: ${{ secrets.NOMAD_NAMESPACE }}
      NOMAD_TOKEN: ${{ secrets.NOMAD_TOKEN }}
    steps:
      - name: Nomad Periodic
        run: ./path/to/run-nomad.periodic.sh $NOMAD_ADDR $NOMAD_NAMESPACE $NOMAD_TOKEN
```

<aside class="markdown-aside">
The workflow_run event is used to trigger a workflow, only when another workflow has completed. In this case, the Deploy workflow will only run after the CI (Continuous Integration) workflow has completed. See my post on <a class="markdown-link" href="https://danielabaron.me/blog/ci-cd-pipeline-for-gatsby/#Continuous-Deployment-When">CI/CD</a> to learn more about the workflow_run event.
</aside>

## Maintenance

Here's where the power of laziness really shines. Suppose a change is needed to the periodic jobs. For example, the data center is being changed. There's no need to use global find/replace to edit the generated files directly. Rather, the `nomad.template` file can be modified:

```nomad
# template.nomad
job "app_JOB_NAME" {
  # was us-east-1
  datacenters = ["us-west-1"]

  periodic {
    cron = "CRON_VALUE"
    prohibit_overlap = true
  }

  # ...
}
```

Then run the generator script again to regenerate the nomad files, then they can be deployed again with the run script.

## Conclusion

This post has explained why, when faced with a large repetitive task, it's good to embrace your inner laziness and find an automated way to perform this task. Specifically we've covered how to automate generation of Nomad periodic jobs from multiple cron jobs from a legacy platform and how to deploy them all in one script.