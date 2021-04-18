---
title: "Start a Rails 6 Project with RSpec"
featuredImage: "../images/scaffold-rails-jack-b-S3SU988T13A-unsplash.jpg"
description: "Learn how to start a new Rails 6 project with RSpec as the default testing library."
date: "2020-10-18"
category: "rails"
---

Currently at work I have one of those rare opportunities to greenfield new project. Since we're a Rails shop, naturally I'm using Rails, and since it's a new project, might as well use the latest and greatest, which at the time of this writing is Rails 6.

However I ran into a little surprise when it came to testing. Being somewhat of a Rails noob, based on the handful of projects I've worked on so far, had assumed that RSpec was the default test framework that comes with Rails. But it turns out, this is not the case. There's a few additional steps needed to setup a Rails project to use RSpec. This post will walk you through the steps I took to scaffold a new Rails 6 project and set it up for testing with RSpec.

## Project Scaffolding

Run the following commands to get the project started. I'm using Ruby 2.7.1 and will be using Postgres as the database.

```bash
gem install rails -v 6.0.3.4 # the most recent version at the time of this writing
brew install postgresql
rails new myapp -d=postgresql
cd myapp
```

My next step was to generate some models. Since this will be a multi tenant system, first model is the Tenant class.

```bash
rails generate model Tenant name:string
```

The output of this command is:

```
Running via Spring preloader in process 19406
  invoke  active_record
  create    db/migrate/20201018145546_create_tenants.rb
  create    app/models/tenant.rb
  invoke    test_unit
  create      test/models/tenant_test.rb
  create      test/fixtures/tenants.yml
```

Notice it didn't generate an RSpec test. It turns out, the default testing library that comes with Rails is Minitest and the generator creates a Minitest test file and fixture. Here's what's needed to switch to RSpec.

## Add RSpec

First start by adding the RSpec gem to the test section of the Gemfile. Actually the [rspec-rails](https://relishapp.com/rspec/rspec-rails/v/4-0/docs) gem is used which adds RSpec support to Rails:

```ruby
group :test do
  gem 'rspec-rails'
end
```

Then install and bootstrap it. This will generate the `spec` dir and some support files:

```bash
bundle install
rails generate rspec:install
```

## Configure RSpec

You would think at this point, you could run the model generator and this time an RSpec test would get generated. But in my experience, it still generated the Minitest test and fixture. One more change you need to make is to tell the Rails generator that you only want RSpec tests. This configuration is specified in the `config/initializers/generators.rb` file. Go ahead and create this file if it's not already there. Then add the following:

```ruby
Rails.application.config.generators do |g|
  g.test_framework :rspec
end
```

Now the model generator will generate an RSpec test file:

```bash
rails generate model Tenant name:string
```

Command output:

```
Running via Spring preloader in process 21305
  invoke  active_record
  create    db/migrate/20201018150823_create_tenants.rb
  create    app/models/tenant.rb
  invoke    rspec
  create      spec/models/tenant_spec.rb
```

## Cleanup

Final step is to remove the generated `test` dir to avoid confusion. RSpec uses the `spec` dir for all test and support files.

```bash
rm -rf test
```

That's it, now you're setup for RSpec testing, happy coding!

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.