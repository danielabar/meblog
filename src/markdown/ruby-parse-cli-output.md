---
title: "Use Ruby to Parse Command Line Output"
featuredImage: "../images/chain-ruby-one-liners-karine-avetisyan-ipuiM-36tAg-unsplash.jpg"
description: "Chain Ruby one-liners to parse command line output and execute system commands."
date: "2022-03-20"
category: "ruby"
related:
  - "Testing Faraday with RSpec"
  - "Solving a Python Interview Question in Ruby"
  - "How I Setup my Terminal"
---

This post will show you how to chain together multiple Ruby one-liners to parse command line output from system commands, and execute further system commands using the output from the previous command. Why would you want to do this? Consider the following scenario.

Our team is using [Nomad](../nomad-tips-and-tricks) to deploy a Rails application which runs with multiple instances of Puma and a Sidekiq server for background jobs. Each of these runs in Docker containers, all orchestrated by Nomad. We frequently need to run a shell in one of the containers to perform some troubleshooting. This requires running two commands.

The first command gets the status of the Nomad job that runs Puma and Sidekiq. This command displays a list of allocations, which can be used to get at the Docker containers running the multiple instances of Puma and Sidekiq. Then a second command is needed to run a shell in a container, which requires the allocation ID of the container to run in. It looks like this:

```bash
### FIRST COMMAND ###
# Get status of job `myapp` which runs Puma and Sidekiq
$ nomad job status myapp

# Output of the status command
Name          = myapp
Type          = service
Status        = running
...

Allocations
ID        Node ID   Task Group  Version  Desired  Status   Created    Modified
1afe229e  3008ce71  puma        123      run      running  2d20h ago  2d20h ago
ff39a003  3008ce71  puma        123      run      running  2d20h ago  2d20h ago
9bd5fa5d  5163a6cb  puma        123      run      running  2d20h ago  2d20h ago
e5353169  3008ce71  sidekiq     123      run      running  2d20h ago  2d20h ago

### SECOND COMMAND ###
# Run a shell in the sidekiq container, given Allocation ID from the previous command
$ nomad alloc exec -i -t -task sidekiq e5353169  /bin/bash

# Now we're in the sidekiq container
root@d60b9bcf4827:/myapp#
```

Not only does this require two commands, but it also requires visually scanning the output of the status command to find the Allocation ID of the sidekiq container, then copying it to paste into the second command to run a shell in this container.  If this was required only once in a while, it would be fine to leave as is. But this is a task everyone on our team has to do frequently, and the manual effort was getting tedious. Since we're a Ruby shop, it was a natural fit to use Ruby to help with automating this.

## Script Solution

Here is the script that solves this problem. It's placed it in the `script` directory in the project root:

```bash
#!/bin/bash

# script/run-nomad-shell.sh

# Parse sidekiq allocation ID from status output, storing it in $id variable
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))

# Run a shell in sidekiq allocation parsed from previous step
nomad alloc exec -i -t -task sidekiq $id /bin/bash
```

The first line uses a chain of ruby one-liners to execute the nomad status command, and parse it with regex to capture the sidekiq container allocation ID. The result of the regex capture group gets stored in a script variable `id`. This variable is then used in the second command to run a shell in the container.

The second command is fairly straightforward, but the first command looks a little hairy, let's break it down.

## Ruby One Liners

## Backticks

## Regex with Capture Group

## Chaining  Multiple One Liners

## Accessing Capture Group

Note `$1` is not bash script variable...


* TBD: Reference Ruby Regex Tutorial: https://www.rubyguides.com/2015/06/ruby-regex/
* TBD: Refernce Ruby One Liners: https://learnbyexample.github.io/learn_ruby_oneliners/one-liner-introduction.html
* TBD: Aside strictly defining allocation: "An Allocation is an instantiation of a task group running on a client node. If there need to be 3 instances of a task group specified in the job, Nomad will create 3 allocations and place those accordingly. An allocation is similar to a pod once the pod is scheduled on a worker node."
* TBD: Change one of related posts to regex post?