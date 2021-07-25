---
title: "Add Rubocop to an Existing Rails Project"
featuredImage: "../images/rubocop-mark-duffel-U5y077qrMdI-unsplash.jpg"
description: "Learn how to add Rubocop to an existing Rails project while keeping your sanity."
date: "2021-07-25"
category: "rails"
---

I love Rubocop! This may be an unpopular opinion as some people find it (and linters in general) annoying. I've even seen commit messages along the lines of "F@%#^!ng rubocop". But for me, coding with Rubocop is like having a wizard with the entire collective wisdom of the Ruby community sitting beside me, pointing out where improvements could be made, resulting in more idiomatic Ruby.

Before going any further, for those unfamiliar with what is Rubocop, from the [docs](https://github.com/rubocop/rubocop):

> RuboCop is a Ruby static code analyzer (a.k.a. linter) and code formatter. Out of the box it will enforce many of the guidelines outlined in the community Ruby Style Guide. Apart from reporting the problems discovered in your code, RuboCop can also automatically fix many of them for you.

For example, Ruby has a modifier form of `if` (and `unless`) where if the statement and condition are short and doesn't require an `else` clause, it can be written in one line as `statement if condition`. Having come from languages that didn't have this feature, when I first started writing Ruby code, would always go for the multi-line version, and Rubocop would point out when the single line version could be used with the `Style/IfUnlessModifier` rule. Now I recognize where the more terse form can be used naturally as I'm coding.

Whenever starting a new Rails project, one of my first commits is to install and configure Rubocop, plus a few extensions for rules specific to Rails, performance, and thread safety. This keeps the code consistent and in line with best practices no matter how many developers are working on the project.

However, sometimes you may be working on a legacy project that was not started with Rubocop. In this case, it’s still valuable to bring it in, but there are some challenges. Given that the entire history of the project was developed without a linter, there will likely be many offences. Could be hundreds or more, and offences of all different types. It can be overwhelming to go through all the output. Some of these may be easy to fix like extra empty lines before an ending block, and some may be more difficult like reducing complexity of a method with too much branching logic. As always, any code changes may cause unintended bugs.

This post will walk you through a straight forward, 5 step process for introducing Rubocop into an existing legacy project while minimizing the chances of breaking production, and maintaining your sanity. Some working knowledge of Rubocop is assumed. If you haven't used it before, go through the [intro docs](https://docs.rubocop.org/rubocop/1.18/index.html) and [basic usage](https://docs.rubocop.org/rubocop/1.18/usage/basic_usage.html).

## 1. Test Coverage

Before making any further changes, verify the project has good test coverage. I'm specifically not mentioning a numeric percentage such as 80% because that can be gamed, for example, tests that exercise some code without making any meaningful verifications about the results. You'll want to have unit/model tests for all business logic and database interactions, request tests for all exposed API endpoints and web/end-to-end tests (aka Acceptance tests) for all essential web flows. This last category of tests can be the most difficult and time consuming to setup but is essential before bringing in a linter on a legacy project. It’s not necessary to have every single user interaction covered by web tests, but at the very least, identify the most essential flows to your business and make sure these are covered. For example, for an e-commerce site, this might include search, add to cart, and checkout.

## 2. Install Rubocop and Autocorrect

Add rubocop to the project Gemfile, then run `bundle install`. Then create a `.rubocop.yml` configuration file in the project root. I typically exclude Rails auto generated files and disable the `Style/Documentation` rule. Although I'm a huge fan of *useful* documentation, have found that when the `Style/Documentation` is enabled, developers may write comments like "Customer Model" for `class Customer < ApplicationRecord` just to get the rule to pass.

```yml
# .rubocop.yml
AllCops:
  NewCops: enable
  Exclude:
    - "db/schema.rb"
    - "Gemfile"
    - "lib/tasks/*.rake"
    - "bin/*"
    - "config/puma.rb"
    - "config/spring.rb"
    - "config/environments/development.rb"
    - "config/environments/production.rb"
    - "spec/spec_helper.rb"

Style/Documentation:
  Enabled: false
```

Now run Rubocop with the autocorrect flag, which will detect and automatically fix any rule violations where that rule supports auto correction and is safe, i.e. doesn't change semantics of the code:

```
bundle exec rubocop -a
```

At this point, there will probably be a lot of changed files. Review the changes, run tests, and if all pass commit the changes.

## 3. Inventory Remaining Offences