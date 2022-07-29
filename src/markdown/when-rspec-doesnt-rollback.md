---
title: "When RSpec Doesn't Rollback"
featuredImage: "../images/rspec-rollback-mihaly-koles-Ec_WHv4aAno-unsplash.jpg"
description: "Learn some troubleshooting techniques with RSpec and database transactions."
date: "2022-11-01"
category: "rails"
related:
  - "Start a Rails 6 Project with RSpec"
  - "Testing Faraday with RSpec"
  - "Solving a Python Interview Question in Ruby"
---

This post will walk you through some troubleshooting techniques when [RSpec](https://rspec.info/) tests are failing due to unexpected data in the test database. I had experienced some RSpec tests that were passing the first time they ran, individually, but then failing on subsequent runs, or when run as part of the entire test suite. It turned out to be a combination of two things - not fully understanding how RSpec manages transactions, and how using or not using `let/let!` helper methods can impact this.

## Setup

The RSpec tests are part of a Rails project, and use [FactoryBot](https://github.com/thoughtbot/factory_bot) to create test data. This post assumes some familiarity with these tools. The other thing to know is I listen to the [Bike Shed](https://www.bikeshed.fm/) podcast, and recently there have been some discussions about not using [let](https://relishapp.com/rspec/rspec-core/docs/helper-methods/let-and-let), or at least, avoid [overusing](https://thoughtbot.com/blog/lets-not) it.

The `rails_helper.rb`, which is included in every spec file configures the use of transactional fixtures as follows:

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  # other config ...
end
```

My understanding of this setting was that any data inserted into the test database *anywhere* in a test would always get rolled back, leaving the database nice and clean for the next test.