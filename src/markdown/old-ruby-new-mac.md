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

Picture this scenario - you're a Rails developer that just got one of the new M1 or M2 Macs and are enjoying the performance boost and energy efficiency that comes from the ARM-based architecture.

You've installed all your dev tooling (oh-my-zsh, homebrew, rbenv, etc.) and are ready to get to work. Your next assignment is to perform some maintenance on an old Rails 4 project using Ruby 2.3.x (yes they still exist). So you get started by installing Ruby 2.3.3 and encounter the following error:

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

## Image

The first thing that's needed is to build the Docker image. When doing so, we need to select a base image from which to get started. I'm using a [CircleCI Ruby image](https://hub.docker.com/r/circleci/ruby) as it comes with common dev tooling and a non-root user by default. Here is the Dockerfile that uses the Ruby 2.3.3:

```Dockerfile
# https://hub.docker.com/layers/circleci/ruby/2.3.3/images/sha256-d4ee971ae3f1c1eac1301c79e7d1a9b994b2d8b0f0ed899ffa4f7f11dd21d1ff?context=explore
FROM circleci/ruby:2.3.3

# Is PORT needed given that port is mapped in docker-compose.yml?
# ARG PORT
# ENV PORT=${PORT:-3000}
ENV app /usr/share/myapp

RUN sudo mkdir -p $app
RUN sudo chown circleci $app
# TODO: investigate why needed?
RUN sudo chmod -R 0755 $app

# Is USER needed? Already declared in base image
# USER circleci
WORKDIR $app

# TODO: Investigate why needed
COPY --chown=circleci:circleci . .

RUN gem install bundler:1.17.3

RUN bundle install
# EXPOSE ${PORT}
```

## TODO

* explain that base image has `CMD ["/bin/bash"]`, i.e. it doesn't do anything on its own, all containers created from this image will be waiting at the shell prompt for us to enter commands.
* drawbacks: more typing, some complexity in having to learn additional tooling, everything runs slower in docker compared to native
* aside/assumptions: familiar with basics of docker including images, containers and docker-compose, ref to some learning materials
* `convert ruby-in-box-original.png -resize 900x -gravity center -crop 900x506+0+0 ruby-in-box.png`
