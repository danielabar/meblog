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

## Introduction

* Motivation for the post: Why this matters in long-lived projects
* The problem with regressions and unreadable tests
* Brief intro to the demo app (Book Review Demo)

## What Is Cucumber

* Business-readable specs, not a browser driver
* Gherkin syntax: Features, Scenarios, Given/When/Then
* How it layers on top of Capybara and your app’s browser automation stack
* Who benefits: Not just devs—product managers, QA, and future-you

## Why Not Just RSpec + Capybara?

* Common complaints: brittle selectors, unreadable tests
* Code example: RSpec system test that’s hard to parse
* Lipstick-on-a-pig patterns: page objects and custom matchers
* Transitioning to Cucumber: it’s a wrapper, not a rewrite

## Setting Up Cucumber in a Rails Project

* Show Gemfile changes and generator
* Explain the file structure in `features/`
* `features/support`: what goes here and why

  * Capybara/Driver config (Cuprite)
  * DatabaseCleaner strategy
  * Warden/Devise setup
  * FactoryBot integration
* `config/cucumber.yml` and silencing noise

## Writing Your First Feature Test

* Walkthrough: A **simple but real scenario** from Book Review Demo
  *E.g. "Guest user can sign up" or "Logged-in user can visit books index"*
* Show the `.feature` file first (business-readable)
* Then show the step definitions file
* Emphasize readability and intent
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
* intro para
* main content
* conclusion para
* edit
