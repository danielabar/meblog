---
title: "Migrating From Rails Secrets to Credentials"
featuredImage: "../images/migrating-rails-secrets-to-credentials-silas-kohler-C1P4wHhQbjM-unsplash.jpg"
description: "tbd"
date: "2025-03-01"
category: "rails"
related:
  - "Dependabot PRs Need Their Secrets"
  - "Add Rubocop to an Existing Rails Project"
  - "Avoid this Bug with Numeric Environment Variables in Ruby"
---

I've been working on a legacy Rails application, upgrading it from Rails 6.1 to 7.0, and then 7.0 to 7.1. We'll eventually get to Rails 7.2, and then 8, but as per the Rails guide on [upgrading](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#the-upgrade-process):

> It's best to move slowly, one minor version at a time, in order to make good use of the deprecation warnings.

After a successful release of the 6.1 to 7.0 upgrade, I was working on the 7.1 upgrade, and found myself facing this deprecation warning:

```
DEPRECATION WARNING:
`Rails.application.secrets` is deprecated in favor of `Rails.application.credentials`
and will be removed in Rails 7.2.
(called from <main> at my-app/config/environment.rb:5)
```

This was surprising to me because:

1. There hadn't been any mention of this in the upgrade guide
2. This project uses environment variables (provided via Heroku Config) for secrets management, so why would there be any secrets in the code at all?

It turns out, this is a non-obvious aspect of Rails with a long history. Unless you've been the first developer to setup and deploy a Rails project, you may never have encountered this feature. This post will explain what secrets and credentials are, and how to resolve this deprecation warning.

TODO: For those in a hurry, jump to solution. Otherwise read on for investigation and some Rails history on this topic...

## Investigation

Taking a look at the deprecation warning again:

```
DEPRECATION WARNING:
`Rails.application.secrets` is deprecated in favor of `Rails.application.credentials`
and will be removed in Rails 7.2.
(called from <main> at my-app/config/environment.rb:5)
```

There was nothing obvious causing this in the file mentioned `config/environment.rb`:

```ruby
# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize!
```

A search through the entire project for `Rails.application.secrets` didn't yield any matches. This must have been something in library code or deeper in Rails internals.

Up until this point, I had been following the specific guide for upgrading from 7.0 to 7.1. Aside from a section about the development and test [secret key base file having been renamed](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#development-and-test-environments-secret-key-base-file-changed), I couldn't find anything related to a migration from secrets to credentials.

Furthermore, my project didn't have a `tmp/development_secret.txt`, so I wasn't sure if this section was applicable.

I then wondered if I had missed a step in the previous upgrade related to secrets and credentials, or if the previous maintainer had missed a step in earlier upgrades? I went back through all the upgrade guides back to the first version of this project, which was 4.1:

* [7.0 to 7.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-7-0-to-rails-7-1)
* [6.1 to 7.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-6-1-to-rails-7-0)
* [6.0 to 6.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-6-0-to-rails-6-1)
* [5.2 to 6.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-2-to-rails-6-0)
* [5.1 to 5.2](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-1-to-rails-5-2)
* [5.0 to 5.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-0-to-rails-5-1)
* [4.2 to 5.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-4-2-to-rails-5-0)
* [4.1 to 4.2](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-4-1-to-rails-4-2)

But none of these guides had instructions on migrating from secrets to credentials. In order to resolve the deprecation warning, I would first have to understand what is this "secrets" feature?

## What is Rails.application.secrets

It turns out, a new file named `config/secrets.yml` was introduced back in Rails 4.1 (which was the initial version of Rails this project started on).

The [4.1 Release Notes](https://guides.rubyonrails.org/4_1_release_notes.html#config-secrets-yml) explain that it's primarily used to store the application's `secret_key_base`.

TODO: Define secret key base

The Rails upgrade guide from [4.0 to 4.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#config-secrets-yml) explains how to migrate from an older `secret_token.rb` initializer. So it must have been the case that running `rails new` on 4.1 would have generated a `config/secrets.yml` file. And indeed, the project I was upgrading had this file from the verify first initial commit:

```yml
# Be sure to restart your server when you modify this file.

# Your secret key is used for verifying the integrity of signed cookies.
# If you change this key, all old signed cookies will become invalid!

# Make sure the secret is at least 30 characters and all random,
# no regular words or you'll be exposed to dictionary attacks.
# You can use `rake secret` to generate a secure secret key.

# Make sure the secrets in this file are kept private
# if you're sharing your code publicly.

development:
  secret_key_base: d9d6241...

test:
  secret_key_base: 638095d...

# Do not keep production secrets in the repository,
# instead read values from the environment.
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
```

TODO: Lead into history lesson

## History

TODO: Expand on this throughout versions from 4.0 to present day.

TOOD: Include as we encounter them, definitions of credentials, and master key.

Now that we understand all the terminology from secrets and secret key base, to credentials and master key, we're finally ready to resolve the deprecation.

## Solutions

TODO: Explain there's multiple ways to solve this...

### Solution 1 - Env Var All The Things

### Solution 2 - Convert Secrets to Credentials

## TODO
* WIP main content
* From intro - jump to solution link, otherwise, history lesson follows
* A first attempt at encrypted secrets was introduced in 5.1: https://guides.rubyonrails.org/5_1_release_notes.html#encrypted-secrets
* Then Rails credentials was initially introduced in 5.2: https://guides.rubyonrails.org/5_2_release_notes.html#credentials:
  > This will eventually replace Rails.application.secrets and the encrypted secrets introduced in Rails 5.1
* But none of the upgrade guides from 4.1 to modern day versions mention how to move to credentials
* Confusing history for those starting from much older Rails versions:
  * 4.0 secret_token.rb config initializer
  * 4.1 config/secrets.yml (plain text, with erb interpolated env var for production)
  * 5.1 encrypted secrets via config/secrets.yml.enc and sekrets gem https://github.com/rails/rails/pull/28038 and introduction of master key
  * 5.2 encrypted credentials (but no more erb interpolated env var!)
  * 7.1 deprecation notice re: secrets -> credentials
  * 7.2 Rails.application.secrets is no more, any app referencing this will error:
  ```ruby
  Rails.application.secrets
  # undefined method `secrets' for an instance of SomeApp::Application (NoMethodError)
  ```
* Solution 1 if the only secret is secret_key_base and you have a readily available secrets manager - move secret_key_base to env var in all environments for consistency (it should already be for production as that's what the initial rails 4.1 new would have generated, then put it in .env.development and .env.test using dotenv-rails gem)
  * Variation: for local dev move it to `tmp/local_secret.txt`, plain text, gitignored, this is how a new Rails project would behave by default. BUT I think it's non-obvious having a different way to access the same value, that's why I prefer env var for all secrets across all environments.
* Solution 2: if you have other secrets besides secret key base, and have references in code to Rails.application.secrets[:something], and don't have secrets manager, or not available to everyone on the team, then convert secrets to credentials as follows - note we will make it environment specific so that a compromise of one environment doesn't compromise all of them...
* conclusion para
* reschedule publish date to mid month for https://github.com/danielabar/meblog/pull/185
* edit
