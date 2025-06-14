---
title: "Sustainable Feature Testing in Rails with Cucumber"
featuredImage: "../images/cucumber-feature-testing-kelly-neil-pdlC9_bgN9o-unsplash.jpg"
description: "A practical guide to feature testing in Rails with Cucumber, highlighting its readability, maintainability, and team-friendly syntax through a working demo project."
date: "2025-11-01"
category: "rails"
related:
  - "Rails Feature Test Solved by Regex"
  - "Testing Faraday with RSpec"
  - "Capybara Webdriver Element not Clickable Resolved"
---

Long-lived web applications need end-to-end tests, also known as system or browser-based tests. These tests need to ensure *correct* behaviour, but also be *communicative*. System tests simulate real user behavior, verifying full-stack workflows through the UI. But as a project grows, traditional system tests (typically implemented with RSpec and Capybara on Rails projects) can become hard to read and harder to maintain, especially when the test code obscures *what* is being tested behind *how* it’s implemented.

That’s where [Cucumber](https://cucumber.io/) comes in. By separating high-level intent from low-level implementation, Cucumber lets you write tests in plain language that developers, product managers, and future-you can all understand at a glance. In this post, I’ll walk through examples from a Rails app I built, the [Book Review Demo](https://github.com/danielabar/book_review_demo), to show how Cucumber can make your test suite more readable, maintainable, and enduring.

## What Is Cucumber

Cucumber is a testing tool that lets you describe application behavior in plain language. Unlike tools like Capybara or Selenium, which control the browser directly, Cucumber sits *above* your browser automation stack. Its job isn’t to drive the browser, but to express what you want to test in a way that anyone on your team, technical or non technical, can read and understand.

Cucumber scenarios are written in a structured format called [Gherkin](https://cucumber.io/docs/gherkin/reference), which uses keywords like `Feature`, `Scenario`, `Given`, `When`, and `Then` to describe user-facing behavior. For example:

```
Feature: Book reviews

  Background:
    Given the following books exist:
      | Title      | Author   | Published Year |
      | Book One   | Author A | 2001           |
      | Book Two   | Author B | 2002           |
    And users exist:
      | Email             | Password  |
      | user1@example.com | password1 |
      | user2@example.com | password2 |
    And the following reviews exist:
      | Book     | User Email        | Rating | Body       |
      | Book One | user2@example.com | 4      | Good read. |
    And I am signed in as "user1@example.com"

  Scenario: User sees book details and reviews
    When I visit the book show page for "Book One"
    Then I should see the book title, author, and published year for "Book One"
    And I should see the review for "user2@example.com" with body "Good read." and 4 stars
    And I should see a submit review button
```

We’ll unpack how this all works shortly, but for now, just notice how readable it is, even without knowing any Ruby or testing library syntax.

These phrases aren't comments or placeholders, they make up an executable test. Behind the scenes, each plain language step is connected to Ruby code that uses Capybara (or any other driver) to interact with the web application under test. This provides the best of both worlds: readable intent at the top, and full control at the bottom.

Cucumber is especially valuable in projects where collaboration matters. Product managers, QA engineers, designers, and even stakeholders can follow along with what’s being tested without needing to parse through RSpec matchers or complex DOM selectors. And for developers, that same clarity makes tests easier to write, refactor, and maintain over the long haul.

## Why Not Just RSpec + Capybara?

It’s worth asking: If Rails already supports system tests with RSpec and Capybara, why add another layer?

Let’s take a look at how the same scenario we saw earlier ("User sees book details and reviews") might look using RSpec system tests (assume FactoryBot is available and factories have been defined for all models):

```ruby
require "rails_helper"

RSpec.describe "Book show page", type: :system do
  let!(:book_one) { create(:book, title: "Book One", author: "Author A", published_year: 2001) }
  let!(:book_two) { create(:book, title: "Book Two", author: "Author B", published_year: 2002) }
  let!(:user1)    { create(:user, email: "user1@example.com", password: "password1") }
  let!(:user2)    { create(:user, email: "user2@example.com", password: "password2") }
  let!(:review)   { create(:review, book: book_one, user: user2, rating: 4, body: "Good read.") }

  before do
    sign_in user1
  end

  it "shows book details and existing reviews" do
    visit book_path(book_one)

    within("##{dom_id(book_one)}") do
      expect(page).to have_content("Book One")
      expect(page).to have_content("Author A")
      expect(page).to have_content("2001")
    end

    within('[data-testid="reviews-list"]') do
      review_item = all('[data-testid="review-item"]').find do |item|
        item.find('[data-testid="review-author"]').text == "user2@example.com" &&
        item.find('[data-testid="review-body"]').text == "Good read."
      end

      expect(review_item).not_to be_nil
      expect(review_item.find('[data-testid="review-rating"]').all('svg').size).to eq(4)
    end

    expect(page).to have_button("Submit Review")
  end
end
```

While the same concepts are being tested, it takes effort to understand what’s actually being tested. It’s not *terrible*, especially for developers familiar with Capybara, but it’s clearly written for the machine, not the human. You have to *parse* the `within`, `all`, and `find` blocks to reconstruct what’s going on. The intent: "show book details and reviews", is buried inside DOM selectors and test helpers.

This is where Cucumber shines. Instead of encoding all the implementation detail in the test body, Cucumber pushes that detail down into step definitions. The result is a high-level test that reads like documentation, which is ideal for stakeholders, QA, and even your future self.

It is possible to make RSpec system tests more readable using custom matchers, page objects, or helper methods. But these strategies can also add complexity or hide detail in other files. Cucumber, on the other hand, embraces the separation between intent and implementation from the start.

And the best part? You don’t have to throw out your existing Capybara setup to adopt it. Cucumber doesn’t replace Capybara, it wraps around it. The same drivers, selectors, and test helpers still apply. You're just giving your tests a better top layer.

## Setting Up Cucumber

In this section, we’ll walk through setting up Cucumber in an existing Rails project. We'll configure Cucumber to work with Capybara, Cuprite (for headless JavaScript testing), FactoryBot, Devise, and DatabaseCleaner.

### Installation

Start by updating the project's `Gemfile` under the `:test` group. Note that we’re opting for `cuprite` instead of the default `selenium-webdriver`:

```ruby
group :test do
  gem "capybara"
  gem "cuprite"
  gem "cucumber-rails", require: false
  gem "database_cleaner"
end
```

Then run:

```bash
bundle install
bin/rails generate cucumber:install
```

This creates a new `features/` directory with the following layout:

```
features/
├── your .feature files go here
├── step_definitions/
│   └── *_steps.rb files contain your step logic
└── support/
    ├── env.rb (auto-generated, do not modify)
    └── custom configuration (see below)
```

### Configure Browser Driver

Add `features/support/cuprite.rb`:

```ruby
require "capybara/cuprite"

Capybara.default_driver = :cuprite
Capybara.javascript_driver = :cuprite

Capybara.register_driver(:cuprite) do |app|
  Capybara::Cuprite::Driver.new(
    app,
    window_size: [1920, 1080],
    js_errors: true,
    headless: !ENV["VISIBLE_BROWSER"],
    timeout: 10,
    browser_options: {
      "no-sandbox" => nil # Required if running in Docker
    }
  )
end

Capybara.default_max_wait_time = 5
```

### Configure DatabaseCleaner

By default, Rails uses transactions to clean test data—but that doesn't work when your app and test code run in separate processes (like with JavaScript drivers). So we use truncation instead.

Create `features/support/database_cleaner.rb`:

```ruby
DatabaseCleaner.strategy = :truncation
```

This ensures a clean database state between scenarios.

### FactoryBot Integration

FactoryBot makes it easy to set up test data, and it works beautifully with Cucumber once wired in.

Add `features/support/factory_bot.rb`:

```ruby
World(FactoryBot::Syntax::Methods)
```

This makes methods like `create(:user)` available directly in your step definitions, no need to prefix with `FactoryBot.`

### Devise and Warden for Fast Login

Devise handles authentication in many Rails apps, and it uses Warden under the hood. Instead of clicking through login forms in every test, we can sign in programmatically.

Add `features/support/warden.rb`:

```ruby
Warden.test_mode!
World(Warden::Test::Helpers)

After { Warden.test_reset! }
```

Now you can use `login_as(user)` in your steps to simulate a logged-in session. This technique is much faster than logging in through the UI for each test (although you should have at least one test that does this to ensure the login form is working).

### Tidying Up Output

When you run your first Cucumber test, you might see a message about "publishing your results". If that’s not useful to you, you can silence it by editing `config/cucumber.yml`, which got generated during the instal step earlier:

```yml
std_opts = "--format #{ENV['CUCUMBER_FORMAT'] || 'pretty'} --strict --tags 'not @wip' --publish-quiet"
```

This also sets a few sensible defaults:

* `--strict` will fail the build on undefined or pending steps.
* `--tags 'not @wip'` skips work-in-progress scenarios unless explicitly tagged.

## Writing Your First Feature Test

* Walkthrough: A **simple but real scenario** from Book Review Demo
  *E.g. "Guest user can sign up" or "Logged-in user can visit books index"*
* Show the `.feature` file first (business-readable)
* Then show the step definitions file
* Emphasize readability and intent
* Show how to run it with `bundle exec cucumber`
* Tie back to RSpec comparison

## More Complex Feature: Tabular Inputs and Conditionals

* Scenario: Viewing books with review counts
  *Use Cucumber tables for test data*
* Scenario: User adds, edits, deletes a review
  *Demonstrate reusing step defs + JS confirm handling*
* Use `@javascript` tag, show working JS alert step
* Mention edge case planning (e.g. user can’t review twice)

## Organizing Step Definitions

* By feature? By concern? How to think about it
* Tradeoffs between generic steps and tightly scoped ones
* Examples of reusable steps (like checking content, logging in)
* Managing brittleness in selectors: where to use `within`, `data-testid`

## Optimizing Test Speed and Developer Experience

* Why you don’t want to go through the login UI every time
* Warden test helpers explained
* Using a visible browser vs headless mode
* VSCodium / VSCode Cucumber extension: autocomplete + step linking
* Screenshot-on-failure setup (optional but helpful)

## What Good Cucumber Coverage Looks Like

* Coverage philosophy: entire workflows, not isolated actions
* Walkthrough: One full workflow from the Book Review Demo
* Show CLI output of full run—how readable it is
* Benefits for QA and PMs in understanding what's covered

## Tips, Tradeoffs, and Edge Cases

* When not to use Cucumber (e.g. low-level logic)
* How to avoid writing fragile steps
* Testing authorization, edge flows, error states
* Debugging failing scenarios (visible mode, screenshots, `save_and_open_page`)

## Running Tests in CI

* Suggested setup (GitHub Actions example?)
* Headless mode considerations
* Storing screenshots as artifacts (optional)

## Cucumber + AI (Bonus Section)

* How AI can help (and hurt) when generating tests
* Example of a helpful AI prompt
* When to take over manually

## Conclusion

* Summary of benefits: clarity, communication, maintainability
* Final take: if you're writing system tests, Cucumber makes them *readable and enduring*
* Link to demo project
* Invite to share thoughts, fork project, or try it out

## TODO
* WIP main content
* show example step definition earlier in What is Cucumber section?
* why cuprite instead of selenium-webdriver (mention you could use selenium if you wish, Cucumber is agnostic to choice of browser driver)
* in "Configuring the Test Stack", explain that all files in support dir will be loaded, don't touch auto-generated support/env.rb because that may get modified on upgrades, instead, add all your own config in support/something.rb
* maybe some config sections need more explanations (see comments at top of each support file in demo project)
* link to factorybot docs for those not familiar
* assuming project is using Devise for user authentication, which uses Warden under the hood
  * what to do if not using this? for example rails 8 comes with simple user auth out of the box - does that also come with system test helpers?
* slightly more explanation about "publishing" - some built-in hosted feature cucumber provides but we're not using it
* debugging and non headless mode to see what's going on
* conclusion para
* edit
