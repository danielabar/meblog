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

I've been working on a platform migration project to containerize and move several web applications and associated services from a custom home grown system to Hashicorp's [Nomad](https://www.nomadproject.io/). Nomad is a workload orchestration tool designed to make it (relatively) easy to deploy, manage and scale containers on private and public clouds. It is [comparable](https://www.nomadproject.io/docs/nomad-vs-kubernetes) to Kubernetes, but focuses on a smaller scope, delegating features such as service discovery and secrets management to other tools such as Consul and Vault, while providing integration with these. It's also newer than Kubernetes.

One of the challenges in working with a newer platform is a smaller community, and finding online help. Many of my web searches lead to the official Nomad docs. While they are well written, if I'm doing a search, it's because I couldn't find the solution the docs. In the spirit of increasing the body of online knowledge, this post will share a few tips and tricks I've picked up going through this migration.

<aside class="markdown-aside">
The remainder of this post assumes some familiarity with Hashicorp's Nomad. If you haven't used it before, checkout this excellent <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-80f57cd403ca">primer</a> and <a class="markdown-link" href="https://adri-v.medium.com/just-in-time-nomad-running-traefik-on-hashiqube-7d6dfd8ef9d8">tutorial</a>.
</aside>

## Job Specification

The first set of tips are for working with the job specification file (aka jobspec). This is a declarative way of telling Nomad about your application and its resource requirements. The jobspec file is written in [HCL](https://github.com/hashicorp/hcl), which stands for Hashicorp Configuration Language.

Although it can be irritataing when frameworks require learning a framework-specific (i.e. non portable) language, HCL is similar enough to JSON and YAML that anyone familiar with these will pick it up easily. In fact, if JSON and YAML had a baby it might look something like HCL.

### Increase Docker Pull Timeout

When using the [Docker driver](https://www.nomadproject.io/docs/drivers/docker) to run a task, the Nomad client on which the task is running will first pull the Docker image from the specified location. This can be from Docker Hub, Github Container Registry, or a private Docker registry. For example:

```nomad
job "web" {
  group "web" {
    task "webapp" {
      driver = "docker"
      config {
        image = "registry/path/to/image:latest"
        command = "/path/to/command"
      }
    }
  }
}
```

But what happens if there's a networking issue resulting in a longer than usual amount of time to pull the image? In this case, Nomad will timeout the docker pull after 5 minutes and restart according to the `restart` stanza. If the networking issues are not resolved, the job will eventually fail.

To avoid having the job fail when docker pull is taking longer than usual, use `image_pull_timeout` to override Nomad's default timeout. For example, to increase it to 10 minutes:

```nomad
job "web" {
  group "web" {
    task "web" {
      driver = "docker"
      config {
        image = "registry/path/to/image:tag"
        command = "/path/to/command"
        image_pull_timeout = "10m"
      }
    }
  }
}
```

### Reuse Docker Tag for Development

When using Docker to run a Nomad task, the Nomad client will use an existing image if the image:tag specified in the docker driver config section of the job specification has already been pulled. However, during development, you may be making changes to a dev version of the Docker image and re-using the same tag.

For example when developing a new feature, I'll switch to a git feature branch on my laptop, build an image tagged with the feature branch name, push it to the container registry, and deploy it to the Nomad dev environment (we use multiple [namespaces](https://learn.hashicorp.com/tutorials/nomad/namespaces) to isolate dev, staging, and production environments). In this case, I don't want Nomad to use the cached image from my last deploy, but to always pull a "fresh" version of the image. This can be accomplished using `force_pull` as shown below:

```nomad
job "web" {
  group "web" {
    task "web" {
      driver = "docker"
      config {
        image = "registry/path/to/image:tag"
        command = "/path/to/command"
        force_pull = true
      }
    }
  }
}
```

### Always deploy a new job version

The command to deploy a new version of a job is `nomad job run path/to/nomad/job_spec_file`. However, if nothing has changed in the job spec file since the last deploy, then Nomad assumes nothing has changed and will not take any action. This is fine for production where there will be a new Docker image tag (we use the main line git commit sha) for each deploy, which effectively changes the contents of the Nomad file, thus triggering a new deploy.

But for development, we use the same image tag (branch name) so Nomad thinks nothing has changed, even if the image has been updated. Even the `force_pull` explained in the previous section won't help because Nomad won't get as far as evaluating the job spec file.

To force Nomad to always run a deploy, set a `meta` block that is populated with the return value from a uuid function that always generates a unique value. Meta blocks allow user-defined arbitrary key-value pairs. Nomad is written in Golang and so Go functions such as `uuidv4()` can be interpolated in the Nomad file as shown below. The `meta` block should be placed directly in the `job` stanza:

```nomad
job "web" {
  meta {
    run_uuid = "${uuidv4()}"
  }
}
```

### Resiliency

This one is not so much a tip, rather a summary of important stanzas in the jobspec file to understand in order to achieve application resiliency.

One of the many benefits of using an orechestration tool like Nomad is it can handle updates and failures gracefully without manual intervention. In order to take advantage of these features, you must understand and make use of the following stanzas in the job spec file.

TBD: English sentence example for each with hcl

* `update` Specifies update strategy Nomad uses when deploying a new version of the task group. i.e. when `nomad job run path/to/nomad_job_spec_file` is run.

* `restart` Specifies strategy for Nomad to restart failed tasks on the same node (eg: attempt 2 restarts within 30 minutes, delay 15s between each restart, and don't try anymore restarts after those are exhausted).

* `check_restart` Specifies how Nomad should restart a task that is not yet failing, but has become unresponsive or otherwise unhealthy. Works together with Consul health checks. Nomad restarts tasks when a health check has failed.

* `reschedule` Tells Nomad under what circumstances to reschedule failing jobs to another node (eg: after configured number of restarts, if task still not running successfully, could be issue with node such as failed hardware, kernel deadlocks, etc.).

* `migrate` When a node needs to come out of service, it gets marked for draining and Nomad will no longer schedule tasks on that node. Nomad will migrate all existing jobs to other nodes. This stanza specifies the strategy for migrating tasks off of draining nodes. Not needed for jobs with `count` 1 because the single instance will bemigrated immediately.

### Prestart hook for Rails migrations

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
        image = "registry/image:tag"
        command = "bash"
        args    = ["-c", "bundle exec rake db:migrate"]
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

### Nomad environment variables

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

```console
#!/bin/bash

if [ "z$NOMAD_ALLOC_INDEX" == "z0" ]; then
  RAILS_ENV=production bundle exec rake db:migrate
fi
```

### Replace Cron Jobs

If your application also has cron jobs, these can easily be replaced with Nomad's [periodic](https://www.nomadproject.io/docs/job-specification/periodic) jobs.

For example, given the following crontab for a job that runs daily at 10:30:

```
30 10 * * * nobody bundle exec rake app:some_daily_task
```

It can be replaced with the following jobspec:

```nomad
job "app_daily_task" {
  periodic {
    cron = "30 10 * * *"
  }
  group "daily_task" {
    task "daily_task" {
      driver = "docker"
      config {
        image   = "registry/image:latest"
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
job "app_frequent_task" {
  periodic {
    cron = "* * * * *"
    prohibit_overlap = true
  }
  group "frequent_task" {
    task "frequent_task" {
      driver = "docker"
      config {
        image   = "registry/image:latest"
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

One of the many fantastic features of Nomad is integration with Vault. From a job spec file, you can read in secrets from Vault, and have them loaded as environment variables in the application. Without a platform managing this, if an environment variable is changed, the application must manually be restarted to pick up the new value. With Nomad's Vault integration, any change to a secret in Vault will cause all jobs that use this secret to automatically be restated.

However, there may be times where this is undesirable. One such case is for cron jobs (called periodic jobs in Nomad). For example, the application I'm working on has an autorenew cron job that picks up all subscriptions that are due for renewal and renews them, which includes billing the customer and sending a confirmation email. We would not want this job stopped in the middle and restarted just because a setting had been changed, it would be better for the job to complete and have the change be picked up next time the job runs.

In order to implement this behaviour, set `change_mode = "noop"` in the `template` stanza that reads in the secrets.

```nomad
job "autorenew" {
  group "autorenew" {
    task "autornew" {
      template {
        destination = "secrets/local.env"
        env = true
        change_mode = "noop"
        data = <<EOH
{{ with secret "path/in/vault" }}
APP_SECRET={{ .Data.data }}
EOH
      }
    }
  }
}
```

The `destination` file is still updated when the secrets change and so the updated value will be used the next time the cron job is scheduled.

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

```console
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

### Job and Allocation Status

Even after deploying a job (`nomad job run /path/to/jobspec_file`), the output of this command may indicate that it's complete, but it's possible that some tasks may have failed to start. In order to get more insight into this, you'll want to query the job and *allocation* status.

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

```console
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

### Allocation Status

In the previous example, all allocations were successfully started, but sometimes you may see the status as `failed`. In this case, you can inspect the allocation to investigate by passing the allocation ID (first column of previous output) to the `nomad alloc status` command. For example, to inspect the first `web` allocation:

```console
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

Bonus: The Nomad CLI supports tab completion. Simply run `nomad -autocomplete-install` to enable it.

For example, given a list of allocations displayed from the `nomad status some-job` command:

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

```console
nomad alloc exec -i -t -task sidekiq fa2b2ed6 /bin/bash
```

Tab completion still works here for the allocation ID.

### Run a command in container

Taking it one step further, you might want to run a specific command from a shell in the container. For example, with a Rails app, a common troubleshooting technique is to launch a Rails console and run some application code.

The two step way to do this is to run a shell as before, then type in your command from within the shell, for example:

```console
nomad alloc exec -i -t -task puma fa2b2ed6 /bin/bash
root@725b3752ada5: bundle exec rails c
```

Shorten this to one step with the `-c` flag to pass a command to the shell:

```console
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

We've been looking at the allocations, but you can also get more information about the node (aka Nomad client machine) that the allocation is running on. This is done by passing the Node ID (second column in the Allocations table) to the `nomad node status` command. In the above table, we can see that two of the `web` task groups and the `background` group are running on the sane node, whereas the third `web` group got allocated to a different node.

To get information about the node that's running the two web and background groups:

```console
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

Every time you run `nomad job run /path/to/spec_file`, Nomad will create a new version of the job. It can be useful to know what was changed.

The following command will display the complete version history for a job:

```console
nomad job history -p job_name
```

However, if you've done a lot of deploys, the output of this can be too verbose. You can also get history for just one specific version number, which will show the diff between that version and the previous version.

For example, the `rails-app` job from the previous section has 50 versions. To see the difference between version 50 and 49 that came before it:

```console
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

```console
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

Note that `direnv` is not Nomad specific, use this anywhere you need to easily switch between sets of environment variables.

## Conclusion

TBD

## References

Job Spec

Command line reference

Environment variables

3 blog posts on Hashicorps site for building resilient infrastructure

https://github.com/angrycub/nomad_example_jobs
