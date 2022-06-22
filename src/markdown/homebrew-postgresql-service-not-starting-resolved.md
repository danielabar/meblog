---
title: "Homebrew Postgresql Service not Starting Resolved"
featuredImage: "../images/postgresql-homebrew-nam-anh-QJbyG6O0ick-unsplash.jpg"
description: "Learn why your postgresql homebrew service won't start and how to fix it."
date: "2022-10-01"
category: "PostgreSQL"
related:
  - "How I Setup my Terminal"
  - "Automate Tabs & Commands in iTerm2"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

Intro WIP...

This post will cover how to troubleshoot when the postgresql service installed view Homebrew on a Mac isn't starting. If you work on a Mac, it's likely you use [Homebrew](https://brew.sh/) to install packages. In addition to installing, you can also manage services using Homebrew's [services](https://docs.brew.sh/Manpage#services-subcommand) subcommand. A common usage of the services subcommand is to start and stop databases.

## What's Running

This all started when I wanted to follow along with a Rails tutorial that required scaffolding a new project with Postgresql as the database. For production projects, I prefer to setup all databases in [Docker](https://www.docker.com/) containers, but for a simple tutorial, it's fine to use a locally installed PostgreSQL database, which I had installed some time ago via `brew install postgresql`.

I couldn't remember if I had started it or not way back when first installed. To check what services are currently being managed by Homebrew, use the `list` option of the `services` subcommand:

```
brew services list
```

My output showed I had mysql, postgresql, and redis as managed services, but that postgres wasn't started:

```
mysql      started dbaron ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
postgresql none
redis      started dbaron ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
```

So the fix should be simple enough, just start it with the `start` option of the `services` subcommand:

```
brew services start postgresql
```

Output of this command showed it was successful:

```
==> Successfully started `postgresql` (label: homebrew.mxcl.postgresql)
```

## The Problem

But before pressing the "that was easy" button for finding such a quick fix, I wanted to run a quick test to make sure I could actually connect to the running database. PostgreSQL comes with [psql](https://www.postgresql.org/docs/current/app-psql.html), a command line tool to interact with the database. Let's try to connect to the default `postgres` database:

```
psql -d postgres
```

Unfortunately, the output of this command showed the database was not running:

```
psql: error: connection to server on socket "/tmp/.s.PGSQL.5432" failed: No such file or directory
Is the server running locally and accepting connections on that socket?
```

## Debugging

TODO...

## Solution

TODO...

## Conclusion

TODO...