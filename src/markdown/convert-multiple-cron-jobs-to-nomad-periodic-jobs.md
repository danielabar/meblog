---
title: "Migrate Cron Jobs to Nomad the Lazy Way"
featuredImage: "../images/lazy-david-clode-BCI9_1eJfO0-unsplash.jpg"
description: "Learn how to use some bash scripting to generate multiple Nomad periodic jobs from a crontab."
date: "2021-11-21"
category: "devops"
related:
  - "Build a CI/CD Pipeline for a Gatsby Site"
  - "Automate Tabs & Commands in iTerm2"
  - "Dockerize a Rails Application for Development"
---

Laziness is usually considered a pejorative term, but when it comes to software engineering, this is not necessarily the case. This post will walk through a problem I was facing in converting multiple cron jobs from a legacy platform to a new one, and how being lazy saved manual effort and made future maintenance easier.

The application I'm working on has a custom build and deploy pipeline based on xen and some home grown promotion tools. Our team is working on switching to a more modern workflow including building out a private cloud with Openstack, the Hashicorp stack for infrastructure as code (including Terraform, Nomad, Vault, and Consul), and Github Actions for CI/CD automation.

TODO: Aside assuming some Nomad knowledge, point to primer article.

As part of this migration, 30+ cron jobs from the old xen based build had to be converted to run on Nomad. Nomad has a [periodic](https://www.nomadproject.io/docs/job-specification/periodic) stanza that is designed to run a given task on a particular schedule, so this is perfect for running cron jobs. However, the `periodic` stanza which defines the `cron` schedule can only be placed at the Nomad `job` level. This means that each entry in the application's crontab needs its own `.nomad` job file. Each resulting `.nomad` job file would end up looking very similar, the only differences being in the job/group/task names, the cron schedule, and the command to run.

Being a [lazy](https://medium.com/the-lazy-developer/on-laziness-26d7a9f32066) developer, there was no way I wanted to manually write over 30 nomad files. Not only would the initial work be tedious, but what if they all required a change in the future? Even with global find/replace in files, that would still be too much manual effort. Instead, I decided to write a generator - a bash script to parse the existing crontab (well, a modified version of it which I'll discuss soon) and generate each nomad file from a template file.

TODO: Script that submits them all, invoked by step in Github Action for CD