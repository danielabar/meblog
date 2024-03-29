---
title: "Nomad Tips and Tricks"
featuredImage: "../images/nomad-tips-tricks-rahul-bhosale-yBgC-qVCxMg-unsplash.jpg"
description: "Some tips and tricks for working with Hashicorp Nomad"
date: "2022-01-02"
category: "devops"
related:
  - "Migrate Cron Jobs to Nomad the Lazy Way"
  - "Crossword Solver with CentOS"
  - "Debug Github Actions"
---

I've been working on a platform migration project to containerize and move several web applications and associated services from a home grown system to Hashicorp's [Nomad](https://www.nomadproject.io/). Nomad is a workload orchestration tool designed to make it (relatively) easy to deploy, manage and scale containers on private and public clouds. It's [comparable](https://www.nomadproject.io/docs/nomad-vs-kubernetes) to Kubernetes, but focuses on a smaller scope, delegating features including discovery and secrets management to other tools such as [Consul](https://www.consul.io/) and [Vault](https://www.vaultproject.io/), while providing integration with these. It's also newer than Kubernetes.

One of the challenges in working with a newer platform is a smaller community, and finding online help. Many of my web searches lead to the official Nomad docs. While they are well written, if I'm doing a search, it's because I couldn't find the solution the docs. In the spirit of increasing the body of online knowledge, this post will share a few tips and tricks I've picked up going through this migration.

<aside class="markdown-aside">
This post assumes some working knowledge of Hashicorp's Nomad. If you haven't used it before, checkout this excellent <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-80f57cd403ca">primer</a> and <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-running-traefik-on-hashiqube-7d6dfd8ef9d8">tutorial</a>.
</aside>

## Job Specification

The first set of tips are for working with the job specification file (aka jobspec). This is a declarative way of telling Nomad about your application and its resource requirements. The jobspec file is written in [HCL](https://github.com/hashicorp/hcl), which stands for Hashicorp Configuration Language.

Although it can be irritating when tools require learning a framework-specific (i.e. non portable) language, HCL is similar enough to JSON and YAML that anyone familiar with these will pick it up easily. In fact, if JSON and YAML had a baby it might look something like HCL.

### Increase Docker Pull Timeout

When using the [Docker driver](https://www.nomadproject.io/docs/drivers/docker) to run a task, the Nomad client on which the task is running will first pull the Docker image from the specified location. This can be from Docker Hub, Github Container Registry, or a private Docker registry. For example:

```nomad
job "web" {
  group "web" {
    task "webapp" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
      }
    }
  }
}
```

But what happens if there's a networking issue resulting in a longer than usual amount of time to pull the image? In this case, Nomad will timeout the docker pull after 5 minutes and restart according to the `restart` stanza. If the networking issues are not resolved, the job will eventually fail.

To avoid having the job fail when docker pull is taking longer than usual, use the `image_pull_timeout` property of the docker `config` stanza to override Nomad's default timeout. For example, to increase it to 10 minutes:

```nomad
job "web" {
  group "web" {
    task "web" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
        image_pull_timeout = "10m"
      }
    }
  }
}
```

### Reuse Docker Tag for Development

When using Docker to run a Nomad task, the Nomad client will use a cached image if the image:tag specified in the docker driver config stanza of the jobspec has already been pulled. However, during development, you may be making changes to a dev version of the Docker image and re-using the same tag.

For example when developing a new feature, I'll switch to a git feature branch on my laptop, build an image tagged with the feature branch name, push it to the container registry, and deploy it to the Nomad dev environment (we use multiple [namespaces](https://learn.hashicorp.com/tutorials/nomad/namespaces) to isolate dev, staging, and production environments). In this case, I don't want Nomad to use the cached image from my last deploy, but to always pull a "fresh" version of the image. This can be accomplished using `force_pull` as shown below:

```nomad
job "web" {
  group "web" {
    task "web" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:my-feature"
        force_pull = true
      }
    }
  }
}
```

### Always deploy a new job version

The command to deploy a new version of a job is `nomad job run path/to/nomad/jobspec`. However, if nothing has changed in the jobspec file since the last deploy, then Nomad will not take any action. This is fine for production where there will be a new Docker image tag (we use the main line git commit sha) for each deploy, which effectively changes the contents of the Nomad file, thus triggering a new deploy.

But for development, we use the same image tag (branch name) so Nomad thinks nothing has changed, even if the image has been updated. Even the `force_pull` explained in the previous section won't help because Nomad won't get as far as evaluating the jobspec file.

To force Nomad to always run a deploy, use a [meta](https://www.nomadproject.io/docs/job-specification/meta) stanza that is populated with the return value from a uuid function that always generates a unique value. The `meta` stanza allow user-defined arbitrary key-value pairs. Nomad is written in Golang and so Go functions such as `uuidv4()` can be interpolated in the Nomad file as shown below. The `meta` stanza should be placed directly in the `job` stanza:

```nomad
job "web" {
  meta {
    run_uuid = "${uuidv4()}"
  }
}
```

### Resiliency

This one is not so much a tip, rather a summary of important stanzas in the jobspec file. One of the many benefits of using an orchestration tool like Nomad is it can handle updates and failures gracefully without manual intervention. In order to take advantage of these features, you must understand and make use of the following stanzas in the job spec file.

[update](https://www.nomadproject.io/docs/job-specification/update) Specifies update strategy Nomad uses when deploying a new version of the task group. i.e. when `nomad job run path/to/jobspec` is run. For example, perform rolling updates 3 at a time and wait until all tasks for an allocation are running and their Consul health checks are passing for at least 10 seconds before considering the allocation healthy.

[restart](https://www.nomadproject.io/docs/job-specification/restart) Specifies strategy for Nomad to restart failed tasks on the same nomad client. For example, if the application server has crashed, attempt 2 restarts within 30 minutes, delay 15s between each restart, and don't try anymore restarts after those are exhausted.

[check_restart](https://www.nomadproject.io/docs/job-specification/check_restart) Specifies how Nomad should restart a task that is not yet failing, but has become unresponsive or otherwise unhealthy. Works together with Consul health checks. Nomad restarts tasks when a health check has failed. For example, restart the Redis task after its health check has failed 3 consecutive times, and wait 90 seconds after restarting the task to resume health checking.

[reschedule](https://www.nomadproject.io/docs/job-specification/reschedule) This handles the case where the specified number of restarts have been attempted and the task still isn't running. This suggests the issue could be with the Nomad client such as a hardware failure or kernel deadlock. The `reschedule` stanza is used to specify details for rescheduling a failing task to another nomad client. For example, reschedule the task group an unlimited number of times and increase the delay between subsequent attempts exponentially, with a starting delay of 30 seconds up to a maximum of 1 hour.

[migrate](https://www.nomadproject.io/docs/job-specification/migrate) When a Nomad client needs to come out of service, it gets marked for draining and tasks will no longer be scheduled on it. Then Nomad will migrate all existing jobs to other clients. The `migrate` stanza specifies the strategy for migrating tasks off of draining nodes. For example, migrate one allocation at a time, and mark migrated allocations healthy once all their tasks are running and associated health checks are passing for 10 seconds or more within a 5 minute deadline.

For further details on how these stanzas are used with examples, I recommend these blog posts from Hashicorp's site:

* [Building Resilient Infrastructure: Restarting Tasks](https://www.hashicorp.com/blog/resilient-infrastructure-with-nomad-restarting-tasks)
* [Building Resilient Infrastructure: Scheduling](https://www.hashicorp.com/blog/resilient-infrastructure-with-nomad-scheduling)
* [Building Resilient Infrastructure: Job Lifecycle](https://www.hashicorp.com/blog/building-resilient-infrastructure-with-nomad-job-lifecycle)

### Prestart hook for one-time initialization

An application may have some one-time initialization task that needs to be completed before the main application can start. For example, before starting a Rails app, the database migrations should be run. This can be accomplished in Nomad using the [lifecycle](https://www.nomadproject.io/docs/job-specification/lifecycle) stanza.

The idea is, you would have multiple tasks within a group, let's say one task to start the Rails app, and another to run the database migrations. For the migration task, you define the lifecycle hook to be `prestart`, to indicate the db migrations should run *before* the Rails task is started. You would also set `sidecar` to false, to indicate that this task will start and finish before the main task is started. Setting `sidecar` to true would make the task run for the duration of the main task, which might be desirable for something like a logging agent.

```nomad
job "web" {
  group "web" {
    task "dbmigrate" {
      # The dbmigrate task will run BEFORE the puma task in this group.
      lifecycle {
        hook = "prestart"
        sidecar = false
      }

      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
        command = "bash"
        args    = ["-c", "bundle exec rake db:migrate"]
      }
    }

    task "puma" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
        command = "bash"
        args    = ["-c", "bundle exec puma"]
      }
    }
  }
}
```

### Nomad Environment Variables

Nomad ships with a number of [environment variables](https://www.nomadproject.io/docs/runtime/environment) that are available in the job file *and* in any command/scripts that are run in Docker containers as part of the job.

Here's an example of using `NOMAD_ALLOC_INDEX` in a script that runs database migrations, to ensure that it only runs once, when located in a task group that runs multiple instances (specified using `count` parameter of the `group` stanza).

Here's a modified version of the jobspec from the previous example that introduced the prestart hook:

```nomad
job "web" {
  group "web" {
    # Will launch 3 instances of the "web" group.
    # count parameter can only be specified at the group level.
    count = 3

    # But the database migrations should only run once.
    # Notice the use of a command script where we will
    # write some custom logic using env var NOMAD_ALLOC_INDEX
    task "dbmigrate" {
      lifecycle {
        hook = "prestart"
        sidecar = false
      }

      driver = "docker"
      config {
        image = "registry/image:tag"
        command = "/usr/bin/run-db-migrations"
      }
    }

    task "puma" {
      driver = "docker"
      config {
        image = "registry/image:tag"
        command = "bash"
        args    = ["-c", "bundle exec puma"]
      }
    }
  }
}
```

Where `/usr/bin/run-db-migrations` is a custom script that is added to the Docker image. It checks the value of the `NOMAD_ALLOC_INDEX` environment variable. Database migrations will only be run when this is `z0`, the first allocation, and will not be run for any others.

```bash
#!/bin/bash

if [ "z$NOMAD_ALLOC_INDEX" == "z0" ]; then
  RAILS_ENV=production bundle exec rake db:migrate
fi
```

### Replace Cron Jobs

If your application also has cron jobs, these can easily be replaced with Nomad's [periodic](https://www.nomadproject.io/docs/job-specification/periodic) jobs. For example, given the following crontab for a job that runs daily at 10:30:

```
30 10 * * * nobody bundle exec rake app:some_daily_task
```

It can be replaced with the following jobspec:

```nomad
job "cron_daily" {
  periodic {
    cron = "30 10 * * *"
  }
  group "daily" {
    task "daily" {
      driver = "docker"
      config {
        image   = "ghcr.io/org/project/app:latest"
        command = "bash"
        args    = ["-c", "RAILS_ENV=production bundle exec rake app:some_daily_task"]
      }
    }
  }
}
```

One challenge with cron jobs, especially for those that run frequently, is how to prevent the next instance of the job from launching, if the previous instance is still running. This can be be [tricky](https://serverfault.com/questions/82857/prevent-duplicate-cron-jobs-running) to solve with cron, but with Nomad, this can be solved by adding the `prohibit_overlap` overlap to the `periodic` stanza.

Here's an example of this property for a job that runs every minute:

```nomad
job "cron_frequent_task" {
  periodic {
    cron = "* * * * *"
    prohibit_overlap = true
  }
  group "frequent" {
    task "frequent" {
      driver = "docker"
      config {
        image   = "ghcr.io/org/project/app:latest"
        command = "bash"
        args    = ["-c", "RAILS_ENV=production bundle exec rake app:frequent_task"]
      }
    }
  }
}
```

<aside class="markdown-aside">
If you have a lot of cron jobs to convert to Nomad, it can be tedious to write up all the jobspec files by hand. See my post on <a class="markdown-link" href="https://danielabaron.me/blog/convert-multiple-cron-jobs-to-nomad-periodic-jobs/">Migrating Cron Jobs to Nomad the Lazy Way</a> for an easy way to do this.
</aside>

### Turn off auto restart

One of the many fantastic features of Nomad is integration with Vault for secrets management. From a jobspec file, you can read in secrets from Vault, and have them loaded as environment variables in the application. Without a platform managing this, if an environment variable is changed, the application must manually be restarted to pick up the new value. With Nomad's Vault integration, any change to a secret in Vault will cause all jobs that use this secret to automatically be restated.

However, there may be times where this is undesirable. One such case is for cron jobs (called periodic jobs in Nomad). For example, the application I'm working on has an autorenew cron job that picks up all subscriptions that are due for renewal and renews them, which includes billing the customer and sending a confirmation email. We would not want this job stopped in the middle and restarted just because a setting had been changed, it would be better for the job to complete and have the change be picked up next time the job runs.

In order to implement this behaviour, set `change_mode = "noop"` in the `template` stanza that reads in the secrets (default is `restart`):

```nomad
job "autorenew" {
  group "autorenew" {
    task "autornew" {
      template {
        destination = "secrets/local.env"
        env = true
        change_mode = "noop"
        data = <<EOH
API_KEY="{{with secret "secret/data/api-key"}}{{.Data.value}}{{end}}"
EOH
      }
    }
  }
}
```

The `destination` file is still updated when the secrets change and so the updated value will be used the next time the cron job is scheduled.

### Populate Environment Variables from Vault

As mentioned in the previous section, Nomad integrates with Vault for secrets management, which can be used to set environment variables for the containerized application that Nomad is running as a task. This is accomplished with the [template](https://www.nomadproject.io/docs/job-specification/template) stanza. This stanza has a few parameters. Most significant is the `data`  parameter which can take either a single line string, or multi-line using a heredoc. This string is written using a [Go template](https://learn.hashicorp.com/tutorials/nomad/go-template-syntax) and is one of the least intuitive aspects of Nomad.

Let's start with a simple example. Suppose the application has a single secret such as DB_PASSWORD that the application expects to be provided as an environment variable to connect to the database. Given that the [Vault CLI](https://learn.hashicorp.com/tutorials/vault/getting-started-install?in=vault/getting-started) has been installed and configured, the database password would be persisted in Vault as follows:

```bash
vault kv put kv/secret/config DB_PASSWORD=veryverysecretpassword
```

Then the following jobspec would read in this secret (when being deployed by Nomad) and expose it as an environment variable to the application:

```nomad
job "example" {
  type = "service"

  group "web" {
    task "frontend" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
      }

      # Here is where the Vault integration happens
      template {
        # result of data template will be populated in this file
        destination = "secrets/file.env"

        # all key/value pairs read will be exposed as environment variables to the frontend task
        env = true

        # read secret from Vault
        data = <<EOH
{{with secret "kv/secret/config"}}
DB_PASSWORD={{.Data.data.DB_PASSWORD | toJSON}}
{{end}}
EOH
      }
    }
  }
}
```

If you're thinking "whaaaat the heck is that data thing???", don't worry. Like I mentioned earlier, this part of Nomad is not very intuitive. While a full coverage of the [template syntax](https://learn.hashicorp.com/tutorials/nomad/go-template-syntax) is out of scope for this post, here's a brief explanation of what's going on:

The `<<IDENTIFIER ... IDENTIFIER` denotes the beginning and end of the heredoc, which is a multiline template string. Think of the content in the heredoc as a function that outputs some value. Whatever is output will get written to the `destination` file, which is `secrets/file.env` in the above example.

Any plain string literals such as `DB_PASSWORD` will get output exactly as they appear.

Anything between double curly braces `{{ ... }}` represents a dynamic portion of the template, these contain actions.

`with` is an action that redefines the context available to the template. I couldn't find a good explanation of what `with secret` does but from observation, it reads in the secret stored in Vault at the given location (`kv/secret/config` in the above example). Now the value from Vault can be traversed using `.Data.data.DB_PASSWORD`. The reason for `.Data.data` has to do with how Vault stores the data.

The pipe symbol `|` is used to chain together one or more commands. Since the database password could contain special characters, it's recommended to run all values extracted from Vault through the `toJSON` function to ensure they're properly parsed.

The result of all this is the following contents written to the destination file `secrets/file.env`:

```
DB_PASSWORD=veryverysecretpassword
```

And if you were to shell in the container (next section on Nomad CLI will explain how to do that) and run `env`, the `DB_PASSWORD` environment variable would be listed.

Well that's all well and good for a single environment variable, but what if your application has many environment variables? For example, it could be using multiple databases, and integrate with third party services for transactional email, marketing campaigns, payment provider etc., all of which require configuring secrets.

Of course you could populate multiple key/value pairs in Vault like this:

```bash
vault kv put kv/secret/config DB_PASSWORD=veryverysecretpassword OTHER_DB_PASSWORD=anothersecret EMAIL_PROVIDER_API_KEY=abc123...
```

And update the template data with a row for each secret.

```nomad
job "example" {
  group "web" {
    task "frontend" {
      template {
        destination = "secrets/file.env
        env = true

        # read multiple secrets from Vault
        data = <<EOH
{{with secret "kv/secret/config"}}
DB_PASSWORD={{.Data.data.DB_PASSWORD | toJSON}}
OTHER_DB_PASSWORD={{.Data.data.OTHER_DB_PASSWORD | toJSON}}
EMAIL_PROVIDER_API_KEY={{.Data.data.EMAIL_PROVIDER_API_KEY | toJSON}}
...
{{end}}
EOH
      }
    }
  }
}
```

The problem  with this is the `template` stanza will get quite lengthy. Also maintenance becomes an issue because the `template` stanza can only be placed in the `task` stanza. So if the jobspec has multiple groups/tasks, the lengthy template needs to occur in all of them, and if a new secret is added, multiple template stanzas need to be updated.

Fortunately there's a more efficient way to do this. It involves populating Vault with a JSON file rather than individual key/value pairs. Then using the `range` action in the template stanza, to iterate over the key/value map from Vault, and dynamically create all environment variables from the json that was loaded in Vault.

To start, create a json file with all the secrets, this is just temporary and can be deleted after its loaded into Vault. For example:

```json
# data.json
{
  "DB_PASSWORD": "veryverysecretpassword",
  "OTHER_DB_PASSWORD": "anothersecret",
  "EMAIL_PROVIDER_API_KEY": "abc123",
  ...
}
```

Run the following command to load this file into Vault:

```bash
vault kv put kv/secret/config @data.json
```

Update the template stanza in the jobspec to use the `range` action to iterate over each key/value pair in Vault. Since the value being read from Vault is a map, two variables `$key` and `$value` can be assigned with the result of each key/value pair, i.e. environment variable and its value. These then get written out with a literal equals sign `=` between them, with the value being piped through the `toJSON` function as explained previously:

```nomad
job "example" {
  group "web" {
    task "frontend" {
      template {
        destination = "secrets/file.env
        env = true

        # read multiple secrets from Vault
        data = <<EOH
{{with secret "kv/hover/config"}}
{{range $key, $value := .Data.data}}
{{$key}}={{$value | toJSON}}{{end}}
{{end}}
EOH
      }
    }
  }
}
```

After this job is deployed, the destination file `secrets/file.env` will be populated as follows:

```
DB_PASSWORDveryverysecretpassword
OTHER_DB_PASSWORDanothersecret
EMAIL_PROVIDER_API_KEYabc123
```

## Nomad CLI

This next section contains tips on working with the Nomad CLI. Follow the [instructions](https://www.nomadproject.io/docs/install) for your OS to install it. Although Nomad does have a Web UI to display jobs, their status, and allocations among many other things, it's usually more convenient to use the CLI to get this information.

### Validation

For a new jobspec file, or if you've made changes to an existing one, you'll want to validate it first, before submitting it to Nomad for deployment. This will provide quick feedback if there are any errors in the file.

For example, given the following jobspec:

```nomad
# example.nomad
job "example" {
  datacenters = ["us-west-1"]
  type = "service"

  group "web" {
    task "frontend" {
      driver = "docker"
      config {
        image = "hashicorp/web-frontend"
        ports = ["http", "https"]
      }
    }
  }
}
```

It can be validated as follows:

```
nomad job validate example.nomad
```

Output from the validate command shows validation passed:

```
Job Warnings:
0 warning(s):
Job validation successful
```

As an exercise, we can intentionally break this, suppose the job had specified `type = "services"` instead of `service`:

```nomad
# example.nomad
job "example" {
  datacenters = ["us-west-1"]
  type = "services"

  group "web" {
    task "frontend" {
      driver = "docker"
      config {
        image = "hashicorp/web-frontend"
        ports = ["http", "https"]
      }
    }
  }
}
```

This time the result of running the validation command `nomad job validate example.nomad` yields an error:

```
Job validation errors:
1 error occurred:
	* Invalid job type: "services"
```

### Allocation Status

After deploying a job (`nomad job run /path/to/jobspec_file`), the output of this command may indicate that it's complete, but it's possible that some tasks may have failed to start. In order to get more insight into this, you'll want to query the job and *allocation* status.

Before showing the CLI command for allocation status, let's take a brief detour to define it. An allocation is how Nomad declares that some tasks in a given job should be run on a particular node, aka Nomad client machine.

All of the jobspec examples so far have shown a single task, but you can actually have multiple tasks within a group, and multiple groups within a job. Putting multiple tasks within the same group tells Nomad that you want all those tasks running on the same Nomad client machine. Having one task per group and multiple groups within a job tells Nomad that it's free to allocate each task group to separate Nomad clients (although it could still choose to allocate them to the same client, pending resource utilization).

For example, suppose you submit the following jobspec to run a Rails app including 3 Puma servers and Sidekiq for background job processing:

```nomad
# railsapp.nomad
job "rails-app" {
  datacenters = ["us-west-1"]
  type = "service"

  group "web" {
    count = 3
    task "puma" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
        command = "bash"
        args = ["-c", "bundle exec puma"]
      }
    }
  }

  group "background" {
    task "sidekiq" {
      driver = "docker"
      config {
        image = "ghcr.io/org/project/app:latest"
        command = "bash"
        args = ["-c", "bundle exec sidekiq"]
      }
    }
  }
}
```

After submitting the job via `nomad job run railsapp.nomad`, the console output will show that submission is complete. But to check whether things are actually working, first check the job status:

```
nomad job status rails-app
```

The last portion of this output will show the allocations:

```
Allocations
ID        Node ID   Task Group  Version  Desired  Status   Created   Modified
dac34c14  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
df7e2471  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
26002bd0  2008ce70  web          1       run      running  1d6h ago  1d6h ago
fa2b2ed6  4163a6ca  background   1       run      running  1d6h ago  1d6h ago
```

There are 4 allocations - 3 are for the `web` group because the jobspec indicated a `count` property of 3 for these, and 1 for the `background` group because this jobspec only indicated 1 sidekiq process (the `count` property defaults to 1).

In the previous example, all allocations were successfully started, but sometimes you may see the status as `failed`. In this case, you can inspect the allocation to investigate by passing the allocation ID (first column of previous output) to the `nomad alloc status` command. For example, to inspect the first `web` allocation:

```
nomad alloc status dac34c14
```

The output will include events that happened during this allocation:

```
Task "puma" is "running"

Task Events:
Started At     = 2021-12-17T19:28:21Z
Finished At    = N/A
Total Restarts = 0
Last Restart   = N/A

Recent Events:
Time                       Type        Description
2021-12-17T14:28:21-05:00  Started     Task started by client
2021-12-17T14:28:19-05:00  Driver      Downloading image
2021-12-17T14:28:18-05:00  Task Setup  Building Task Directory
2021-12-17T14:28:14-05:00  Received    Task received by client
```

If something went wrong such as the Nomad client could not download the Docker image, the error would be shown in the events.

**Bonus:** The Nomad CLI supports tab completion. Simply run `nomad -autocomplete-install` to enable it.

For example, given a list of allocations displayed from the `nomad status rails-app` command:

```
Allocations
ID        Node ID   Task Group  Version  Desired  Status   Created   Modified
dac34c14  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
df7e2471  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
26002bd0  2008ce70  web          1       run      running  1d6h ago  1d6h ago
fa2b2ed6  4163a6ca  background   1       run      running  1d6h ago  1d6h ago
```

You can type in `nomad alloc status da{TAB}` and Nomad will fill in the allocation ID to complete the command.

### Run a shell in container

Sometimes you'll want to shell into a running container to troubleshoot something. For example, to check whether the expected environment variables were properly populated from Vault secrets, or whether you can ping a certain host if having some networking issues. This can be done with the `nomad alloc exec` command, passing in the task name and allocation id.

To launch a shell in the sidekiq container from the previous example:

```bash
nomad alloc exec -i -t -task sidekiq fa2b2ed6 /bin/bash
```

Tab completion still works here for the allocation ID.

### Run a command in container

Taking it one step further, you might want to run a specific command from a shell in the container. For example, with a Rails app, a common troubleshooting technique is to launch a Rails console and run some application code.

The two step way to do this is to run a shell as before, then type in your command from within the shell, for example:

```bash
nomad alloc exec -i -t -task puma fa2b2ed6 /bin/bash
root@725b3752ada5: bundle exec rails c
# do rails console things...
```

Shorten this to one step with the `-c` flag to pass a command to the shell:

```bash
nomad alloc exec -i -t -task puma fa2b2ed6 /bin/bash -c "bundle exec rails c"
```

Tab completion still works here for the allocation ID.

### Node Status

Recall the list of allocations that were displayed from the `nomad job status rails-app` command:

```
Allocations
ID        Node ID   Task Group  Version  Desired  Status   Created   Modified
dac34c14  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
df7e2471  4163a6ca  web          1       run      running  1d6h ago  1d6h ago
26002bd0  2008ce70  web          1       run      running  1d6h ago  1d6h ago
fa2b2ed6  4163a6ca  background   1       run      running  1d6h ago  1d6h ago
```

We've been looking at the allocations, but you can also get more information about the node (aka Nomad client machine) that the allocation is running on. This is done by passing the Node ID (second column in the Allocations table) to the `nomad node status` command. In the above table, we can see that two of the `web` task groups and the `background` group are running on the same node, whereas the third `web` group got allocated to a different node.

To get information about the node that's running the two web and background groups:

```
nomad node status 4163a6ca
```

This displays a lot of output, just going to highlight a few things. The Node Events can be useful for troubleshooting, for example if the node is no longer able to connect to the docker daemon. In the example below, it was able to recover:

```
Node Events
Time                  Subsystem       Message
2021-12-06T18:49:11Z  Cluster         Node re-registered
2021-12-06T18:42:08Z  Cluster         Node heartbeat missed
2021-12-03T23:07:31Z  Driver: docker  Healthy
2021-12-03T23:04:01Z  Driver: docker  Failed to connect to docker daemon
```

The output also shows cpu and memory resources that are allocated on this node and how much is currently being used:

```
Allocated Resources
CPU              Memory         Disk
36988/36784 MHz  32 GiB/31 GiB  2.1 GiB/93 GiB

Host Resource Utilization
CPU            Memory          Disk
889/36784 MHz  4.8 GiB/31 GiB  110 MiB/98 GiB
```

### Job Version - What's Changed?

Every time you run `nomad job run /path/to/jobspec`, Nomad will create a new version of the job. It can be useful to know what was changed between versions.

The following command will display the complete version history for a job:

```
nomad job history -p job_name
```

However, if there have been a lot of deploys, the output of this can be too verbose. It's also possible to get history for just one specific version number, which will show the diff between that version and the previous version.

For example, the `rails-app` job from the previous section has 50 versions. To see the difference between version 50 and 49 that came before it:

```
nomad job history -version 50 -p rails-app
```

The sample output below shows that the `sidekiq` task in the `background` group had its memory increased from 2GB to 8GB:

```
Version     = 50
Stable      = true
Submit Date = 2021-12-17T14:27:22-05:00
Diff        =
+/- Job: "rails-app"
+/- Task Group: "background"
  +/- Task: "sidekiq"
    +/- Resources {
      +/- MemoryMB:    "2048" => "8192"
          MemoryMaxMB: "0"
        }
```

### Aliases and Bash Functions

Here are a few aliases and shell functions I use to save myself typing for the most frequently run Nomad CLI commands.

Get status for the main web app `rails-app`:

```bash
# change the alias value for something easy to remember for your job
alias nsra="nomad status rails-app"
```

Get allocation status:

```bash
# usage nas {alloc id}
alias nas="nomad alloc status"
```

Tab complete will work with the alias, for example, if first few characters of the allocation ID are `4d`, then type: `nas 4d{TAB}`

The other commands I use most frequently are to run a shell, and Rails console in a container. An alias won't work here as the allocation ID occurs in the middle of the command, and AFAIK, aliases don't support variables. However, this can be solved with shell functions.

Add the following functions to your bash or zsh profile. Replace the task names with the values from your jobspec file:

```bash
# Run bash in the Nomad puma container specified by allocation id
# Usage: nab alloc_id
nab () { nomad alloc exec -i -t -task puma $@ /bin/bash }

# Run a Rails console in the Nomad puma container specified by allocation id
# Usage: nrc alloc_id
nrc () { nomad alloc exec -i -t -task puma $@ /bin/bash -c "bundle exec rails c" }
```

### Easily switch between Namespaces

When running Nomad CLI commands from a laptop and connecting to a remote Nomad cluster, there are a number of environment variables that must be specified. These include:

* `NOMAD_NAMESPACE`: Namespace to limit commands to, for example, our team uses: `dev`, `staging`, and `prod`.
* `NOMAD_ADDR`: Address of the machine where Nomad server is running. For our installation, this varies by namespace.
* `NOMAD_TOKEN`: ACL token to authenticate API requests. For our setup, this also varies by namespace.

When using multiple namespaces and having to switch between them, it's tedious to have to remember to modify one's profile to ensure the correct set of environment variables are exported.

[direnv](https://direnv.net/) is a shell extension that makes this more convenient. It will load/unload environment variables based on presence of a `.envrc` file in the current directory. Here's how I've organized to support easily switching between our dev, staging, and prod environments.

```
nomad-env
├── dev
│   └── .envrc
├── staging
│   └── .envrc
└── prod
    └── .envrc
```

Where each .envrc file contains:

```bash
NOMAD_ADDR=https://nomad-server-url (for the current env)
NOMAD_TOKEN=acl_token (for the current env)
NOMAD_NAMESPACE=dev (or staging or prod)
```

<aside class="markdown-aside">
Note that direnv is not Nomad specific. This tool can be used anywhere you need to easily switch between sets of environment variables.
</aside>

## Conclusion

This post has covered a number of useful tips for working with Nomad including working with the jobspec HCL file and making use of the Nomad CLI. Here are some resources for further reading and bookmarking if you're going to be using Nomad:

* [Job Specification](https://www.nomadproject.io/docs/job-specification)
* [Command Line Reference](https://www.nomadproject.io/docs/commands)
* [Environment Variables](https://www.nomadproject.io/docs/runtime/environment)
* [Github Repo with Numerous Example Jobs](https://github.com/angrycub/nomad_example_jobs)
