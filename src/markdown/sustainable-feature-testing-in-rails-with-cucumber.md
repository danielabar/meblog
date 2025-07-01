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

Long-lived web applications need end-to-end tests, also known as system or browser-based tests. These tests need to ensure *correct* behaviour, but also be *communicative*. System tests simulate real user behavior, verifying full-stack workflows through the UI. But as a project grows, traditional system tests can become hard to read and harder to maintain, especially when the test code obscures *what* is being tested behind *how* it’s implemented.

That’s where [Cucumber](https://cucumber.io/) comes in. By separating high-level intent from low-level implementation, Cucumber lets you write tests in plain language that developers, product managers, and future-you can all understand at a glance. In this post, I’ll walk through examples from a Rails app I built, the [Book Review Demo](https://github.com/danielabar/book_review_demo), to show how Cucumber can make your test suite more readable, maintainable, and enduring.

## What Is Cucumber

Cucumber is a testing tool that lets you describe application behavior in plain language. Unlike tools such as Capybara or Selenium, which control the browser directly, Cucumber sits *above* your browser automation stack. Its job isn’t to drive the browser, but to express what you want to test in a way that anyone on your team, technical or non technical, can read and understand.

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

It’s worth asking: If Rails already supports system tests with RSpec and Capybara, why add another layer? Let’s take a look at how the same scenario we saw earlier ("User sees book details and reviews") might look using RSpec system tests (assume FactoryBot is available and factories have been defined for all models):

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

While the same concepts are being tested, it takes effort to understand what’s actually being tested. It’s not *terrible*, especially for developers familiar with Capybara, but it’s clearly written for the machine, not the human. You have to *parse* the `let`, `within`, `all`, and `find` blocks to reconstruct what’s going on. The intent: "show book details and reviews", is buried inside DOM selectors and test helpers.

This is where Cucumber shines. Instead of encoding all the implementation detail in the test body, Cucumber pushes that detail down into step definitions. The result is a high-level test that reads like documentation, which is ideal for stakeholders, QA, and even your future self.

<aside class="markdown-aside">
It is possible to make RSpec system tests more readable using custom matchers, page objects, or helper methods. But these strategies can also add complexity or hide detail in other files. Cucumber, on the other hand, embraces the separation between intent and implementation from the start.
</aside>

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

This creates a new `features/` directory as shown below:

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

Cucumber itself is agnostic about how your tests interact with the browser - it just runs your scenarios and delegates the actual browser automation to whatever tool you choose. In Rails projects, a popular choice is [Capybara](https://github.com/teamcapybara/capybara), which provides a unified API for driving different browser engines.

Here, we configure Capybara to use [Cuprite](https://github.com/rubycdp/cuprite), a fast, modern driver for Chrome/Chromium. Cuprite is often more reliable and faster for JavaScript-heavy Rails apps than the default Selenium driver, but you could use Selenium or another driver if you prefer—Cucumber doesn't care which one you pick.

The configuration below sets Cuprite as the default driver for both regular and JavaScript-enabled tests. It enables headless mode by default (unless you set `VISIBLE_BROWSER`), sets a large window size for consistent screenshots, and includes a Docker-friendly option.

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

By default, Rails uses transactions to clean test data, but that doesn't work when your app and test code run in separate processes (like with JavaScript drivers). So we need to configure truncation instead.

Create `features/support/database_cleaner.rb`:

```ruby
DatabaseCleaner.strategy = :truncation
```

This ensures a clean database state between scenarios.

### FactoryBot Integration

FactoryBot makes it easy to set up test data, and it works beautifully with Cucumber once configured.

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

Suppose we want to test the login flow in our Book Review Demo app. Let’s start by looking at what the user actually sees:

![cucumber book review demo app login](../images/cucumber-book-review-demo-app-login.png "cucumber book review demo app login")

A user enters their credentials and clicks “Log in.” If the login is successful, they’re redirected to the landing page, and the navigation bar updates to show their email address:

![cucumber book review demo app signed in](../images/cucumber-book-review-demo-app-signed-in.png "cucumber book review demo app signed in")

Let’s see how we can express this workflow as a Cucumber feature test. The goal is to describe the scenario in plain language, just as a product manager or QA might:

```
# features/authentication.feature
Feature: User authentication

  Scenario: User logs in with valid credentials
    Given a user exists with email "user@example.com" and password "password"
    When I visit the login page
    And I fill in "Email" with "user@example.com"
    And I fill in "Password" with "password"
    And I click "Log in"
    Then I should see "Signed in as user@example.com" in the navigation bar
    And I should see a "Logout" button
```

A feature file starts with a `Feature` block, which describes a high-level capability or area of your application (for example, “User authentication” or “Book reviews”). Each feature file can contain multiple `Scenario` blocks, each representing a specific user story or test case within that feature.

Each line in the `Scenario` maps to a Ruby method called a "step definition". These live in files under `features/step_definitions/`.

The `Given` keyword is used to set up the initial state for your scenario. This might mean creating test data, configuring the environment, or ensuring the application is in a known state before the user takes any actions.

Here’s what the step definitions for the above scenario might look like:

```ruby
# features/step_definitions/authentication_steps.rb

Given("a user exists with email {string} and password {string}") do |email, password|
  create(:user, email: email, password: password) # FactoryBot
end

When("I visit the login page") do
  visit new_user_session_path
end

When("I fill in {string} with {string}") do |field, value|
  fill_in field, with: value
end

When("I click {string}") do |button|
  click_button button
end

Then("I should see {string} in the navigation bar") do |text|
  within("nav") { expect(page).to have_content(text) }
end

Then("I should see a {string} button") do |text|
  expect(page).to have_button(text)
end
```

**Notes:**

- You can use any Ruby code, including Capybara matchers and Rails helpers inside the step definitions.
- The `{string}` placeholders let you reuse steps for different values.
- In addition to `{string}`, step definitions can match on several other [types](https://github.com/cucumber/cucumber-expressions?tab=readme-ov-file#parameter-types)
- If the built-in types aren't enough for your use case, you can write a [custom type](https://github.com/cucumber/cucumber-expressions?tab=readme-ov-file#custom-parameter-types)

To run this feature test:

```bash
# Run a specific feature test
bundle exec cucumber features/authentication.feature

# Run all feature tests
bundle exec cucumber
```

Cucumber will print each step as it runs, showing which Ruby file and line number implements it. If all steps pass, you’ll see a summary at the end. For example:

```
Feature: User authentication

  Scenario: User logs in with valid credentials                               # features/demo_auth.feature:3
    Given a user exists with email "user@example.com" and password "password" # features/step_definitions/authentication_steps.rb:9
Capybara starting Puma...
* Version 6.6.0, codename: Return to Forever
* Min threads: 0, max threads: 4
* Listening on http://127.0.0.1:56341
    When I visit the login page                                               # features/step_definitions/authentication_steps.rb:27
    And I fill in "Email" with "user@example.com"                             # features/step_definitions/authentication_steps.rb:41
    And I fill in "Password" with "password"                                  # features/step_definitions/authentication_steps.rb:41
    And I click "Log in"                                                      # features/step_definitions/authentication_steps.rb:1
    And I should see "Signed in as user@example.com" in the navigation bar    # features/step_definitions/authentication_steps.rb:53
    And I should see a "Logout" button                                        # features/step_definitions/authentication_steps.rb:13

1 scenario (1 passed)
7 steps (7 passed)
```

**What's happening under the hood?**

- **Feature files** describe *what* should happen, not *how*.
- **Step definitions** translate those plain-language steps into Ruby code that interacts with your app (using Capybara, FactoryBot, etc.).
- You can mix and match `Given`, `When`, `Then`, and `And` in both your feature files and step definitions—Cucumber matches them by the text, not the keyword.

## More Complex Feature: Tabular Inputs and Conditionals

Now that we've seen a simple scenario, let's cover something a little more involved...

* Scenario: Viewing books with review counts
  *Use Cucumber tables for test data*
* Scenario: User adds, edits, deletes a review
  *Demonstrate reusing step defs + JS confirm handling*
* Use `@javascript` tag, show working JS alert step
* Mention edge case planning (e.g. user can’t review twice)
* Ref: DataTables: https://www.jakubsobolewski.com/cucumber/articles/reference-gherkin.html#data-tables

## Organizing Step Definitions

* By feature? By concern? How to think about it
* Tradeoffs between generic steps and tightly scoped ones
* Examples of reusable steps (like checking content, logging in)
* Managing brittleness in selectors: where to use `within`, `data-testid` (this applies to browser testing in general, not Cucumber specific so the same best practices apply when using Cucumber)

## Optimizing Test Speed and Developer Experience

* Why you don’t want to go through the login UI every time
* Warden test helpers explained
* Using a visible browser vs headless mode
* VSCodium / VSCode Cucumber extension: autocomplete + step linking
* Screenshot-on-failure setup (optional but helpful), see: https://cucumber.io/docs/guides/browser-automation#screenshot-on-failure

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
* ref link to page object pattern in aside
* show example step definition earlier in What is Cucumber section?
* in section where introducing cuprite, state why cuprite instead of selenium-webdriver (mention you could use selenium if you wish, Cucumber is agnostic to choice of browser driver) - could be an aside its not the main topic
* in "Configuring the Test Stack", explain that all files in support dir will be loaded, don't touch auto-generated `support/env.rb` because that may get modified on upgrades, instead, add all your own config in support/something.rb
* maybe some config sections need more explanations (see comments at top of each support file in demo project)
* link to factorybot docs for those not familiar
* assuming project is using Devise for user authentication, which uses Warden under the hood
  * what to do if not using this? for example rails 8 comes with simple user auth out of the box - does that also come with system test helpers?
* somewhere explain that When/Then/And can be mixed/matched between feature and steps (i.e. a Then in feature can match And in steps)
* re-org common steps out of authentication_steps.rb into common_steps.rb - organization advice: start with specific 1-1 steps file per feature file, as you develop more tests and discover common steps, extract to something like common_steps.rb
* slightly more explanation about "publishing" - some built-in hosted feature cucumber provides but we're not using it
* debugging and non headless mode to see what's going on
* cucumber is not just for Ruby/Rails projects, has drivers for other languages including Java, ... find ref link: https://cucumber.io/docs/installation/
* conclusion para
* edit
* somewhere link cucumber for ruby gem: https://github.com/cucumber/cucumber-ruby/tree/main
* Is this already linked somewhere? https://cucumber.io/docs/
* The diagram in https://cucumber.io/docs/#what-are-step-definitions could be useful?
* Hmmm organization by domain concept: https://cucumber.io/docs/guides/anti-patterns#how-to-decouple-steps--step-definitions
  * But I like to start with one steps file per feature test, then extract to common steps as shared steps "reveal" themselves
* target audience/assumptions: familiar with rails and system/feature testing in general (at least had some experience), but new to Cucumber.
