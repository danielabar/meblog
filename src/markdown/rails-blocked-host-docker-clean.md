---
title: "Rails Blocked Host Solved by Docker Cleanup"
featuredImage: "../images/docker-clean-lucas-van-oort-iqhvzgouEiA-unsplash.jpg"
description: "A mysterious Rails issue solved by cleaning all the Docker things."
date: "2021-04-18"
category: "rails"
---

Intro TBD...

I'm running a Rails 5 monolith, dockerized, using docker-compose. This monolith needs to make use of a new subscription service that is developed as a separate project with Rails 6. The subscription service also runs dockerized with docker-compose. Why run them with Docker locally? [I've written about the benefits of this approach and how to do it here](/blog/dockerize-rails-app-for-dev-debug-and-testing).

Communication between the services is via an HTTP api. Specifically, the monolith needs to make GET/POST/PATCH requests to the subscription service to access services such as creating a new subscription, getting a list of active subscriptions for a user, cancelling a subscription, etc.

The monolith runs the Rails server on port 3000 and the subscription service runs on port 4000. If the services were running natively on the laptop, the monolith could address the service via `localhost`, for example, `GET http://localhost:4000/api/subscriptions`. But this won't work when the monolith is running in a Docker container because it will look for a service running on port 4000 *within the container*, which does not exist.

One solution to this is to build an image of the subscription service, push it to a Docker registry (self hosted, Docker Hub, Github container registry etc.) then add another service in the `docker-compose.yml` of the monolith that uses this image. For example:

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