---
title: "Add Rubocop to an Existing Rails Project"
featuredImage: "../images/rubocop-mark-duffel-U5y077qrMdI-unsplash.jpg"
description: "Learn how to add Rubocop to an existing Rails project while keeping your sanity."
date: "2021-07-25"
category: "rails"
---

I love Rubocop! There are some that find it (and linters in general) annoying, even leading to git commit messages along the lines of "F@%#^!ng rubocop". But for me, coding with Rubocop is like having a wizard with the entire collective wisdom of the Ruby community sitting beside me, pointing out where improvements could be made, resulting in more idiomatic Ruby.

Before going any further, for those unfamiliar with what is Rubocop, from the [docs](https://github.com/rubocop/rubocop):

> RuboCop is a Ruby static code analyzer (a.k.a. linter) and code formatter. Out of the box it will enforce many of the guidelines outlined in the community Ruby Style Guide. Apart from reporting the problems discovered in your code, RuboCop can also automatically fix many of them for you.

Whenever starting a new Rails project, one of my first commits is to install and configure Rubocop, plus a few extensions for rules specific to Rails, performance, and thread safety. This keeps the code consistent and in line with best practices no matter how many developers are working on the project.

However, sometimes you may be working on a legacy project that was not started with Rubocop. In this case, it’s still valuable to bring it in, but there are some challenges. Given that the entire history of the project was developed without a linter, there will likely be many offences. Could be hundreds or more, and offences of all different types. It can be overwhelming to go through all the output. Some of these may be easy to fix like extra empty lines before an ending block, and some may be more difficult like reducing complexity of a method with too much branching logic. As always, any code changes may cause unintended bugs.

This post will walk you through a 4 step process for introducing Rubocop into an existing legacy project while minimizing the chances of breaking production, and maintaining your sanity. Some working knowledge of Rubocop is assumed. If you haven't used it before, go through the [intro docs](https://docs.rubocop.org/rubocop/1.18/index.html) and [basic usage](https://docs.rubocop.org/rubocop/1.18/usage/basic_usage.html).

## 1. Test Coverage

Before making any changes, verify the project has decent test coverage. This should include unit/model tests for business logic and database interactions, request tests for all exposed API endpoints and web/end-to-end tests (aka Acceptance tests) for all essential web flows. This last category of tests can be the most difficult and time consuming to setup but is essential before bringing in a linter on a legacy project. It’s not necessary to have every single user interaction covered by web tests, but at the very least, identify the most essential flows to your business and make sure these are covered. For example, for an e-commerce site, this might include search, add to cart, and checkout.

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

Just to get a sense of how many rule offenses are currently in the project, run:

```
bundle exec rubocop
```

You'll probably get multiple screen fulls of output scrolling past, with a summary such as (this is an example from a project from my recent experience with this):

```
96 files inspected, 270 offenses detected, 215 auto-correctable
```

At this point, it's hard to make sense of all the output or know where to start. To help organize all this, Rubocop has several format options, one of which is `--format offenses`. This will summarize how many occurrences of each rule violation it found, and order them by descending occurrence. For example:

```
bundle exec rubocop --format offenses

56   Layout/FirstHashElementIndentation
54   Layout/HashAlignment
18   Metrics/BlockLength
16   Metrics/MethodLength
16   Style/StringLiterals
14   Style/TrailingCommaInHashLiteral
13   Layout/LineLength
12   Layout/EmptyLinesAroundClassBody
8    Layout/SpaceInsideHashLiteralBraces
7    Layout/SpaceAfterComma
6    Layout/ExtraSpacing
6    Layout/SpaceInsideStringInterpolation
4    Layout/TrailingEmptyLines
4    Metrics/AbcSize
3    Layout/EmptyLinesAroundBlockBody
2    Layout/ArgumentAlignment
2    Layout/EmptyLinesAroundModuleBody
2    Layout/SpaceInsideArrayLiteralBrackets
2    Lint/SymbolConversion
2    Metrics/CyclomaticComplexity
2    Naming/VariableNumber
2    Style/IdenticalConditionalBranches
2    Style/IfUnlessModifier
2    Style/RedundantBegin
1    Layout/EmptyLineAfterGuardClause
1    Layout/EmptyLineAfterMagicComment
1    Layout/EmptyLines
1    Layout/SpaceInsideBlockBraces
1    Layout/TrailingWhitespace
1    Metrics/ModuleLength
1    Metrics/PerceivedComplexity
1    Naming/ConstantName
1    Style/AndOr
1    Style/MutableConstant
1    Style/RedundantParentheses
1    Style/RedundantReturn
1    Style/RedundantSelf
1    Style/SafeNavigation
1    Style/SymbolArray
--
270  Total
```

This seems like a lot of work to go through manually and fix all these. Luckily, Rubocop has an autocorrect option that will update the code to fix any offenses where the rule is auto-correctable. To see if a rule is auto-correctable or not, see the [Cops documentation](https://docs.rubocop.org/rubocop/1.18/cops.html). For example, from the above summary report, there are 56 occurrences of the `Layout/FirstHashElementIndentation` violation. According to the [docs](https://docs.rubocop.org/rubocop/1.18/cops_layout.html#layoutfirsthashelementindentation) for this rule, it supports autocorrection.

Now run Rubocop with the autocorrect flag, I'm using the "safe" version of this `-a` rather than "all" `-A`. Slight difference that some rules are autocorrectable, but not necessarily safe in they may change semantics of the code or generate false positives (detecting a rule offense when there is none really).

```
bundle exec rubocop -a
```

You'll see all the same scrolling output as before as it finds each rule violation, but this time it will also show `[Corrected]` beside all the ones that were auto corrected. At this point, there will probably be a lot of changed files. Review these changes with `git status` and `git diff` or git `difftool`, run tests, and if all the tests pass, commit the changes.

## 3. Inventory Remaining Offenses

At this point, all the easy fixes have been done. Now we're entering into trickier territory. Let's run the summary report again to see how many offenses are left to deal with. An example from a recent project:

```
rubocop --format offenses

19  Metrics/MethodLength
18  Metrics/BlockLength
13  Layout/LineLength
4   Metrics/AbcSize
2   Metrics/CyclomaticComplexity
2   Metrics/ModuleLength
2   Naming/VariableNumber
1   Lint/EmptyConditionalBody
1   Metrics/PerceivedComplexity
1   Naming/ConstantName
1   Style/MutableConstant
1   Style/SafeNavigation
--
65  Total
```

Well, this is a lot better than the 270 that we started with, autocorrect was able to reduce the offenses by ~75% on this project. But what to do about the remaining offenses? Notice these are areas of the code where potentially significant refactoring needs to be done which could break functionality.

For example `Metrics/MethodLength` refers to the number of lines in a method. According to the [docs](https://docs.rubocop.org/rubocop/1.18/cops_metrics.html#metricsmethodlength) for this rule, the default `Max` value is 10. Your project may have some big hairy methods that are way longer than this and difficult to break up in a meaningful way.

An even trickier one to deal with is `Metrics/AbcSize`. This [rule](https://docs.rubocop.org/rubocop/1.18/cops_metrics.html#metricsabcsize) calculates a score based on the number of assignments, branches (aka method calls), and conditions in a given method. The default `Max` value for this rule is 17. It can be difficult to reduce this score, it could be on some methods that are very complicated and not well understood. Perhaps the original developer that worked on it is no longer at the company and the tests aren't that helpful in explaining what the method does.

My approach when bringing in Rubocop is not to make any logical changes to the existing code. The Pull Request will already be quite large due to the easy auto-correctable offenses. It will be difficult for the PR reviewers scanning through all the changes to catch potentially breaking logical changes among all the trivial auto-corrected changes. There may also be differences among the team on how to approach the logical changes, while not requiring any discussion for the auto-corrected changes.

## 4. Tune Remaining Offenses

So how to get Rubocop to pass at this point? A naive approach is to simply disable all the remaining rules, for example, add to `.rubocop.yml`:

```yml
# .rubocop.yml
Metrics/MethodLength:
  Enabled: false

Metrics/AbcSize:
  Enabled: false

# etc for each rule that couldn't be auto-corrected
```

The problem with the naive approach is that there's nothing to stop the code quality from getting worse as more features are added to the project. For example, the next developer to work on a method with a high `AbcSize` score won't get a warning when they go to add another assignment to the offending method, and the next developer and the next after that. The complexity will keep increasing.

A better approach is to capture the existing maximum value for every rule, and configure that as the maximum allowed on this project. What this does is effectively draw a line in the sand to express - "yeah we know it's not great but at least things will get no worse". For example, suppose the longest method length in your project is 25 and you don't want it to get any worse than that in the future, then you'd add the following to `.rubocop.yml`:

```yml
# .rubocop.yml
Metrics/MethodLength:
  Max: 25
```

Then the next developer to modify this method, say to add a new feature or fix a bug will get a warning that the maximum has been exceeded. A refactor can be undertaken at that time, which will be more comprehensible in the scope of just that feature, rather than in the massive Rubocop pull request.

So the next question is - how do you go about finding the max violation values in the project? Clearly no one is going to go around manually counting method lengths or calculating `AbcSize` scores. Fortunately, Rubocop displays this information when detecting offenses.

For each of the rules that could not be auto-corrected, run rubocop, filtering the output for just that rule. For example, to see only the `Metrics/MethodLength` violations:

```
bundle exec rubocop | grep "MethodLength"

app/controllers/application_controller.rb:3:3: C: Metrics/MethodLength: Method has too many lines. [12/10]
app/controllers/base_acme_controller.rb:2:3: C: Metrics/MethodLength: Method has too many lines. [12/10]
app/controllers/endpoint_tester_controller.rb:20:3: C: Metrics/MethodLength: Method has too many lines. [26/10]
app/controllers/healthcheck_controller.rb:8:3: C: Metrics/MethodLength: Method has too many lines. [13/10]
lib/acme/client.rb:38:5: C: Metrics/MethodLength: Method has too many lines. [15/10]
lib/acme/endpoints/some_feature.rb:23:7: C: Metrics/MethodLength: Method has too many lines. [15/10]
lib/acme/endpoints/some_feature.rb:46:7: C: Metrics/MethodLength: Method has too many lines. [13/10]
lib/acme/endpoints/another_feature.rb:24:7: C: Metrics/MethodLength: Method has too many lines. [18/10]
lib/acme/endpoints/another_feature.rb:50:7: C: Metrics/MethodLength: Method has too many lines. [18/10]
lib/acme/endpoints/another_feature.rb:76:7: C: Metrics/MethodLength: Method has too many lines. [22/10]
lib/acme/endpoints/another_feature.rb:106:7: C: Metrics/MethodLength: Method has too many lines. [31/10]
lib/acme/endpoints/yet_another_feature.rb:23:7: C: Metrics/MethodLength: Method has too many lines. [13/10]
lib/acme/endpoints/yet_another_feature.rb:44:7: C: Metrics/MethodLength: Method has too many lines. [15/10]
lib/acme/endpoints/yet_another_feature.rb:67:7: C: Metrics/MethodLength: Method has too many lines. [14/10]
lib/acme/endpoints/yet_another_feature.rb:89:7: C: Metrics/MethodLength: Method has too many lines. [15/10]
lib/acme/endpoints/yet_another_feature.rb:112:7: C: Metrics/MethodLength: Method has too many lines. [13/10]
lib/acme/endpoints/yet_another_feature.rb:133:7: C: Metrics/MethodLength: Method has too many lines. [16/10]
lib/acme/endpoints/yet_another_feature.rb:157:7: C: Metrics/MethodLength: Method has too many lines. [15/10]
lib/acme/endpoints/yet_another_feature.rb:23:7: C: Metrics/MethodLength: Method has too many lines. [11/10]
```

Notice at the end of each line, there are two numbers shown in square brackets, for example `[15/10]`. The first number is the value count for this instance of the rule violation, the second number is the default or max configured value. So `[15/10]` means the method has 15 lines, but the maximum allowed is 10.

Looking at the above output, we can see that the maximum method length is 31. That's not great, but remember, we're not trying to optimize at this point, just prevent things from getting worse. So this would get added to `.rubocop.yml`:

```yml
# .rubocop.yml
Metrics/MethodLength:
  Max: 31
```

Repeat this for every rule that has a `Max` value that can be configured. For other rules such as `Naming/ConstantName` or `Style/SafeNavigation`, use your judgement if its just a small number of occurrences, and its easy to fix, go ahead, otherwise, disable the rule in `.rubocop.yml`.

At the end of this process, you should have some changes to `.rubocop.yml` and minimal if any code changes. Review the changes, run tests, and commit. Now you're ready to submit a pull request for adding Rubocop to a legacy project.

### Alternative: auto-gen-config

Just want to mention there is an alternative approach to this using `rubocop --auto-gen-config`. This will generate a `.rubocop-todo.yml` file listing all the offenses (indicating whether they are autocorrectable) and excluding the specific files in your project that violate the rules. It also generates the maximum values for rules that have a `Max` value.

Then it generates a `.rubocop.yml` that simply inherits from the todo file. This way rubocop passes with no code changes (because all the offenses are effectively ignored). The idea is you can go one offense at a time and deal with it. While it's great that the Max values are calculated, it seems like a lot of work to have to go through all the offenses one by one and remove them from the todo file so that autocorrect can do its work, or bring them to the global ignore list, or bring them over with modified config values to the main rubocop yml file. It is useful however to get a sense of the type and number of existing violations so go ahead and try the `--auto-gen-config` option to see what the output looks like.

## Conclusion

This post has covered a 4 step process for how to introduce Rubocop into a legacy project while avoiding a lot of manual effort, and minimizing the chances of breaking things.

The first step was to ensure good test coverage, especially end-to-end tests for flows that are essential to the business. The second step was to install Rubocop and use the safe auto-correct feature. The third step was to use the summary reporting feature to take an inventory of the remaining offenses. The fourth step was to tune each remaining offense to ensure that code quality will get no worse as the project moves forward.

I hope this will encourage others to bring in Rubocop into old legacy projects to start taking advantage of its many benefits.