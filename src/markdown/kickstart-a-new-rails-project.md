---
title: "Kickstart a New Rails Project"
featuredImage: "../images/kickstart-rails-alexas_fotos-wdxT3xl8Dfo-unsplash.jpg"
description: "Discover the essential steps and gems for launching a new Rails project. From setting up services in Docker containers to harnessing the power of RSpec, FactoryBot, and other must-have tools."
date: "2024-03-01"
category: "rails"
related:
  - "Setup a Rails Project with Postgres and Docker"
  - "Add Rubocop to an Existing Rails Project"
  - "Start a Rails 6 Project with RSpec"
---

Embarking on a new Rails project is both thrilling and challenging. To ensure a smooth start, it's essential to lay down a practical and efficient groundwork. In this guide, we'll dive into the nuts and bolts of setting up a new Rails project with a focus on simplicity and productivity. We'll explore critical steps like configuring PostgreSQL and integrating Tailwind CSS, optimizing your development environment through Docker, and adopting developer-friendly tools like RSpec, FactoryBot, and more. This guide is all about sharing practical tips and proven practices that I've found invaluable in my own journey. So, let's cut to the chase and get your Rails project off to a strong start.

## Rough Notes WIP...

## Initialization

At the time of this writing:

```bash
ruby --version
# ruby 3.2.2 (2023-03-30 revision e51014f9c0) [arm64-darwin22]

rails --version
# Rails 7.0.8
```

Generate new project with Postgres and TailwindCSS:

```bash
rails new retro-pulse --css tailwind --database=postgresql
```

Note: This assumes you're previously installed postgres, for example: `brew install postgresql@14`

Aside: Yes TailwindCSS can be controversial, and before I had tried it, my thought was "why not just stick with vanilla CSS?", but then I took a course (share notes and course link) and formed a different opinion. I guess this goes in the bucket of "don't knock it till you try it".

## Database

Run Postgres in a Docker container (link to my other post), also mention its convenient if you later want to add redis for sidekiq or actioncable for example.
Maybe quickly show docker-compose.yml, init.sql and database.yml, without all the explanations, and link to my post for more details.

Ensure `structure.sql` will be generated instead of `schema.rb`, when migrations are run:
```ruby
# config/application.rb
config.active_record.schema_format = :sql
```

Before moving on to further setup, this is a good time to ensure database can be started and created with `bin/setup`, should see output like:
```
== Preparing database ==
Created database 'retro_pulse'
Created database 'retro_pulse_test'
```

Then launch a psql session with `bin/rails db`, which will connect you to the dev database. Then run `\d` at the psql prompt to list tables, you should see:
```
                 List of relations
 Schema |         Name         | Type  |    Owner
--------+----------------------+-------+-------------
 public | ar_internal_metadata | table | retro_pulse
 public | schema_migrations    | table | retro_pulse
(2 rows)
```

Add [annotate](https://github.com/ctran/annotate_models) gem to development and test sections of Gemfile:

```ruby
# Gemfile
group :development, :test do
  gem "annotate"
  # ...
end
```

Run the [install command](https://github.com/ctran/annotate_models#configuration-in-rails) so that running database migrations will automatically prepend schema information to the models and tests (more on testing later). This is beneficial when working with a model, such as adding scopes or other methods, to see what columns, indexes, and constraints are available.

```bash
bundle install
rails g annotate:install
```

## Code Quality and Style

Uncomment `gem "rack-mini-profiler"`

Add Rubocop and some official [extensions](https://docs.rubocop.org/rubocop/extensions.html):

```ruby
# Gemfile
group :development do
  # Code quality
  gem "rubocop"
  gem "rubocop-rails"
  gem 'rubocop-rspec'
  gem 'rubocop-performance'
  gem 'rubocop-thread_safety'
  gem 'rubocop-factory_bot'
  gem 'rubocop-capybara'
end
```

Then add .rubocop.yml in project root with some customizations:

```yml
require:
  - rubocop-rails
  - rubocop-rspec
  - rubocop-performance
  - rubocop-thread_safety
  - rubocop-factory_bot
  - rubocop-capybara

AllCops:
  NewCops: enable
  Exclude:
    - 'db/schema.rb'
    - 'Gemfile'
    - 'lib/tasks/*.rake'
    - 'bin/*'
    - 'node_modules/**/*'
    - 'config/puma.rb'
    - 'config/spring.rb'
    - 'config/environments/development.rb'
    - 'config/environments/production.rb'
    - 'spec/spec_helper.rb'

Style/FrozenStringLiteralComment:
  Enabled: false

Style/Documentation:
  Enabled: false

Style/StringLiterals:
  EnforcedStyle: double_quotes

Metrics/BlockLength:
  Exclude:
    - 'spec/**/*.rb'

Metrics/MethodLength:
  Max: 15

Layout/LineLength:
  Max: 120

# Only if not using I18n
Rails/I18nLocaleTexts:
  Enabled: false

RSpec/ExampleLength:
  Max: 15
```

## Testing...

Rails ships with minitest and test fixtures for automated testing, but I prefer to use RSpec with FactoryBot for explicit test data creation rather than having test data automatically loaded by fixtures. Ref: [Mystery Guest](https://thoughtbot.com/blog/mystery-guest).

RSpec instead of Minitest, shoulda matchers.

Ref my post on starting a project with RSpec.

Add `rspec-rails` gem to dev and test groups so that generators/rake tasks don't need to be preceded by RAILS_ENV=test, ref: https://github.com/rspec/rspec-rails#installation

```ruby
# Gemfile
group :development, :test do
  gem "rspec-rails"
end
```

Install and bootstrap:
```bash
bundle install
bin/rails generate rspec:install
```

TODO: Still requires config/initializor/generator? -> NO

Cleanup old test dir from rails new generator to avoid confusion `rm -rf test`

Optional generate binstub: `bundle binstubs rspec-core` so you can run `bin/rspec` instead of `bundle exec rspec` to run tests.

FactoryBot for creating test data (mention use build_stubbed where possible over create for performance)

Add to dev/test section of Gemfile. Note this causes Rails to generate factories instead of fixtures, this is exactly what I want. See [docs](https://github.com/thoughtbot/factory_bot_rails#generators) if you want different behaviour

```ruby
# Gemfile
group :development, :test do
  gem "factory_bot_rails"
end
```

Shoulda matchers for expressive model testing:

```ruby
# Gemfile
group :test do
  gem 'shoulda-matchers', '~> 5.0'
end
```

After installing, add config block to `spec/rails_helper.rb`:

```ruby
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
```

Before moving on, make sure everything is wired up properly by generating an example model, and ensure both the rspec test and factory is generated for it. Do this on a branch or after you've committed up to this point so you can safely get rid of it later:

```bash
bin/rails generate model Product name:string description:text price:decimal available:boolean
```

Output should show something like this - migration, model, model spec and product factory:

```
invoke  active_record
create    db/migrate/20231002125314_create_products.rb
create    app/models/product.rb
invoke    rspec
create      spec/models/product_spec.rb
invoke      factory_bot
create        spec/factories/products.rb
```

Clean up with:

```bash
bin/rails destroy model Product
```

## Other Dev Tooling

Faker gem for seed data (can also use it in factories for test data):

```ruby
# Gemfile
group :development, :test do
  gem "faker"
end
```

Add solargraph gem, TODO: explanation! Cmd + click into gems from VSCode (goes along with VSCode extension). Ideally the RubyLSP extension from Shopify would provide this, but not yet at the time of this writing:

Intelligent code assistance and help with code navigation, documentation, and autocompletion in Ruby/Rails projects

```ruby
# Gemfile
group :development do
  gem "solargraph"
end
```

## Service Layer Placeholder

Configure `app/services` dir with `.keep` file. Needs explanation, Rails not opinionated about how you organize business logic. Projects go through phases like:
- at first simple, not too many models, logic is in controller - easy to write but hard to test
- gradually some logic starts to move to AR models - but these are really about querying the database, and they get too big, especially the main models such as a `Product` model in an e-commerce app
- then eventually services (or interactors - todo link) get introduced. But there's never time to go back and refactor all business logic out of controllers and models into services so the project ends up like an archaeological dig, depending on how far back in time you go, will find different techniques. I've seen this so often that might as well go in with a services layer from the beginning to keep things clean and organized.

Need to add it to Rails auto load path:

```ruby
# config/application.rb
class Application < Rails::Application
  # other config...
  config.autoload_paths << Rails.root.join("services")
  # other config...
end
```

## TODO
* Intro para needs work
* Mention will walkthrough setting up an actual application that I'm starting on retro-pulse (link to repo if have pushed it)
* Include example of model class with result of annotate
* Explain why I prefer structure.sql over schema.rb
* Explain benefits of rack-mini-profiler
* Briefly explain benefits of Rubopcop extensions (eg: ignore generated files, modern monitors are bigger and higher res, both width - line length - and length as in block/method length can be a little longer than defaults)
* Explain briefly some rubocop customizations
* Show example of model with presence validation, and one-liner shoulda matcher rspec
* Show example of Solargraph, hover over something from Rails, then click through, goes into the right gem version and shows the code
* Maybe mention each project may require more, but this is the bare minimum I've found that I always reach for in every project. Eg: `dotenv-rails` - always needed or optional?
* conclusion para
* edit
