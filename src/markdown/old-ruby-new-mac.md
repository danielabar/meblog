---
title: "Old Ruby and New Mac"
featuredImage: "../images/ruby-in-box.png"
description: "Run an old Ruby on Rails project on an ARM based Mac using Docker"
date: "2023-06-01"
category: "rails"
related:
  - "Dockerize a Rails Application for Development"
  - "Fix Rails Blocked Host Error with Docker"
  - "Private Gems and Docker for Development"
---

Picture this scenario - you're a Rails developer that just got one of the new M1 or M2 Macs and are enjoying the performance boost and energy efficiency that comes from the ARM-based architecture. You've installed and configured all your dev tooling (oh-my-zsh, homebrew, rbenv, etc.) and are ready to get to work. Everything is great.

![happy dog yay](../images/happy-dog-yay-cropped.png "happy dog yay")

Then you receive your next assignment, which is to perform some maintenance on an old Rails 4 project using Ruby 2.3.x (yes they still exist). So you get started by installing Ruby 2.3.3 and encounter the following error:

```
$ rbenv install 2.3.3
To follow progress, use 'tail -f /var/folders/t7/6n5394xn43sd2x3y8m06gdx40000gn/T/ruby-build.20230501063921.13746.log' or pass --verbose
Downloading openssl-1.0.2u.tar.gz...
-> https://dqw8nmjcqpjn7.cloudfront.net/ecd0c6ffb493dd06707d38b14bb4d8c2288bb7033735606569d8f90f89669d16
Installing openssl-1.0.2u...

BUILD FAILED (macOS 13.3.1 using ruby-build 20230330)

Inspect or clean up the working tree at /var/folders/t7/6n5394xn43sd2x3y8m06gdx40000gn/T/ruby-build.20230501063921.13746.TS6Kze
Results logged to /var/folders/t7/6n5394xn43sd2x3y8m06gdx40000gn/T/ruby-build.20230501063921.13746.log

Last 10 log lines:
      _dgram_write in libcrypto.a(bss_dgram.o)
      _RAND_query_egd_bytes in libcrypto.a(rand_egd.o)
      ...
ld: symbol(s) not found for architecture i386
clang: error: linker command failed with exit code 1 (use -v to see invocation)
make[4]: *** [link_a.darwin] Error 1
make[3]: *** [do_darwin-shared] Error 2
make[2]: *** [libcrypto.1.0.0.dylib] Error 2
make[1]: *** [shared] Error 2
make: *** [build_crypto] Error 1
```

That feeling...

![uh oh dog](../images/uh-oh-dog-text.png "uh oh dog")

The issue here is with OpenSSL linking against the i386 architecture, which is not compatible with the new Mac's ARM-based architecture, and so the build fails. There are some [suggestions](https://stackoverflow.com/questions/69012676/install-older-ruby-versions-on-a-m1-macbook) related to uninstalling OpenSSL and re-installing with alternate compile flags. You can also attempt to uninstall all the dev tooling, setup for [rosetta all the things](https://apple.stackexchange.com/questions/409746/run-everything-in-rosetta-2-on-silicon-mac), then re-install.

I tried a variety of these and was still getting errors. Keep in mind its not just Ruby that needs to be installed, its also all the older gems and some of them require native extensions which will also cause issues. I was also concerned that it would cause problems when I have to switch to other projects that use newer Ruby versions (3.x and above are compiled for the newer Macs), as I frequently toggle between different projects. In this post I'll share an alternative solution using Docker that I found easier to get working.

The idea is to build a Docker image that comes with the older Ruby version needed for this project, mount the project code into this image, and install the project dependencies as part of the image. Then a container can be run from this image, and all the usual Rails commands such as starting a server, console, etc. can be run inside the container.

<aside class="markdown-aside">
This post assumes some familiarity with some Docker concepts including images, containers, and use of Docker Compose to manage multi-container applications. If you need a refresher on Docker fundamentals, check out the <a class="markdown-link" href="https://docs.docker.com/get-started/">Getting Started</a> guide and <a class="markdown-link" href="https://docs.docker.com/get-started/resources/">Educational Resources</a>.
</aside>

## Docker Image

The first thing that's needed is to build the Docker image. When doing so, we need to select a base image from which to get started. I'm using a [CircleCI Ruby image](https://hub.docker.com/r/circleci/ruby) as it comes with common dev tooling and a non-root user named `circleci`. Here is the Dockerfile that uses the Ruby 2.3.3.

To use it, place the following in the root of your project, replace `2.3.3` with your Ruby version, and `myapp` with your app name:

```Dockerfile
# https://hub.docker.com/layers/circleci/ruby/2.3.3/images/sha256-d4ee971ae3f1c1eac1301c79e7d1a9b994b2d8b0f0ed899ffa4f7f11dd21d1ff?context=explore
FROM circleci/ruby:2.3.3

# Set path to the app as an environment variable
# so it can be referenced again in this file as `$app`
ENV app /usr/share/myapp

# Create a directory for our app.
RUN sudo mkdir -p $app

# Make the `circleci` user owner of our app dir.
RUN sudo chown circleci $app

# Give `circleci` owner read/write/execute on app dir
# and all dirs/files within it, and read/execute for other users.
RUN sudo chmod -R 0755 $app

# Set the working directory to our app dir.
WORKDIR $app

# Copy files/dirs from build context to the current working directory in container,
# and sets the user/group ownership of copied files/dirs to circleci:circleci.
COPY --chown=circleci:circleci . .

# Replace with bundler version used by your old app.
RUN gem install bundler:1.17.3

# Install app dependencies
RUN bundle install
```

## Docker Compose

Next up, add the following `docker-compose.yml` file to the root of the project. This will make it easy to run a container from the Dockerfile created in the previous step:

```yml
version: "3.9"
services:
  myapp:
    # Use Dockerfile from current directory
    build:
      context: .

    # Optional if using dotenv, provide your .env file here
    # env_file:
    #   - .env

    # Mount the current directory `.` into container at `/user/share/myapp`
    volumes:
      - .:/usr/share/myapp

    # Map port 3000 on the container to 3000 on the host
    ports:
      - "3000:3000"

    # Allows container to respond to Ctrl+C and to view container's output in real-time
    tty: true
```

To build the image, run:

```
docker-compose build
```

## Docker Container

To run a container from the image, run:

```
docker-compose up
```

This will run the container in the foreground, which attaches the terminal to the logs of the containers so that you can see their output. But then you can't use that terminal session for anything else, and have to open a new terminal tab to do other things.

Alternatively, you can run the container in the background (aka detached mode), and the output will not be displayed in the terminal:

```
docker-compose up -d
```

If you run it in the background, you can always view the logs with the command below which will "follow" the logs in real time:

```
docker-compose logs -f
```

## Rails Server

Now that you have a running container, it's time to start a Rails server. To do this, first run a shell in the container, using `exec` which is used to execute a command inside a running container:

```
docker-compose exec myapp bash
```

Then from the shell prompt in the container, start the Rails server:

```bash
pwd
# Should be /usr/share/myapp because of WORKDIR setting in Dockerfile

ls
# Should see contents of myapp such as models, views, controllers, lib, etc.

# Start Rails server
rails server
# Server should be listening on port 3000
```

At this point, you should be able to navigate to `http://localhost:3000` in a browser and view your app's home page.

Note that if you shutdown your computer which will stop the container, or use `docker-compose stop` to stop the container, the Rails server process that's running in the container may not shut down cleanly because it's not running as PID 1 in the container. That means if you shell in again to run a Rails server, you may get the [server is already running](https://testsuite.io/a-server-is-already-running-pids) error. We'll deal with this shortly.

## Other Commands

To run any other commands in the container such as database migrations or a Rails console, open a new terminal tab, shell into the container (you can have multiple shells) and run your command. For example, to run database migrations:

```
docker-compose exec myapp bash
rake db:migrate
```

To run a Rails console:

```
docker-compose exec myapp bash
rails console
```

## Combining Commands

One thing you may have noticed about running Rails dockerized is there's more typing to get things running. For example, to run a Rails console, requires three commands:

```bash
# Start container
docker-compose up

# Shell into container
docker-compose exec myapp bash

# Run Rails console from container shell
rails console
```

The last two can be combined as follows:

```
docker-compose exec myapp rails console
```

This works because there's only one version of rails and one rails app installed in the container.

Starting a Rails server requires a little more work to get it into one step, the following may not work:

```
docker-compose exec myapp rails server
```

This is because if the `./tmp/server.pid` file is still lying around from last time, you'll get a `server is already running` error. To solve this, let's introduce a script that first removes this file, then runs the Rails server, then use docker-compose to execute this script.

Place the following in `scripts/run_dev.sh` (I'm assuming you have a directory `scripts` in the root of your project, if not, create it):

```bash
#!/bin/bash
cd /usr/share/myapp

rm -f ./tmp/pids/server.pid

rails server
```

Make it executable with `chmod +x scripts/run_dev.sh`. Now you can start a Rails server by passing the `-c` flag to the `bash` command, which tells it to execute the script in the container:

```
docker-compose exec myapp bash -c "./scripts/run_dev.sh"
```

## Even Less Typing

Even with the previous technique of combining commands with `exec` and `-c` flag, there's still a lot of typing. You could [alias](https://phoenixnap.com/kb/linux-alias-command) them but then you'd have to remember what you aliased them to, and then each team member working on this project would have to setup their own aliases.

An easier way is to introduce a Makefile into the project. A Makefile is a simple text file containing a set of instructions (rules) that specify how to build the project. The rules specify the dependencies and the commands needed to build or update them. Traditionally used for C/C++ projects, a Makefile can also make life more convenient by reducing the amount of typing needed to run commonly used commands on any project.

For example, in the previous section, we saw that to run a Rails server within the Docker container required:

```
docker-compose exec myapp bash -c "./scripts/run_dev.sh"
```

If you were to add the following `Makefile` in the project root:

```Makefile
server:
  docker-compose exec myapp bash -c "./run_dev.sh"
```

Then you could simply run this at the terminal to start the Rails server:

```
make server
```

There's still a problem though, if you don't remember to first start the container, running `make server` will result in an error like this:

```
service "myapp" is not running container #1
```

This can be solved with task dependencies. We can add a `start` task that will check if the container isn't already running, then start it, and then have the `server` task depend on the `start` task:

```Makefile
start:
  ./scripts/start_dev_container.sh

# run the `start` task before the `server` task
server: start
  docker-compose exec myapp bash -c "./run_dev.sh"
```

Where the `start_dev_container.sh` script attempts to run an echo statement in the container, and then inspects the return code. If the container is not started, this would error and the return code will be non-zero. If we get a non-zero return code, then we start the container in the background:

```bash
#!/bin/bash

docker-compose exec myapp echo "dev container is running"
ret=$?
[[ $ret -ne 0 ]] && docker-compose up -d
exit 0
```

You can add the most common Rails commands to the Makefile, making each dependent on the `start` task. Here's what I use, feel free to add more as per your projects needs:

```Makefile
# Start the dev container if it's not already running.
start:
	./scripts/start_dev_container.sh

# Stop the dev container.
stop:
	docker-compose stop

# Display dev container status.
status:
	docker-compose ps

# Start a Rails server.
server: start
	docker-compose exec myapp bash -c "./run_dev.sh"

# Launch a shell in container.
shell: start
	docker-compose exec myapp bash

# Launch a Rails console.
console: start
	docker-compose exec myapp rails c

# Migrate database.
migrate_db: start
	docker-compose exec myapp rake db:migrate

# Rollback database.
rollback_db: start
	docker-compose exec myapp rake db:rollback

# Drop db, create db, load schema, custom seeds.
reset_db: start
	docker-compose exec myapp rake db:reset

# Run all the RSpec tests: make test
# To run a specific test: SPECS="path/to/the_spec.rb" make test
test: start
	docker-compose exec myapp rspec $$SPECS

# Run the linter.
rubocop: start
	docker-compose exec myapp rubocop

# Display all available routes.
routes: start
	docker-compose exec myapp rake routes
```

## Drawbacks

There are some drawbacks with this approach. There's some increased complexity in having to learn new tooling for those not already familiar with Docker and docker-compose. Also all the commands are slower to run within the container as compared to when directly installed on the laptop.

## Conclusion

This post has covered how to use Docker and docker-compose to run an old Ruby on Rails project that doesn't easily install on the newer ARM-based Macs. We've learned how to build an image, run a container from this image, use of `exec` to run commands in the container, and use of a Makefile with dependencies to save some typing of lengthy commands.

## TODO

* explain that base image has `CMD ["/bin/bash"]`, i.e. it doesn't do anything on its own, all containers created from this image will be waiting at the shell prompt for us to enter commands.
* `convert ruby-in-box-original.png -resize 900x -gravity center -crop 900x506+0+0 ruby-in-box.png`
* link to Makefile intro
* Research: Is Makefile *nix only? What to do about Windows? Can LSW handle it?
* Make `Dockerfile` show up as yellow tag css
* Fix spacing in makefile
