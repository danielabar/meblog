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

This post will cover how to troubleshoot when the postgresql service installed via Homebrew on a Mac isn't starting. If you work on a Mac, it's likely you use [Homebrew](https://brew.sh/) to install packages. In addition to installing, you can also manage services using Homebrew's [services](https://docs.brew.sh/Manpage#services-subcommand) subcommand. A common usage of the services subcommand is to start and stop databases.

## What's Running

This all started when I wanted to follow along with a Rails tutorial that required scaffolding a new project with [Postgresql](https://www.postgresql.org/) as the database. For production projects, I prefer to setup all databases in [Docker](https://www.docker.com/) containers, but for a simple tutorial, it's fine to use a local service, which I had installed some time ago via `brew install postgresql`.

To get information about services that are currently being managed by Homebrew, use the `list` option of the `services` subcommand:

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

The output of this command showed it was successful:

```
==> Successfully started `postgresql` (label: homebrew.mxcl.postgresql)
```

## The Problem

But before pressing the [easy](https://www.staples.com/Staples-Easy-Button/product_606396) button for finding such a quick fix, I wanted to check that a connection worked. PostgreSQL comes with [psql](https://www.postgresql.org/docs/current/app-psql.html), a command line tool to interact with the database. Let's try to connect to the default `postgres` database:

```
psql -d postgres
```

Unfortunately, the output of this command showed the database was not running:

```
psql: error: connection to server on socket "/tmp/.s.PGSQL.5432" failed: No such file or directory
Is the server running locally and accepting connections on that socket?
```

So much for the easy button. Time to debug...

## Debugging

There's another command that can be used to get more detailed information about a specific service, running it for `postgresql`:

```
brew services info postgresql
```

Output shows that the `postgresql` service is loaded, but not running:

```
postgresql (homebrew.mxcl.postgresql)
Running: ✘
Loaded: ✓
Schedulable: ✘
```

The `brew services list` command can be used again, but this time, instead of showing `none` for `postgresql`, it shows an error status and path to a plist file (because of the earlier attempt to start it which failed):

```
$ brew services list
Name       Status     User   File
mysql      started    dbaron ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
postgresql error  256 dbaron ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
redis      started    dbaron ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
```

The `.plist` files contain service configuration information. Let's take a look at the configuration for the postgresql service:

```
cat ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
```

The output shows that it's an xml file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>KeepAlive</key>
    <true />
    <key>Label</key>
    <string>homebrew.mxcl.postgresql</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/opt/postgresql/bin/postgres</string>
      <string>-D</string>
      <string>/usr/local/var/postgres</string>
    </array>
    <key>RunAtLoad</key>
    <true />
    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/postgres.log</string>
    <key>StandardOutPath</key>
    <string>/usr/local/var/log/postgres.log</string>
    <key>WorkingDirectory</key>
    <string>/usr/local</string>
  </dict>
</plist>
```

Notice that one of the values is a path to an error file (actually its the same file used for both standard out and standard error) - `/usr/local/var/log/postgres.log`. Let's take a look at this file to see if it has any clues as to why postgresql isn't starting:

```
$ cat /usr/local/var/log/postgres.log
2022-06-16 15:15:04.193 EDT [69330] FATAL:  database files are incompatible with server
2022-06-16 15:15:04.193 EDT [69330] DETAIL:  The data directory was initialized by PostgreSQL version 13, which is not compatible with this version 14.3.
```

Aha, a version incompatibility error! To confirm the version of the currently installed service:

```
$ psql --version
psql (PostgreSQL) 14.3
```

## Solution

When the Postgres data directory was first created, I must have been on older Postgres version 13, and at some point updated the brew formula to 14. Fortunately, there's a formula you can run to [migrate](https://formulae.brew.sh/formula/postgresql) the data from a previous major version:

```
brew postgresql-upgrade-database
```

There will be a whole lot of output from this command, but here are some highlights of what it does:

```
Runs: brew install postgresql@13
Runs: Upgrading postgresql data from 13 to 14..
Runs: Moving postgresql data from /usr/local/var/postgres to /usr/local/var/postgres.old...
Runs: Migrating and upgrading data...
Finally success:
==> Upgraded postgresql data from 13 to 14!
==> Your postgresql 13 data remains at /usr/local/var/postgres.old
==> Successfully started `postgresql` (label: homebrew.mxcl.postgresql)
```

It installs the previous major version of postgresql (in my case, I was on 14 so previous major was 13), migrates, backs up the current data directory to `.old`, then migrates the data to the new major version. The idea being if something goes wrong with data migration, you can still access your old data with the previous major.

Finally this command also starts up the current/latest version of the service. Let's confirm its started:

```
$ brew services list
Name       Status     User   File
mysql      started    dbaron ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
postgresql started    dbaron ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
redis      started    dbaron ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
```

Last check is to ensure we can connect:

```
$ psql -d postgres
psql (14.2)
Type "help" for help.

postgres=#
```

This time the `psql` connection command goes to the `postgres` prompt, which means connection could be established, success!

## Conclusion

This post has walked through how to fix an issue with the postgresql service not starting on a Mac when managed by homebrew. In general when debugging homebrew services, use the `brew services list` command to get information about managed services and their plist files which contain configuration for the service. Then inspect the contents of the plist file to see if it specifies any log files. Then check the log file(s) for reason why service won't start and fix that.

TODO
* another debug technique - is anything listening on port `lsof -nP +c 15 | grep LISTEN`. See for more explanation of the cli options https://linuxhandbook.com/lsof-command/