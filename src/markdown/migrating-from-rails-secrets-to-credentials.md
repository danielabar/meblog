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

I've been maintaining a 10+ year old legacy Rails application, upgrading it from Rails 6.1 to 7.0, and then 7.0 to 7.1. We'll eventually get to Rails 7.2, and then 8, but as per the Rails guide on [upgrading](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#the-upgrade-process):

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
2. This project uses environment variables (provided via Heroku Config) for secrets, so why would there be any secrets in the code?

It turns out, what used to be called "secrets", now referred to as "credentials" is a non-obvious aspect of Rails with a long history. Unless you've been the first developer to setup and deploy a Rails project, you may never have encountered this feature. This post will explain what secrets and credentials are, and cover a few options for resolving this deprecation warning.

TODO: For those in a hurry, jump to solution. Otherwise read on for investigation and some Rails history on this topic...

## Investigation

Here is the file that was referred to in the deprecation warning `config/environment.rb`:

```ruby
# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize! # === DEPRECATION WARNING FROM THIS LINE ===
```

A search through the entire project for `Rails.application.secrets` didn't yield any matches. This must have been something in library code or deeper in Rails internals.

Up until this point, I had been following the specific guide for upgrading from 7.0 to 7.1. Aside from a section about the development and test [secret key base file having been renamed](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html#development-and-test-environments-secret-key-base-file-changed), I couldn't find anything related to a migration from secrets to credentials.

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

This means `secret_key_base` needs to be:

1. **A closely guarded secret:** It's critical for the security of the application because it's used to generate encryption and signing keys for sensitive operations, including cookies and other secure data.
2. **Consistent across Rails upgrades and deployments:** Changing the `secret_key_base` would invalidate all existing cookies and encrypted data (e.g., session cookies), effectively signing out all users and potentially causing issues with any other data encrypted or signed with it.

I then pulled up the `config/secrets.yml` on the project I was upgrading and found this:

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

staging:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>

# Do not keep production secrets in the repository,
# instead read values from the environment.
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
```

This file is used to persist environment-specific values of `secret_key_base`. It also supports erb interpolation, so you can commit either the plain text secret, or reference an environment variable via `ENV`. The `secret_key_base` can then be accessed by Rails and application code as `Rails.application.secrets.secret_key_base`.

But it's not just the `secret_key_base`, this file supports potentially persisting all of an application's secrets. For example:

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

staging:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
  stripe_api_key: <%= ENV["STRIPE_API_KEY"] %>
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

The other secrets could then be accessed in application code, for example: `Rails.application.secrets.stripe_api_key`.

**Potential security issues:**

Although the comments in this file warn to use environment variables for production, there is nothing to enforce it. So if a team didn't have a way to easily manage environment variables, it's possible that some teams may have started committing their plain text secrets in this file. This may explain why this feature had to change.

It also sets an example that the development and test secrets can be committed to source control as plain text. TODO: security like fence, only as strong as weakest link analogy...

## History

I dug through the history of release notes from 4.1 to 7.2 to understand how this feature has changed over time, and what it was supposed to look like on Rails 7.x:

**4.1 Plain Text Secrets**

This release introduced `config/secrets.yml`, which is a plain text yaml file. It supports erb interpolation so that secrets can optionally be read from an environment variable rather than hard-coded in the file. Rails accesses the secret key base from this file via `Rails.application.secrets.secret_key_base`.

[Release Notes](https://guides.rubyonrails.org/4_1_release_notes.html#config-secrets-yml)

**5.0**

No changes to the secrets feature.

[Release Notes](https://guides.rubyonrails.org/5_0_release_notes.html)

**5.1 Encrypted Secrets**

This release was a first attempt at encrypting the secrets. A rake task was introduced which would generate a new file `config/secrets.yml.enc`, along with a *master key* that could be used to encrypt and decrypt the file. The master key however had to be maintained outside of the source. Rails could read it either from a git ignored file `config/secrets.yml.key` or from a new environment variable `RAILS_MASTER_KEY`.

The idea was you would move all the plain text secrets previously in `config/secrets.yml` to the new encrypted `config/secrets.yml.enc`. Note that there's no instructions on exactly how to do this - for example, can you copy the entire contents of the plain text `config/secrets.yml`, including nesting for each environment and erb interpolation, and dump that into the new encrypted file?

[Release Notes](https://guides.rubyonrails.org/5_1_release_notes.html#encrypted-secrets)

**5.2 Encrypted Credentials**

This release refined the encryption concept, renaming it "credentials" rather than "secrets". Another new file was introduced `config/credentials.yml.enc`, along with a `config/master.key` containing the key to encrypt and decrypt the credentials file.

If you had previously migrated from `config/secrets.yml` to `config/secrets.yml.enc`, you would now migrate again to `config/credentials.yml.enc`.

Once again, there are no instructions on how to take the previous environment-specific plain text or erb interpolated values from the old file to the new encrypted file. It also seems like there's a single `config/master.key` that would be used across all environments. For example, you might have multiple deployed environments like staging and production, and having a shared master key across both of them is not ideal.

At this time, the previous plain text secrets were still supported. The 5.1 release notes have an important message:

> This will eventually replace Rails.application.secrets and the encrypted secrets introduced in Rails 5.1

Here is where it would have been useful to start having deprecation warnings, but I never noticed any while maintaining this project, until upgrading to 7.1.

[Release Notes](https://guides.rubyonrails.org/5_2_release_notes.html#credentials)

TODO: why is this here? link it in explanation if relevant
[Securing Rails Application Guide](https://guides.rubyonrails.org/v5.2/security.html#custom-credentials)

**6.0**

This release maintained the previous encrypted credentials, but added support for multi-environment credentials. This is only mentioned as a bullet point in the release notes under "Notable changes". The associated [PR]((https://github.com/rails/rails/pull/33521)) has some lively discussion. But once again, there's no final instructions for how to convert from old plain text secrets to environment-specific encrypted credentials.

The [securing rails application guide for 6.0](https://guides.rubyonrails.org/v6.0/security.html#environmental-security) has the same explanation as the previous 5.2 guide for how to use encrypted credentials, but it doesn't mention the new environment-specific options introduced in the PR.

[Release Notes](https://guides.rubyonrails.org/6_0_release_notes.html)

**7.0**

This release maintained the previous encrypted credentials with no notable changes.

[Release Notes](https://guides.rubyonrails.org/7_0_release_notes.html)

**7.1 Secrets Deprecation**

This release maintains the previous encrypted credentials and adds a [deprecation notice](https://guides.rubyonrails.org/7_1_release_notes.html#railties-deprecations) for favouring credentials over secrets.

This explains why I only started seeing the deprecation message on the 7.0 to 7.1 upgrade.

[Release Notes](https://guides.rubyonrails.org/7_1_release_notes.html)

**7.2 Secrets Dropped**

This release drops support for `Rails.application.secrets`. Trying to reference it will result in an error:

```ruby
Rails.application.secrets
# undefined method `secrets' for an instance of SomeApp::Application (NoMethodError)
```

[Release Notes](https://guides.rubyonrails.org/7_2_release_notes.html)

Now that we've covered the history from secrets and secret key base, to credentials and master key, we're finally ready to resolve the deprecation.

## Solutions

There's a few different ways to solve this. Read below to choose what's most appropriate for your project.

### Convert Secrets to Credentials Per Environment

TODO explain...

Use this if you don't have a secrets manager (although will still need to manage rails master key!) AND you have all/multiple secrets you've been managing in `config/secrets.yml`, and have numerous references in your code to `Rails.application.secrets.stripe_api_key`, etc.

TODO: include step for modifying all `Rails.application.secrets.foo` to `Rails.application.credentials[:foo]`. (get exact syntax!)

### Remove Secrets/Credentials and use Environment Variables

On our team, we found the easiest way to resolve this was to remove the secrets file, and not introduce the replacement credentials file, in favour of an environment variable `SECRET_KEY_BASE`.

Consider this solution if:

* The only secret in `config/secrets.yml` is the `secret_key_base`.
* The project is using a secrets manager which automatically converts secrets to environment variables in deployed environments (eg: AWS Parameter Store, Hashicorp Vault, Heroku Config, etc.)

**Steps:**

1. Make sure `SECRET_KEY_BASE` is defined in the secrets manager in every deployed environment (eg: staging, production).
2. Make a backup of the original `config/secrets.yml` outside of source control in case you need to refer to it if something goes wrong.
3. In development and test environments, do nothing, Rails will automatically generate a git ignored file `tmp/local_secret.txt` containing a randomly generated value of `secret_key_base`, if it can't find a `SECRET_KEY_BASE` environment variable and there is no encrypted credentials yaml.
4. Optionally, if you want development and test environments to be consistent with deployed environments, the `SECRET_KEY_BASE` environment variable can be added to `.env.development` and `.env.test`, with the value being whatever it was in the old `config/secrets.yml`, development and test sections. Then Rails will read from the environment variable rather than generating a `tmp/local_secret.txt`.
5. Delete `config/secrets.yml` from source control.

**Why this works:**

Rails actually searches for the `secret_key_base` value in `ENV["SECRET_KEY_BASE"]`. If this environment variable is not found, then Rails will search for it in the new encrypted credentials yaml file. If your old `config/secrets.yml` already contained `<%= ENV["SECRET_KEY_BASE"] %>`, then effectively it was already reading an environment variable, and the yaml file was just serving as a pass-through.

TODO: Benefits - Consistency: There's only one way to manage all secrets, across all environments. Avoids future confusion as developers come and go. If there's more than one way to do things, then as developers come and go, people will discover all of them and some will be done one way, and some the other. Eventually no one will remember or understand why there's multiple ways to accomplish the same task. Creates maintenance overhead as each time this task is needed (eg: integrating a new 3rd party service), developer needs to spend time thinking about which way the new secrets should be managed.

## TODO
* WIP main content
* analogy of security <-> fence wrt committing dev/test secrets
* 5.2 History - show example of how it was meant to be used on a new project?
* 6.0 History - show example of env-specific how it was meant to be used on a new project?
* For easier solution, reference dotenv-rails gem for last optional step
* Solution: if you have other secrets besides secret key base, and have references in code to Rails.application.secrets[:something], and don't have secrets manager, or not available to everyone on the team, then convert secrets to credentials as follows - note we will make it environment specific so that a compromise of one environment doesn't compromise all of them...
* Possibly aside about if plain text prod secret was committed, consider rotating (find reference how to do this?)
* From intro - jump to solution link, otherwise, history lesson follows
* conclusion para
* reschedule publish date to mid month for https://github.com/danielabar/meblog/pull/185
* edit
