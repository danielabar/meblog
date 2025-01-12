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

1. There hadn't been any mention of this in the upgrade guide from 7.0 to 7.1.
2. This project uses environment variables (provided via Heroku Config) for secrets, so why would there be any secrets in the code at all?

It turns out, what used to be called "secrets", now referred to as "credentials" is a non-obvious aspect of Rails with a long history. Unless you've been the first developer to setup and deploy a Rails project, you may never have encountered this feature. This post will explain what secrets and credentials are, and how to resolve this deprecation warning.

TODO: For those in a hurry, jump to solution. Otherwise read on for investigation and some Rails history on this topic...

## Investigation

Here is the file that was referred to in the deprecation warning `config/environment.rb`:

```ruby
# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize! # === DEPRECATION WARNING HERE!
```

A search through the entire project for `Rails.application.secrets` didn't yield any matches. This must have been something in library code or deeper in Rails internals.

Up until this point, I had been following the specific guide for upgrading from 7.0 to 7.1. Aside from a section about the development and test [secret key base file having been renamed](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#development-and-test-environments-secret-key-base-file-changed), I couldn't find anything related to a migration from secrets to credentials. Furthermore, my project didn't have a `tmp/development_secret.txt`, so I wasn't sure if this section was applicable.

I then wondered if I had missed a step in the previous upgrade related to secrets and credentials, or if the previous maintainer had missed a step in earlier upgrades? I went back through all the upgrade guides back to the first version of this project, which was 4.1:

* [7.0 to 7.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-7-0-to-rails-7-1)
* [6.1 to 7.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-6-1-to-rails-7-0)
* [6.0 to 6.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-6-0-to-rails-6-1)
* [5.2 to 6.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-2-to-rails-6-0)
* [5.1 to 5.2](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-1-to-rails-5-2)
* [5.0 to 5.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-5-0-to-rails-5-1)
* [4.2 to 5.0](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-4-2-to-rails-5-0)
* [4.1 to 4.2](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#upgrading-from-rails-4-1-to-rails-4-2)

None of the above mentioned upgrade guides had instructions on migrating from secrets to credentials. In order to resolve the deprecation warning, I would first have to understand what is this "secrets" feature?

## What is Rails.application.secrets

A new file named `config/secrets.yml` was introduced back in Rails 4.1 (which was the initial version of Rails this project started on).

The [4.1 Release Notes](https://guides.rubyonrails.org/4_1_release_notes.html#config-secrets-yml) explain that it's primarily used to store the application's `secret_key_base`.

From the Rails API docs on [secret_key_base](https://api.rubyonrails.org/classes/Rails/Application.html#method-i-secret_key_base):

> The secret_key_base is used as the input secret to the application’s key generator, which in turn is used to create all ActiveSupport::MessageVerifier and ActiveSupport::MessageEncryptor instances, including the ones that sign and encrypt cookies.

The Rails upgrade guide from [4.0 to 4.1](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#config-secrets-yml) explains how to migrate from an older `secret_token.rb` initializer. So it must have been the case that running `rails new` on 4.1 would have generated a `config/secrets.yml` file.

Indeed, the project I was upgrading had this file from the initial commit over 10 years ago:

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

From reading the 4.1 release notes and upgrade guide, I learned that there used to be a facility for committing this particular value `secret_key_base`, into source control, at least for development and test. Then for production the recommendation was to use an environment variable.

The secret_key_base could then be accessed by Rails and application code as `Rails.application.secrets.secret_key_base`. Furthermore, it was possible to commit all of an application's secrets in this file, for example:

```yml
development:
  secret_key_base: d9d6241...
  stripe_api_key: devstripe...
  another_secret: ...
  ...

test:
  secret_key_base: 638095d...
  stripe_api_key: testtripe...
  another_secret: ...
  ...

# Do not keep production secrets in the repository,
# instead read values from the environment.
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
  stripe_api_key: <%= ENV["STRIPE_API_KEY"] %>
  another_secret: ...
  ...
```

**Potential security issue:** Although the comments in this file warn to use environment variables for production, there is nothing to enforce it. So if a team didn't have a way to easily manage environment variables, it's possible that some teams may have started committing their plain text secrets in this file. This may explain why this feature had to change.

The next section looks into how this has changed.

## History

I dug through the history of release notes from 4.1 to 7.2 to understand how this feature has changed over time, and what it was supposed to look like on a Rails 7.1 project:

**4.1 Plain Text Secrets**

This release introduced `config/secrets.yml`, which is a plain text yaml file. It supports erb interpolation so that secrets can optionally be read from an environment variable rather than hard-coded in the file. Rails accesses the secret key base from this file via `Rails.application.secrets.secret_key_base`.

[Reference 4.1 Release Notes](https://guides.rubyonrails.org/4_1_release_notes.html#config-secrets-yml)

**5.1 Encrypted Secrets**

This release was a first attempt at encrypting the secrets. A rake task was introduced which would generate a new file `config/secrets.yml.enc`, along with a *master key* that could be used to encrypt and decrypt the file. The master key however had to be maintained outside of the source. Rails could read it either from a git ignored file `config/secrets.yml.key` or from a new environment variable `RAILS_MASTER_KEY`.

The idea was you would move all the plain text secrets previously in `config/secrets.yml` to the new encrypted `config/secrets.yml.enc`. Note that there's no instructions on exactly how to do this - for example, can you copy the entire contents of the plain text `config/secrets.yml`, including nesting for each environment and erb interpolation, and dump that into the new encrypted file?

[Reference 5.1 Release Notes](https://guides.rubyonrails.org/5_1_release_notes.html#encrypted-secrets)

**5.2 Encrypted Credentials**

This release refined the encryption concept, renaming it "credentials" rather than "secrets". Another new file was introduced `config/credentials.yml.enc`, along with a `config/master.key` containing the key to encrypt and decrypt the credentials file.

If you had previously migrated from `config/secrets.yml` to `config/secrets.yml.enc`, you would now migrate again to `config/credentials.yml.enc`.

Once again, there are no instructions on how to take the previous environment-specific plain text or erb interpolated values from the old file to the new encrypted file. It also seems like there's a single `config/master.key` that would be used across all environments. For example, you might have multiple deployed environments like staging and production, and having a shared master key across both of them is not ideal.

At this time, the previous plain text secrets were still supported. The 5.1 release notes have an important message:

> This will eventually replace Rails.application.secrets and the encrypted secrets introduced in Rails 5.1

Here is where it would have been useful to start having deprecation warnings, but I never noticed any while maintaining this project, until upgrading to 7.1.

[Reference 5.2 Release Notes](https://guides.rubyonrails.org/5_2_release_notes.html#credentials)

[Reference 5.2 Securing Rails Application Guide](https://guides.rubyonrails.org/v5.2/security.html#custom-credentials)

**6.0**

This release maintained the previous encrypted credentials, but added support for multi-environment credentials. This is only mentioned as a bullet point in the release notes under "Notable changes". The associated PR has some lively discussion. But once again, there's no final instructions for how to convert from old plain text secrets to environment-specific encrypted credentials.

The securing rails application guide for 6.0 has the same explanation as the previous 5.2 guide for how to use encrypted credentials, but it doesn't mention the new environment-specific options introduced in the PR.

[Reference 6.0 Release Notes](https://guides.rubyonrails.org/6_0_release_notes.html)

[Reference 6.0 Pull Request for Multi Environment Credentials](https://github.com/rails/rails/pull/33521)

[Reference 6.0 Securing Rails Application Guide](https://guides.rubyonrails.org/v6.0/security.html#environmental-security)

**7.1**

deprecation notice re: secrets -> credentials

7.2

Rails.application.secrets is no more, any app referencing this will error:
```ruby
Rails.application.secrets
# undefined method `secrets' for an instance of SomeApp::Application (NoMethodError)
```

TOOD: Include as we encounter them, definitions of credentials, and master key.

Now that we understand all the terminology from secrets and secret key base, to credentials and master key, we're finally ready to resolve the deprecation.

## Solutions

TODO: Explain there's multiple ways to solve this...

### Solution 1 - Env Var All The Things

Use this solution if:

1. The only secret you have in `config/secrets.yml` is the `secret_key_base`.
2. You have access to a secrets manager which automatically converts secrets to environment variables in deployed environments (eg: AWS Parameter Store, Hashicorp Vault, Heroku Config, etc.)

TODO: Benefits - Consistency: There's only one way to manage all secrets, across all environments. Avoids future confusion as developers come and go. If there's more than one way to do things, then as developers come and go, people will discover all of them and some will be done one way, and some the other. Eventually no one will remember or understand why there's multiple ways to accomplish the same task. Creates maintenance overhead as each time this task is needed (eg: integrating a new 3rd party service), developer needs to spend time thinking about which way the new secrets should be managed.

### Solution 2 - Convert Secrets to Credentials Per Environment

Use this if you don't have a secrets manager (although will still need to manage rails master key!) AND you have all/multiple secrets you've been managing in `config/secrets.yml`, and have numerous references in your code to `Rails.application.secrets.stripe_api_key`, etc.

TODO: include step for modifying all `Rails.application.secrets.foo` to `Rails.application.credentials[:foo]`. (get exact syntax!)

## TODO
* WIP main content
* But none of the upgrade guides from 4.1 to modern day versions mention how to move to credentials
* WIP Confusing history for those starting from much older Rails versions:
  * 4.0 secret_token.rb config initializer
  * 4.1 config/secrets.yml (plain text, with erb interpolated env var for production)
  * 5.1 encrypted secrets via config/secrets.yml.enc and sekrets gem https://github.com/rails/rails/pull/28038 and introduction of master key
  * 5.2 encrypted credentials (but no more erb interpolated env var!)
  * 6.0 multi-env creds
  * 6.1 ?
  * 7.1 deprecation notice re: secrets -> credentials
  * 7.2 Rails.application.secrets is no more, any app referencing this will error:
  ```ruby
  Rails.application.secrets
  # undefined method `secrets' for an instance of SomeApp::Application (NoMethodError)
  ```
* Solution 1 if the only secret is secret_key_base and you have a readily available secrets manager - move secret_key_base to env var in all environments for consistency (it should already be for production as that's what the initial rails 4.1 new would have generated, then put it in .env.development and .env.test using dotenv-rails gem)
  * Variation: for local dev move it to `tmp/local_secret.txt`, plain text, gitignored, this is how a new Rails project would behave by default. BUT I think it's non-obvious having a different way to access the same value, that's why I prefer env var for all secrets across all environments.
* Solution 2: if you have other secrets besides secret key base, and have references in code to Rails.application.secrets[:something], and don't have secrets manager, or not available to everyone on the team, then convert secrets to credentials as follows - note we will make it environment specific so that a compromise of one environment doesn't compromise all of them...
* From intro - jump to solution link, otherwise, history lesson follows
* conclusion para
* reschedule publish date to mid month for https://github.com/danielabar/meblog/pull/185
* edit
