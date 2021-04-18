---
title: "Rails Blocked Host Solved by Docker Cleanup"
featuredImage: "../images/docker-clean-lucas-van-oort-iqhvzgouEiA-unsplash.jpg"
description: "A mysterious Rails issue solved by cleaning all the Docker things."
date: "2021-04-18"
category: "rails"
---

Today I want to share a debugging story about trying to make different versioned Rails containers talk to each other via docker compose networking, and a blocked host error that ended up being resolved by a Docker cleanup.

## Setup

I'm running a Rails 5 monolith, dockerized, using docker-compose. This monolith needs to make use of a new subscription service that is developed as a separate project with Rails 6. The subscription service also runs dockerized with docker-compose. Why run them with Docker locally? [I've written about the benefits of this approach and how to do it here](/blog/dockerize-rails-app-for-dev-debug-and-testing).

Communication between the services is via an HTTP api. Specifically, the monolith needs to make GET/POST/PATCH requests to the subscription service to access services such as creating a new subscription, getting a list of active subscriptions for a user, cancelling a subscription, etc.

The monolith runs the Rails server on port 3000 and the subscription service runs on port 4000. If the services were running natively on the laptop, the monolith could address the service via `localhost`, for example, `GET http://localhost:4000/api/subscriptions`. But this won't work when the monolith is running in a Docker container because it will look for a service running on port 4000 *within the container*, which does not exist.

One solution is to build an image of the subscription service, push it to a Docker registry (self hosted, Docker Hub, Github container registry etc.) then add another service in the `docker-compose.yml` of the monolith that uses this image. For example:

```yml
# docker-compose.yml in the monolith project
version: "3.3"
services:
  web:
    build:
      context: .
    ...
  mysubapp:
    image: https://path/to/registry/your-organization/project-name:image-tag
    ports:
      - "4000:4000"
  ...
```

Then the monolith could make requests to the subscription service using the service label given in the `docker-compose.yml` file, for example: `GET http://mysubapp:4000/api/subscriptions`.

However, in my case, both applications (the monolith and subscription service) are in active development, so I needed the flexibility to make changes to both and have the changes be reflected immediately. Having to build an image each time and push to a registry (or even host it locally) would have created too much friction.

## Docker Compose Networking

Another solution is to use docker compose networking. Recall I mentioned that both projects have their own docker compose file and are run via `docker-compose up`. The subscription service `docker-compose.yml` file has:

```yml
version: "3.3"
services:
  api:
    buiild:
      context: .
    ports:
      - 4000:4000
  # remainder of services...
```

Running `docker-compose up` creates a default network named `your-project_default`. To view all the docker networks run, `docker network ls`. For example, when I'm running both the monolith (`app`) and the subscription service (`subapp`), my networks are:

```
$ docker network ls
NETWORK ID     NAME                DRIVER    SCOPE
4c70ec63569c   bridge              bridge    local
506eb008c078   host                host      local
9e95129ab709   app_default         bridge    local
0029021041d2   none                null      local
6bf8ff8bc594   subapp_default      bridge    local
```

Since I want the `web` service in the monolith to address the `api` service in the subscription project, this can be accomplished by having the app [join](https://docs.docker.com/compose/networking/#use-a-pre-existing-network) the subscription services' network using the `external` option:

```yaml
# docker-compose.yml in monolith
version: "3.3"
services:
  # all the services...

# Join the subcription service network
networks:
  default:
    external:
      name: subapp_default
```

And now the monolith app can make an http request such as `GET http://subapp_api_1:4000/api/subscriptions`. Where `subapp` is the project name of the subscription service and `api` is the service name defined in its `docker-compose.yml` file. To confirm that these services can communicate with each other, run `docker network inspect subapp_default` and it will list all the services that are participating in this network.

## Blocked Host Error

At least in theory this should work. In practice, when the monolith made an http request to `GET http://subapp_api_1:4000/api/subscriptions`, received a Rails html error page with the following error message:

```html
<h1>Blocked host: subapp_api_1</h1>
<h2>To allow requests to subapp_api_1, add the following to your environment configuration:</h2>
<pre>config.hosts << "subapp_api_1"</pre>
```

This error comes from new [ActionDispatch::HostAuthorization](https://api.rubyonrails.org/classes/ActionDispatch/HostAuthorization.html) middleware that guards against DNS rebinding attacks by explicitly permitting the hosts a request can be sent to. What was puzzling about receiving this error is that this middleware is newly added to Rails 6, but it was being sent by the Rails 5 container running the monolith code.

## Debugging Attempts

On the off chance this middleware had gotten back ported to Rails 5, I tried adding the line `config.hosts << "subapp_api_1"` entry to `config/environments/development.rb` exactly as recommended by the error message. But then the Rails 5 server failed on startup running this initialization with an error that the `config` object has no such method `hosts`. This makes sense as this feature is only present as of Rails 6, but then *why* was I receiving this message from Rails 5???

It was also possible that I misunderstood the message and that the host configuration should be added on the Rails 6 container (the one running the subscription service) to make sure it could communicate back to the Rails 5. Even though the subscription service didn't need to make any http requests to the monolith, sometimes when you're debugging, just need to try a bunch of things, if nothing else, to rule them out. So added `config.hosts << "app_web_1"` to `config/environments/development.rb` on the Rails 6 project, restarted it, but this had no effect, was still getting the same error.

Also ran `bundle exec rake middleware` which lists all the middleware in sequence, to investigate whether the monolith project had a library or custom middleware that was implementing host blocking, but couldn't find any.

Another possibility could have been that the networking wasn't working and the containers couldn't really "see" each other. To verify this, I ran ran a shell in the container running the Rails monolith: `docker exec -it app_web_1 bash`. Then checked if it could "see" the subscription service with `ping subapp_api_1`, and indeed it could communicate.

Ok well if they can communicate at a network level, what about running `curl` in the shell (still in the Rails 5 container)? Tried `curl http://subapp_api_1:4000/api/subscription` (along with necessary auth headers), and *amazingly*, this also returned the Rails 6 html error page `<h1>Blocked host: subapp_api_1</h1>`!

At the same time, I was monitoring the log files for the container running the subscription service and there was no activity there, confirming that the http requests were never getting past the Rails 5 container.

## Solution: Docker Cleanup

After nearly a day of investigation, my manager suggested wiping out all the Docker things to get a fresh start. Was it possible that somehow the Rails 5 and 6 image layers had gotten mixed up? Seems strange but at this point had exhausted all the other possibilities so why not try this.

When using Docker and docker-compose, there will be a variety of docker images, containers, networks and volumes. Although it is possible to list each type and remove them one at a time, it's faster to wipe them all out in one go. To start, make sure there are no running containers by running `docker ps`. If any are listed, stop them with `docker stop {container ID or name}` OR go to the project directory where docker-compose was started and stop it. Then run:

```
$ docker system prune -a
```

This will remove all images, containers, and networks. It will not remove volumes however. This is a kind of safety as there might be valuable data that should be backed up. In my case, all volumes contain only development data which can be easily recreated by running `bundle exec rake db:seed`. To have system prune also remove volumes run:

```
$ docker system prune -a --volumes
```

After this I re-ran `docker-compose up` in both projects which built/downloaded all images from scratch, ran the scripts to re-seed data in both projects, then tried the code to `GET http://subapp_api_1:4000/api/subscriptions` from the monolith and it worked!

I'm curious if you've had mysterious issues resolved by a Docker cleanup? Tweet me your stories if you have.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.