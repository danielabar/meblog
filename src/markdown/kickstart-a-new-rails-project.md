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

Starting a new Rails project is an exciting time, but it also comes with its fair share of setup tasks to ensure your project kicks off on the right foot. In this blog post, I'll walk through some important steps that I like to follow to set up a Rails project for success. From configuring the database to ensuring code quality and style, and setting up essential development tools. Let's get started.

## Initialization

At the time of this writing, here are the versions of Ruby and Rails that I'm using:

```bash
ruby --version
# ruby 3.2.2

rails --version
# Rails 7.0.8
```

Use the `rails new` generator to generate new project with Postgres:

```bash
rails new my-awesome-app --database=postgresql
```

This assumes you're previously installed Postgres, for example: `brew install postgresql@14`. If you don't specify the `--database` flag in the generator command, it will use SQLite, which can be ok for a very small project or for someone who's just getting started with Rails and wants to keep things very simple. But later if you want to deploy it to a PaaS like Heroku or Render that use ephemeral environments, it won't work and will require switching to Postgres.

<aside class="markdown-aside">
Opting for Postgres offers many benefits, including robust data integrity, support for complex data types, advanced indexing options, compatibility with geo-spatial data, and access to community extensions.
</aside>

## Database Setup

After the project has been generated, I recommend running Postgres in a Docker container rather than directly on your laptop. This makes it convenient to add other services like Redis for Sidekiq or ActionCable later on. You can check out my detailed guide in this previous post [Setup a Rails Project with Postgres and Docker](../rails-postgres-docker).

Once you've set up Postgres, ensure that your Rails project is configured to generate a `structure.sql` file instead of `schema.rb` for your database schema. This can be done by adding the following line to your `config/application.rb` file:

```ruby
config.active_record.schema_format = :sql
```

The benefit of this is you may in the future have a migration that executes some SQL that cannot be expressed by the DSL provided by Rails. See the Rails Guides on [Schema Dumps](https://edgeguides.rubyonrails.org/active_record_migrations.html#types-of-schema-dumps) for more details.

Before moving on to further setup, this is a good time to ensure database can be started and created with `bin/setup`. If the database is configured correctly, the output of this command should include:
```
== Preparing database ==
Created database 'my_awesome_app'
Created database 'my_awesome_app_test'
```

Then launch a psql session with `bin/rails db`, which will connect you to the development database. Then run `\d` at the psql prompt to list tables, you should see:

```
                 List of relations
 Schema |         Name         | Type  |    Owner
--------+----------------------+-------+-------------
 public | ar_internal_metadata | table | my_awesome_app
 public | schema_migrations    | table | my_awesome_app
(2 rows)
```

### Annotate Gem for Schema Information

For a clearer understanding of your database schema and to save time when working with models, consider adding the [annotate](https://github.com/ctran/annotate_models) gem to your development and test sections of the Gemfile.

```ruby
# Gemfile
group :development, :test do
  gem "annotate"
  # ...
end
```

After adding it, run the installation command:

```bash
rails g annotate:install
```

This ensures that anytime database migrations are run, the schema information will be automatically prepended to the models, tests, and factories (more on testing later). This is beneficial when working with a model, such as adding scopes or other methods, to see what columns, indexes, and constraints are available.

For example, given the following migration to create a `products` table:

```ruby
class CreateProducts < ActiveRecord::Migration[7.0]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.decimal :price, null: false
      t.integer :inventory, null: false, default: 0

      t.timestamps
    end
  end
end
```

And corresponding Product model:

```ruby
class Product < ApplicationRecord
  # ...
end
```

After running the migration with `bin/rails db:migrate`, the model class will be updated with the schema information as comments at the beginning of the file:

```ruby
# == Schema Information
#
# Table name: products
#
#  id         :integer          not null, primary key
#  code       :string           not null
#  inventory  :integer          default(0), not null
#  name       :string           not null
#  price      :decimal(, )      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Product < ApplicationRecord
  # ...
end
```

The same schema comments will also get added to the model test `spec/models/product_spec.rb` and factory `spec/factories/product.rb` (given that these files exist at the time you run migrations).

## Code Quality and Style

Maintaining clean and consistent code is essential for any project. Here's how you can set up code quality and style checks for your Rails project.

### Rack Mini Profiler

Uncomment the `gem "rack-mini-profiler"` line in your Gemfile to enable Rack Mini Profiler. This tool helps you identify performance bottlenecks in your application by providing real-time metrics on database queries, rendering times, and memory usage. See this [guide](https://stackify.com/rack-mini-profiler-a-complete-guide-on-rails-performance/) for more details on how to use it.

### Rubocop for Code Quality

For code quality checks, add Rubocop and some official extensions to the development group in the Gemfile:

```ruby
group :development do
  gem "rubocop"
  gem "rubocop-rails"
  gem 'rubocop-rspec'
  gem 'rubocop-performance'
  gem 'rubocop-thread_safety'
  gem 'rubocop-factory_bot'
  gem 'rubocop-capybara'
end
```

After adding these gems, create a `.rubocop.yml` file in your project's root directory with custom configurations. This is because you'll nearly always want to customize the Rubocop defaults. The details will vary by project, but here's where I like to start:
* Excluding generated files.
* Not enforcing code comment docs (although I'm a huge fan of [engineering documentation](../about-those-docs), enforcing it with `Style/Documentation` can lead to useless comments like `# This is the product model`).
* Increase some max lengths to account for modern large and high resolution monitors.

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

RSpec/ExampleLength:
  Max: 15
```

## Automated Tests

While Rails comes with minitest for testing, I prefer using RSpec, together with FactoryBot for a BDD approach to testing, and explicit test data creation. Here's how to set it up.

Add `rspec-rails` gem to the Gemfile:

```ruby
# Gemfile
group :development, :test do
  gem "rspec-rails"
end
```

It's placed in the development and test groups so that generators and rake tasks don't need to be preceded by `RAILS_ENV=test`. See the [installation docs](https://github.com/rspec/rspec-rails#installation) for more details.

After adding the gem, run the following commands to install and bootstrap RSpec:

```bash
bundle install
bin/rails generate rspec:install
```

Cleanup the old `test` directory from rails new generator to avoid confusion (assuming there's nothing important in here):

```bash
rm -rf test
```

Optionally, you can generate a binstub for RSpec to make running tests more convenient:

```bash
bundle binstubs rspec-core
```

Now instead of having to type `bundle exec rspec` to run tests, this can be shorted to `bin/rspec`.

### Factories

By default, Rails ships with fixtures, which are yaml files that represent test data. They will be automatically loaded into the test database before every test run. While they are fast (due to database constraints being dropped before data loading), as a project and the data model grows, particularly with associations, fixtures can become a source of complexity. I prefer to use FactoryBot for more explicit data creation per each test that needs it.

To create test data easily, add the `factory_bot_rails` gem to your development and test groups in the Gemfile:

```ruby
group :development, :test do
  gem "factory_bot_rails"
end
```

This will cause Rails to generate factories instead of fixtures when running for example `bin/rails generate model SomeModel`. See the [FactoryBot Generator docs](https://github.com/thoughtbot/factory_bot_rails#generators) if you want different behaviour.

```ruby
# Gemfile
group :development, :test do
  gem "factory_bot_rails"
end
```

Next, configure FactoryBot in `spec/rails_helper.rb`:

```ruby
RSpec.configure do |config|
  # Other config...

  # Allows tests to use FactoryBot methods like `build`, `build_stubbed`, `create` etc.
  # without having to be preceded by FactoryBot. For example:
  # subject(:product) { create(:product) }
  # instead of
  # subject(:product) { FactoryBot.create(:product) }
  config.include FactoryBot::Syntax::Methods
end
```

See this post for more discussion on [factories vs fixtures](https://harled.ca/blog/the_battle_of_factories_vs_fixtures_when_using_rspec).

### Should Matchers

This is another gem I like to add to support more expressive model testing. Add it to your test group in the Gemfile:

```ruby
# Gemfile
group :test do
  gem 'shoulda-matchers', '~> 5.0'
end
```

After adding the gem, configure it at the end of your `spec/rails_helper.rb` file:

```ruby
# Other config...
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
* Testing section WIP
* mention `build_stubbed` over `create` where possible for performance
* Include example of model class with result of annotate (not just model: also rspec model test and factorybot factory!)
* Briefly explain benefits of Rubopcop extensions
* Show example of model with presence validation, and one-liner shoulda matcher rspec
* Show example of Solargraph, hover over something from Rails, then click through, goes into the right gem version and shows the code
* Maybe mention each project may require more, but this is the bare minimum I've found that I always reach for in every project. Eg: `dotenv-rails` - always needed or optional?
* conclusion para
* edit
