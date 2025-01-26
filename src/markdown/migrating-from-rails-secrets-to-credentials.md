---
title: "Migrating From Rails Secrets to Credentials"
featuredImage: "../images/migrating-rails-secrets-to-credentials-silas-kohler-C1P4wHhQbjM-unsplash.jpg"
description: "Exploring the evolution of Rails secrets to credentials, this post investigates the deprecation of Rails.application.secrets, explains its history, and provides step-by-step solutions to address the change in legacy Rails applications."
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

This was surprising because:

1. There hadn't been any mention of this in the upgrade guide from 7.0 to 7.1.
2. This project uses environment variables (provided via Heroku Config) for secrets, so why would there be any secrets in the code?

It turns out, what used to be called "secrets", now referred to as "credentials" is a non-obvious aspect of Rails with a long history. Unless you've been the first developer to setup and deploy a Rails project, you may never have encountered this feature. This post will explain what secrets and credentials are, and cover a few options for resolving this deprecation warning.

In a hurry? Jump straight to the [solutions](../migrating-from-rails-secrets-to-credentials#solution-a-replace-secrets-with-environment-variable). Otherwise read on to learn the Rails history on this topic.

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

**Quick Tip**

By default, in development mode, deprecation warnings are logged to `log/development.log`, which can be easy to miss. To raise their visibility, update your `config/environments/development.rb` file:

```ruby
# Print deprecation notices to the Rails logger (default behavior).
# config.active_support.deprecation = :log

# Print deprecation notices to stderr for better visibility in the console.
config.active_support.deprecation = :stderr

# Optional: Temporarily raise an error for deprecations during debugging.
# config.active_support.deprecation = :raise
```

## What is Rails.application.secrets

A new file named `config/secrets.yml` was introduced back in Rails 4.1 (which was the initial version of Rails this project started on).

The [4.1 Release Notes](https://guides.rubyonrails.org/4_1_release_notes.html#config-secrets-yml) explain that it's primarily used to store the application's `secret_key_base`.

From the Rails API docs on [secret_key_base](https://api.rubyonrails.org/classes/Rails/Application.html#method-i-secret_key_base):

> The secret_key_base is used as the input secret to the application’s key generator, which in turn is used to create all ActiveSupport::MessageVerifier and ActiveSupport::MessageEncryptor instances, including the ones that sign and encrypt cookies.

This means `secret_key_base` needs to be:

1. **A closely guarded secret:** It's critical for the security of the application because it's used to generate encryption and signing keys for sensitive operations, including cookies and other secure data.
2. **Consistent across Rails upgrades and deployments:** Changing the `secret_key_base` would invalidate all existing cookies and encrypted data (e.g., session cookies), effectively signing out all users and potentially causing issues with any other data encrypted or signed with it.

I then opened the `config/secrets.yml` on the project I was upgrading and found this:

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

This file is used to persist environment-specific values of `secret_key_base`. It also supports erb interpolation, so you can commit plain text values, or reference an environment variable via `ENV`. The `secret_key_base` can then be accessed by Rails and application code as `Rails.application.secrets.secret_key_base`.

This file also supports storage of *all* the application's secrets. For example:

```yml
development:
  secret_key_base: d9d6241...
  stripe_secret_key: devstripe...
  another_secret: ...
  ...

test:
  secret_key_base: 638095d...
  stripe_secret_key: testtripe...
  another_secret: ...
  ...

staging:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
  stripe_secret_key: <%= ENV["STRIPE_SECRET_KEY"] %>
  another_secret: ...
  ...

# Do not keep production secrets in the repository,
# instead read values from the environment.
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
  stripe_secret_key: <%= ENV["STRIPE_SECRET_KEY"] %>
  another_secret: ...
  ...
```

The other secrets could then be accessed in application code, for example: `Rails.application.secrets.stripe_secret_key`.

**Potential security issues:**

Although the comments in this file warn to use environment variables for production, there is nothing to enforce it. So if a team didn't have a way to easily manage environment variables, it's possible that some teams may have started committing their plain text secrets in this file. This may explain why this feature had to change.

## History

I dug through the history of release notes from 4.1 to 7.2 to understand how this feature has changed over time:

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

This release refined the encryption concept, referring to it as [custom credentials](https://guides.rubyonrails.org/v5.2/security.html#custom-credentials) rather than "secrets". Another new file was introduced `config/credentials.yml.enc`, along with a `config/master.key` containing the key to encrypt and decrypt the credentials file.

If you had previously migrated from `config/secrets.yml` to `config/secrets.yml.enc`, you would now migrate again to `config/credentials.yml.enc`.

Once again, there are no instructions on how to take the previous environment-specific plain text or erb interpolated values from the old file to the new encrypted file. It also seems like there's a single `config/master.key` that would be used across all environments. For example, you might have multiple deployed environments like staging and production, and having a shared master key across both of them is not ideal.

At this time, the previous plain text secrets were still supported. The 5.1 release notes have an important message:

> This will eventually replace Rails.application.secrets and the encrypted secrets introduced in Rails 5.1

Here is where it would have been useful to start having deprecation warnings.

[Release Notes](https://guides.rubyonrails.org/5_2_release_notes.html#credentials)

**6.0 Multi Environment Credentials**

This release maintained the previous encrypted credentials, but added support for multi-environment credentials. This is only mentioned as a bullet point in the release notes under "Notable changes". The associated [PR]((https://github.com/rails/rails/pull/33521)) has some lively discussion. But once again, there's no final instructions for how to convert from old plain text secrets to environment-specific encrypted credentials.

The [securing rails application guide for 6.0](https://guides.rubyonrails.org/v6.0/security.html#environmental-security) has the same explanation as the previous 5.2 guide for how to use encrypted credentials, but it doesn't mention the new environment-specific options introduced in the PR.

[Release Notes](https://guides.rubyonrails.org/6_0_release_notes.html)

**7.0**

This release maintained the previous encrypted credentials with no notable changes.

[Release Notes](https://guides.rubyonrails.org/7_0_release_notes.html)

**7.1 Secrets Deprecation**

This release maintains the previous encrypted credentials and adds a [deprecation notice](https://guides.rubyonrails.org/7_1_release_notes.html#railties-deprecations) for favouring credentials over secrets. This explains why I only started seeing the deprecation message during the 7.0 to 7.1 upgrade.

[Release Notes](https://guides.rubyonrails.org/7_1_release_notes.html)

**7.2 Secrets Dropped**

This release drops support for `Rails.application.secrets`. Trying to reference it will result in an error:

```ruby
Rails.application.secrets
# undefined method `secrets' for an instance of SomeApp::Application (NoMethodError)
```

[Release Notes](https://guides.rubyonrails.org/7_2_release_notes.html)

Now that we've covered the history from secrets and secret key base, to credentials and master key, we're finally ready to resolve the deprecation. There's a few different ways to solve this. The next sections will provide some guidance to help you choose what's most appropriate for your project.


## Solution A: Replace Secrets with Environment Variable

On our team, we found the easiest way to resolve this was to remove the secrets file, and not introduce the replacement credentials file, in favour of an environment variable `SECRET_KEY_BASE`.

**Consider this solution if:**

* The only secret in `config/secrets.yml` is the `secret_key_base`.
* The project has access to a tool for converting secrets to environment variables in deployed environments (eg: AWS Parameter Store, Hashicorp Vault, Heroku Config, etc.)

**Steps:**

1. Make sure `SECRET_KEY_BASE` is defined in every deployed environments' configuration (eg: staging, production).
2. Make a backup of the original `config/secrets.yml` outside of source control and remove it from the project.
3. In development and test environments, do nothing, Rails will automatically generate a git ignored file `tmp/local_secret.txt` containing a randomly generated value of `secret_key_base`, if it can't find a `SECRET_KEY_BASE` environment variable and there is no encrypted credentials yaml.
4. Commit the changes to source control (which is just the removal of `config/secrets.yml`).

<aside class="markdown-aside">
Continuity of the `secret_key_base` value doesn't matter for development and test so it should be fine to let Rails generate a new one in those environments. These environments are normally reset frequently and there's no need to ensure a dev/test user that was logged in on your localhost needs to remain so after a Rails upgrade.
</aside>

Optionally, if you want development and test environments to be consistent with the technique used in deployed environments, the `SECRET_KEY_BASE` environment variable can be added to `.env.development` and `.env.test`, with the value being whatever it was in the old `config/secrets.yml`, development and test sections. Then Rails will read from the environment variable rather than generating a `tmp/local_secret.txt`. This will work given that the project is using the [dotenv-rails](https://rubygems.org/gems/dotenv-rails) gem.

**Verify:**

Run a Rails console on your laptop (i.e. development mode) to check the value of the secret key base:

```ruby
Rails.application.secret_key_base
#=> should be value from `tmp/local_secret.txt`
# OR
# .env.development SECRET_KEY_BASE
```

After deploying the changes to production (or staging first if you have another deployed environment), connect to a Rails console on the deployed environment and check the value of the secret key base:

```ruby
Rails.application.secret_key_base
#=> should be value from SECRET_KEY_BASE env var defined in deployed environment
```

**Why this works:**

Rails first searches for the `secret_key_base` value in `ENV["SECRET_KEY_BASE"]`. If this environment variable is not found, then Rails will search for it in the new encrypted credentials yaml file. If your old `config/secrets.yml` already contained `<%= ENV["SECRET_KEY_BASE"] %>`, then effectively it was already reading an environment variable, and the yaml file was just serving as a pass-through.

**Benefits:**

Switching to an environment variable for managing `SECRET_KEY_BASE` simplifies and standardizes secret management across all environments. This consistency ensures future developers don’t spend time deciphering why some secrets are managed in a yaml file and some with environment variables. This also aligns with standard practices for managing environment variables securely in deployment pipelines.

## Solution B: Convert Secrets to Credentials

In this solution, all the secrets in `config/secrets.yml` will be converted to the new encrypted credentials format. We'll use the environment-specific support introduced as of Rails 6.0 to isolate both the secrets and the master key needed to decrypt/encrypt them on a per-environment basis.

**Consider this solution if:**

* There are multiple secrets stored in `config/secrets.yml` in addition to `secret_key_base`. i.e. the application code has references to `Rails.application.secrets.some_secret`, `Rails.application.secrets.another_secret`, etc.
* Your project is not configured with a tool to convert secrets to environment variables. Keep in mind you'll still need to manage one new secret `RAILS_MASTER_KEY`.

For example, suppose the `config/secrets.yml` contains plain-text values from all environments (assuming it was a private source repository and if the team didn't have a secrets manager, then this would have been the easiest option, albeit not that secure in case of a breach of the source code hosting).

The actual secret values would be long random alpha-numeric strings such as `b9efa92ff...`, but I'm putting in simple legible values for demonstration purposes:

```yml
# config/secrets.yml

development:
  secret_key_base: dev-secret-key-base
  stripe_secret_key: dev-stripe-secret-key
  another_secret: ...
  ...

test:
  secret_key_base: test-secret-key-base
  stripe_secret_key: test-stripe-secret-key
  another_secret: ...
  ...

staging:
  secret_key_base: staging-secret-key-base
  stripe_secret_key: staging-stripe-secret-key
  another_secret: ...
  ...

production:
  secret_key_base: production-secret-key-base
  stripe_secret_key: production-stripe-secret-key
  another_secret: ...
  ...
```

### Step 1: Convert Development Secrets to Credentials

Assuming git version control is being used on the project, start by creating a branch for this work:

```bash
# Follow your project's branch naming conventions
git checkout -b chore-migrate-secrets-to-credentials
```

Make a backup of `config/secrets.yml` to somewhere secure and remove it from the project. This is to ensure that if the application is still trying to access it, it won't work correctly.

Next, run the following in a terminal at the project root:

```bash
bin/rails credentials:edit --environment development
```

The output from this command will be something like this:

```
Adding config/credentials/development.key to store the encryption key: a44c8fd8b05cd46af35b34f778b56f37

Save this in a password manager your team can access.

If you lose the key, no one, including you, can access anything encrypted with it.

      create  config/credentials/development.key

Ignoring config/credentials/development.key so it won't end up in Git history:

      append  .gitignore

Configured Git diff driver for credentials.
Editing config/credentials/development.yml.enc...
```

**Explanation:**

1. A new directory `credentials` was created in the existing `config` directory.
2. A new encrypted file was generated to persist the development secrets: `config/credentials/development.yml.enc`
3. A new master key was generated to encrypt and decrypt the development secrets: `a44c8f...`
4. The value of the development master key is saved in a new file: `config/credentials/development.key`
5. The file containing the development master key is gitignored. You can verify this by checking the `.gitignore` file - it has a new entry: `/config/credentials/development.key`

At this point, your editor will be open with a temporary file that displays the decrypted contents of newly generated `config/credentials/development.yml.enc`. Rails generates some example content like this:

```yml
# aws:
#   access_key_id: 123
#   secret_access_key: 345
```

Edit the file, porting over the values that were previously in `config/secrets.yml` development section as follows:

```yml
secret_key_base: dev-secret-key-base
stripe_secret_key: dev-stripe-secret-key
```

Save the file, and then close it. When closed, Rails will encrypt the contents, saving the results to `config/credentials/development.yml.enc`.

Opening the encrypted file `config/credentials/development.yml.enc` directly in an editor will only show the encrypted contents and not be human readable. For example:

```
akdhz8ZaV6MpFpavkrPtQkHUOkFJprED4Sr2y6Zihpww75KA7mPoGQnthu/SPBeQPPKMFNwji8bSjy7gaY+nfllG+q1QMEKM1ntJyn/o+l3hr/AnKdjOa0QEqog+zGLpC8mf66dCEllnAdx84K7WA6pt+2awrdFkZpossOkg27p1j3MFXJSzZ1PXEPces4/5rxTaOCAobwPEeJhizmDAmPOcvnlNfq3POMl/hb4ydqgMpnxweultayA/--sepv1Y5SB+QFU/cp--DuDkAeCIggKo0nj5N8xTxQ==
```

<aside class="markdown-aside">
To use the `credentials:edit` command, Rails needs to know which editor to open. By default, it uses the system's default editor, which is often vim. If you prefer another editor, you can set the `EDITOR` environment variable. For example, to use VS Code: `export EDITOR="code --wait"`.
</aside>

If you need to view the contents of this file or open it for editing, you would again run `bin/rails credentials:edit --environment development`. This time, rather than generating a new development key, Rails will use the existing key saved at `config/credentials/development.key` to decrypt the file and display the plain text contents in a temporary file in your editor.

Launch a Rails console `bin/rails c` and verify the credentials are accessible from application code:

```ruby
Rails.application.credentials.secret_key_base
=> "dev-secret-key-base"

# Also available directly on Rails.application
Rails.application.secret_key_base
=> "dev-secret-key-base"

Rails.application.credentials.stripe_secret_key
=> "dev-stripe-secret-key"
```

Rails uses the `development.key` to decrypt the contents of `development.yml.enc` so you have access to all the secrets defined in the file at run-time.

The credentials yaml file also supports nesting for the application secrets. For example, the Stripe secrets could be organized as follows:

```yml
secret_key_base: dev-secret-key-base

stripe:
  secret_key: dev-stripe-secret-key
  publishable_key: dev-stripe-publishable-key
  webhook_secret: dev-stripe-webhook-secret
```

In this case, the stripe secrets are accessible in application code like this:

```ruby
Rails.application.credentials.stripe
=> {
      :secret_key=>"dev-stripe-secret-key",
      :publishable_key=>"dev-stripe-publishable-key",
      :webhook_secret=>"dev-stripe-webhook-secret"
   }

Rails.application.credentials.stripe.secret_key
=> "dev-stripe-secret-key"

Rails.application.credentials.stripe.publishable_key
=> "dev-stripe-publishable-key"
```

**ERB Interpolation Not Supported**

When using encrypted credentials, you must enter the plain text values when editing the decrypted file. Unlike the old `config/secrets.yml`, erb interpolation does not work. For example, if you were to enter in the temporary editor window:

```yml
secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
```

Then attempt to access the `secret_key_base` in a Rails console, the value will be a literal string of the above, even if `SECRET_KEY_BASE` is set:

```ruby
Rails.application.secret_key_base
=> "<%= ENV[\"SECRET_KEY_BASE\"] %>"
```

### Step 2: Convert All Other Environment Secrets

Repeat the above procedure, for every other environment your application supports. For example:

```
bin/rails credentials:edit --environment test
bin/rails credentials:edit --environment staging
bin/rails credentials:edit --environment production
```


### Step 3: Update Application Code

Find all references to `Rails.application.secrets.something` in your application code and change it to `Rails.application.credentials.something`.

At this point, you should be able to run your Rails server locally `bin/rails s` without seeing the secrets/credentials deprecation warning. Exercise all the workflows that depend on secrets to ensure your development secrets are being read correctly from the new encrypted credentials yaml file.

Also run your test suite locally. It should pass and should not output any secrets/credentials deprecation warning. This assumes that there is test coverage for the areas of the app that use the secrets!

### Step 4: Commit Changes to Source Control

At this point, the `config/credentials` directory should contain the following:

```
config
├── credentials
│   ├── development.key
│   ├── development.yml.enc
│   ├── production.key
│   ├── production.yml.enc
│   ├── staging.key
│   ├── staging.yml.enc
│   ├── test.key
│   └── test.yml.enc
```

The `.gitignore` file will have the following new entries added to ignore the `*.key` files:
```
/config/credentials/development.key
/config/credentials/test.key
/config/credentials/staging.key
/config/credentials/production.key
```

The `*.yml.enc` files are encrypted and contain all the secrets ported over from `config/secrets.yml`. These should be committed into source control.

The `*.key` files contain the master key(s) to encrypt/decrypt the corresponding yaml files. These are git ignored and should NOT be committed into source control.

Commit the changes to the branch, for example:

```bash
git add .gitignore

git add config/credentials/development.yml.enc
# add rest of the encrypted yaml files

git commit -m "convert deprecated secrets to encrypted credentials"
git push
```

The `config/secrets.yml` removal you did earlier in [Step 1](../migrating-from-rails-secrets-to-credentials#step-1-convert-development-secrets-to-credentials) should also be included in this commit.

At this point, since the key files only exist on your laptop, yours is the only machine capable of decrypting the credentials yaml file. The next steps are about ensuring others can as well.

The key to understanding this is if Rails can't find a key file at `config/credentials/{env}.key`, it will read it from `RAILS_MASTER_KEY` environment variable. Since the key files are not committed, the solution in all other environments is to ensure the `RAILS_MASTER_KEY` environment variable is populated.

### Step 5: Update Continuous Integration

If you have a continuous integration system that runs tests, such as GitHub Actions, Circle CI, Travis CI, etc. That system will need access to the test master key to decrypt the test credentials file. Recall that currently the test credentials file `config/credentials/test.yml.enc` has been committed, but the key to decrypt it is at `/config/credentials/test.key`, which only exists on your laptop. This means if the CI system were to run on the branch where you just committed, it will fail because it won't have access to the secrets.

Most CI systems have a way to populate a secret via their web dashboards, and make it available to the workflow as an environment variable. Go ahead and do this, creating a new secret/environment variable `RAILS_MASTER_KEY`, and populate it with the value from the file on your laptop: `/config/credentials/test.key`

Details of how to do this are CI-specific, for example here's how to [use secrets in GitHub actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions).

### Step 6: Update Deployed Environments

To ensure the application deployed in production (or other environments like staging) can decrypt the credentials, the corresponding master key needs to be available in the deployment environment. Currently it's at  `config/credentials/staging.key` and `config/credentials/production.key` on your laptop.

This step will vary depending on how you deploy your Rails application. In general, this requires a new environment variable `RAILS_MASTER_KEY` to be set and populated. Refer to your hosting provider’s documentation (eg: Hetzner, Linode, DigitalOcean, etc.) for the exact steps.

### Step 7: Team Sharing

Recall all the key files are gitignored. If working with a team, they'll also need access to the key files, especially dev and test so they can run their servers and tests locally. The team should also have access to the deployment master keys (staging, production) in case someone needs to setup a new server. Save these somewhere secure that the rest of the team can access the keys. For example a password manager that supports team sharing such as 1Password, Bitwarden, etc.

Also update your project's `README.md` setup instructions, informing developers of where to find the keys, and to create files `config/credentials/development.key` and `config/credentials/test.key` in their local project directories containing the key values.

## Summary

Here are the key terms covered in this post:

* **secret_key_base:** A secret key used to sign cookies, session data, and other sensitive information.
* **Secrets:** The old technique for managing `secret_key_base` and other sensitive application data in a plain text yaml file.
* **Credentials:** The new technique for storing secrets, in an encrypted yaml file, protected by a master key.
* **Master Key:** The key used to encrypt and decrypt credentials. By default, Rails looks for this key in `config/master.key`, but it can also be set per environment (eg: `config/credentials/production.key`) or via the `RAILS_MASTER_KEY` environment variable.

If you’ve found the process of migrating Rails secrets to credentials confusing, you’re not alone. This area has a long, evolving history, and a clear migration path is difficult to find. Personally, I prefer managing secrets through environment variables, as it’s a widely adopted and straightforward approach. Whatever path you choose, the key is to prioritize security and a workflow that fits your team's needs.

Here are some other blog posts and references that helped me during this investigation:

* [Understanding Rails secrets/credentials](https://www.codewithjason.com/understanding-rails-secrets-credentials/)
* [Rails 6 adds support for multi environment credentials](https://blog.saeloun.com/2019/10/10/rails-6-adds-support-for-multi-environment-credentials)
* [Rails PR introducing credentials](https://github.com/rails/rails/pull/30067)
* [Discussion on ERB in credentials](https://discuss.rubyonrails.org/t/erb-in-credentials-yml/82405)
* [Discussion on secrets vs credentials](https://discuss.rubyonrails.org/t/the-status-of-simultaneous-support-for-secrets-encrypted-credentials-and-multi-environment-encrypted-credentials-is-confusing/75177/4)
