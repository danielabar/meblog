---
title: "Fix Rails Blocked Host Error with Docker"
featuredImage: "../images/blocked-host-fix-markus-spiske-KTuHfak_EEk-unsplash.jpg"
description: "Learn how to fix the Rails Blocked Host error when using Docker."
date: "2021-09-10"
category: "rails"
related:
  - "Dockerize a Rails Application for Development"
  - "Roll Your Own Search with Rails and Postgres: Search API"
  - "Use UUID for primary key with Rails and Postgres"
---

This post will demonstrate how to solve the Rails Blocked Host error when running a Rails app in a Docker container.

But first, what is the blocked host error? The symptom is the following error message is returned when making any request to the server. For example: `https://myapp.com` would return a 500 error with details:

```html
<h1>Blocked host: myapp.com</h1>
<h2>To allow requests to myapp.com, add the following to your environment configuration:</h2>
<pre>config.hosts << "myapp.com"</pre>
```

This happens because as of v6, Rails has introduced a new `ActionDispatch::HostAuthorization` middleware to prevent [DNS rebinding attacks](https://danielmiessler.com/blog/dns-rebinding-explained/). This middleware is controlled by a new `hosts` configuration to specify what hosts the server will respond to. Here is the default configuration for development, i.e. when `RAILS_ENV=development`:

```ruby
# config/environments/development.rb
Rails.application.configure do
  config.hosts = [
    IPAddr.new("0.0.0.0/0"), # All IPv4 addresses.
    IPAddr.new("::/0"),      # All IPv6 addresses.
    "localhost"              # The localhost reserved domain.
  ]
  # other config settings...
end
```

This means that when running a Rails server (assume default port 3000) in development mode on your laptop, you could address it as `http://localhost:3000` or `http://127.0.0.1:3000` or even by your internal IP address such as `http://193.168.1.2:3000`.

In production, if your app should be available at `https://myapp.com`, then the hosts could be configured as:

```ruby
# config/environments/production.rb
Rails.application.configure do
  config.hosts = [
    "myapp.com"
  ]
  # other config settings...
end
```

In this case, the Rails server would respond to any requests from `https://myapp.com`, but not from an IP address such as `https://145.83.11.7`.

## Docker and Docker Compose

But what happens if you're running microservices, with several Rails apps each running in their own container, that need to make requests to each other?

Here's the setup: Suppose there is an app called `mainapp`, and it uses a microservice that provides subscription management services called `subscription_service`. The `mainapp` developers don't want to have to checkout and install the code for `subscription_service` so docker compose is used to ensure all services can be started from the main app.

Here's a simplified docker-compose file showing only the main app and subscription services. `mainapp` has all the `app` code available to it via a host mount because this is the main app under development. `subscription_service` uses a private image from the [Github Container Registry](https://github.blog/2020-09-01-introducing-github-container-registry/) because that is an already built microservice that `mainapp` depends on.

```yml
# docker-compose.yml (mainapp)
version: "3.3"
services:
  mainapp:
    build:
      context: .
    command: bash -c "bundle exec rails s -b '0.0.0.0'"
    volumes:
      - .:/app
    ports:
      - "3000:3000"

  subscription_service:
    image: ghcr.io/my_org/subscription_service/subscription-app:latest
    command: bash -c "bundle exec rails s -b '0.0.0.0' -p 4000"
    ports:
      - "4000:4000"
```

Since both `mainapp` and `subscription_service` are started in the same docker network created when `docker-compose up` is run, it should be possible for the main app to make http requests to the subscription service. For example, the subscription service exposes a REST style API to retrieve all plans, with `GET {{host}}/api/v1/plans`. Therefore, the following code in `mainapp`, using Faraday to make an http request *should* work:

```ruby
# Any ruby file in mainapp
url = 'http://subscription_service:4000/api/v1/plans'
response = Faraday.get(url, nil, {'Accept' => 'application/json'})
# expect response.status to be 200 and response.body to contain list of plans
```

But rather than the expected 200 response and a list of plans, a 500 error is returned with the following details:

```html
<h1>Blocked host: subscription_service</h1>
<h2>To allow requests to subscription_service, add the following to your environment configuration:</h2>
<pre>config.hosts << "subscription_service"</pre>
```

The problem is `subscription_service` is a Rails 6 app, with the default `config.hosts` specified in `config/environments/development.rb`. This means it only responds to requests at `http://localhost:4000` or an IP address. But `mainapp` is attempting to call `http://subscription_service:4000` which has not been allowed.

## Solution

The solution is to modify the development configuration in the subscription microservice to allow a host of `subscription_service`. This is the service name that is specified in the main app's `docker-compose.yml` file. The modified config looks like this:

```ruby
# config/environments/development.rb in Subscription service project
Rails.application.configure do
  config.hosts = [
    IPAddr.new("0.0.0.0/0"), # All IPv4 addresses.
    IPAddr.new("::/0"),      # All IPv6 addresses.
    "localhost",             # The localhost reserved domain.
    "subscription_service"   # Allow this to be addressed when running in containers via docker-compose.yml.
  ]
  # other config settings...
end
```

One problem with this solution is it requires that every project that wants to use the subscription microservice to name it `subscription_service` in their `docker-compose.yml`. An alternate way to solve this problem while providing more flexibility would be to use an environment variable as follows:

```ruby
# config/environments/development.rb in Subscription service project
Rails.application.configure do
  config.hosts = [
    IPAddr.new("0.0.0.0/0"), # All IPv4 addresses.
    IPAddr.new("::/0"),      # All IPv6 addresses.
    "localhost",             # The localhost reserved domain.
    ENV["SERVER_HOST_NAME"]  # Allow this to be addressed when running in containers via docker-compose.yml.
  ]
  # other config settings...
end
```

Now suppose a project that wishes to use the subscription microservice would like to refer to it as `subs`, for example `GET http://subs:4000/api/v1/plans`. Then they could do so by specifying `subs` as the value for `SERVER_HOST_NAME` in the `environment` section of the subscription service in the docker compose file as follows:

```yml
# docker-compose.yml (mainapp)
version: "3.3"
services:
  mainapp:
    build:
      context: .
    command: bash -c "bundle exec rails s -b '0.0.0.0'"
    volumes:
      - .:/app
    ports:
      - "3000:3000"

  subs:
    image: ghcr.io/my_org/subscription_service/subscription-app:latest
    command: bash -c "bundle exec rails s -b '0.0.0.0' -p 4000"
    ports:
      - "4000:4000"
    environment:
      SERVER_HOST_NAME: subs
```

## Conclusion

This post has covered what the Rails Blocked Host error is and several different ways to solve it for development and production. See the Rails docs on [configuring middleware](https://guides.rubyonrails.org/configuring.html#configuring-middleware) to learn more about `ActionDispatch::HostAuthorization` middleware.
