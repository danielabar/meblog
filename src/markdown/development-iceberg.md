---
title: "The Development Iceberg: Unseen Efforts That Extend Project Schedules"
featuredImage: "../images/dev-iceberg-alexander-hafemann-M-EwSRl8BK8-unsplash.jpg"
description: "Gain insights into the often underestimated unseen efforts, challenges, and factors that shape software development timelines."
date: "2024-02-01"
category: "productivity"
related:
  - "About Those Docs"
  - "Reflections on Effective Teams"
  - "Find Jira Tickets Faster"
---

If you’ve worked on a software development project of any significant complexity, you’ve probably observed that it nearly always takes longer to deliver than the planned timeline. There are many reasons for this including incomplete initial understanding of requirements, salespeople providing unrealistic promises to close a deal, and unforseen technical challenges.

But even if the scope and tech stack is well understood, and developers are empowered provide estimates rather than being imposed on by outside forces, things still take longer than expected. Why is that? This post will cover some additional factors that are often unaccounted for, but a crucial part of the process. When asked how long some new feature will take to build, developers are often focused on the effort to write the code, and possibly also the unit tests. However there are many other items that need to get done to get the feature released and into customers hands, but are often not included in estimates. Let's delve into some of these.

## Ticket Description

Some time needs to be spent in writing a useful description of what will be worked on in whatever ticketing system the project is using such as Jira, Gitlab, Trello etc. The purpose is to provide both business and technical context so everyone can understand why this change is being made, and what areas of the code are impacted. It should include how the planned code changes relate to the business requirement. On some teams this task is done by a product manager, but I've found its beneficial to have the developer write this, or at least contribute to it, to confirm their understanding and ensure everyone is on the same page. One option is to have the product person write the business part, then have the developer add some technical context. It doesn't need to be too detailed such as getting into the method and variable names.

The benefit of taking the time for this activity is that it provides traceability. That is, all the commit messages to version control will contain the ticket number. Then future developers reading the code will be able to go back to the ticket to understand why the changes were made. This will also help the PR (pull request) reviewer in getting a broader understanding of the code changes. It can be tempting to skip this part and write a quick one-liner in the ticket such as "add advanced search", but this apparent time-savings is an illusion. Every person that goes back to try and understand what was done will have to spend extra time tracking down the original developer and/or product person to ask them questions or dig into the code or production logs. The total human time spent on this can be much greater than the additional time taken to write a useful description before development starts.

## Local Verification

This seems straightforward enough - given the developer has checked out the project to their laptop and has added some code, make sure the feature actually works. For a monolith with comprehensive seed data that covers all scenarios and easily configurable third party services that provide sandbox modes for development mode (eg: Braintree, Stripe, Mandrill, etc.), this can be true.

However, many projects are not structured this way. The existing seed data may be insufficient to cover the new feature being worked on. So either the developer needs to write some one-off scripts to setup some data, or (better) take the time to enhance the seed data so that everyone who resets their database can also cover this scenario.

Some projects rely on third party services that either do not support a sandbox mode, or the integration only works in a deployed environment with a particular url. If the feature being developed depends on this service, development can take longer because the developer needs to deploy their changes to the test environment in order to see them working "for real".

Another complexity can be when projects are broken down into microservices, but the boundaries between them are ambiguous. This can result in any given feature requiring changes to multiple services. This will take additional time as developer has to setup multiple projects and juggle multiple change sets.

## Test Automation

This refers to all levels of test automation including unit, integration, *and* end-to-end. The effort to write these tests needs to be baked into the development time and not treated as a separate activity. Otherwise its tempting to break this up into a follow-on task as in "we're in such a hurry now, we'll catch up with the testing later when things are more calm". I've seen this movie before and it never ends well. There will never be a "good" time to write tests later. If the product/feature is successful, there will always be more and more work to be done and the team will regret not having thorough test automation, especially in the end-to-end category. End to end tests can be harder to write and do take time, but pay off in the ability to add new features and have confidence that all the existing features continue to work, without manual testing effort.

Another thing I've seen is sometimes the end-to-end tests are treated as someone else's responsibility such as the QA team. However, it's better for all testing activity to be part of the development lifecycle so issues can be caught early during development.

<aside class="markdown-aside">
This is not to suggest that QA is not needed, but it can be incorporated in terms of thinking of test cases, and then having the developer implement those test cases during development. A great tool for this is <a class="markdown-link" href="https://cucumber.io/">Cucumber</a>, which supports having the tests written in as close to "plain English" as possible. This means less technical team members such as QA or a product manager can contribute to the development of the test cases.
</aside>

## Engineering Docs

Another task that may be needed is adding or maintaining existing engineering documentation. For example, if the feature involves integrating with a third party service such as Stripe or Braintree, some documentation will be needed explaining how to obtain accounts, API keys, configure developer environments to work with either a sandbox or mock mode of these, how to configure production, access a dashboard or transaction details etc. The best time to write these docs is while the details are fresh in the developers mind, so they should be included as part of the PR in the form of markdown files in the `/docs` project directory. See my other post [About Those Docs](../about-those-docs) for everything you need to know about engineering documentation.

## Deployed Verification

While its great to have thorough automated test coverage, it's also important to try out the code "for real" in a deployed environment. Ideally there are a few other environments besides production (eg: dev, qa, staging, etc.) for developers to deploy their branches to and make sure it works in a production-like environment. This is also a good opportunity to have the product manager or other team members try it out and provide feedback. This could include QA if manual QA is being used on the project.

Time needs to be allocated to this, not just for the actual deployment and verification, but for the inevitable environment issues that may arise and require troubleshooting. Issues such as different environments may have different configuration, a networking issue may prevent access to a service that worked fine from the developers laptop, may realize that additional logs are needed for debugging, etc.

To the extent that manual QA is being used on the project, this may result in some back and forth between QA and developer with some more code being written to address issues found by QA. Again, this is more time.

## Git Cleanup

For this section, I'm assuming [Git](https://git-scm.com/book/en/v2) is being used for version control but this could apply to any version control system. Since it's a good practice to commit early and commit often, during development, there will inevitably be a lot of [stream of consciousness](https://en.wikipedia.org/wiki/Stream_of_consciousness) commit messages to the feature branch such as:

```
* fixing things
* rubocop
* model wip
* something or other...
```

Prior to submitting work for review, it's beneficial to take the time to reorganize and clean these up so that the set of commits tells a coherent story of the development. This is also a good time to ensure each commit message has the associated ticket number. The result will be helpful for the reviewer to understand how the feature came together and for future developers running `git blame`. For example:

```
* [ACME-123] Create database schema and model for user profiles
* [ACME-123] Implement user authentication and registration
* [ACME-123] Add end-to-end tests for user authentication and registration
* [ACME-123] Update documentation for user management
```

<aside class="markdown-aside">
If you've never reorganized your git commits, see this excellent explainer from Thoughtbot on <a class="markdown-link" href="https://thoughtbot.com/blog/git-interactive-rebase-squash-amend-rewriting-history/">interactive rebase</a>, which can guide you through this process.
</aside>

## Pull Request

Code can't just be pushed from a developers laptop to production, it first has to be reviewed with a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) (PR). The process of creating a PR seems easy enough, especially if you're using Github and the [gh](https://cli.github.com/) command line utility. It can be as fast as typing `gh pr create` in your terminal and hitting <kbd class="markdown-kbd">Enter</kbd> a few times to accept the defaults. However, a PR with only the branch name as the title and a one-liner description such as "added user authentication" is insufficient for an effective code review.

There are two important sections that the developer submitting the PR needs to take the time to write:

**Description:** This covers technical details of the change, such as the overall approach that was taken, any architectural decisions made, and explanations of complex logic or algorithms. Include interesting details you'd like to draw the reviewer's attention to, such as performance optimizations, departure from conventions, or difficult challenges and trade-offs that were encountered during development.

**Try it out:** This section is to provide step-by-step instructions for the reviewer, how they can checkout the branch and exercise the code changes on their laptop. Essentially whatever steps the original developer took to verify the feature works should be repeatable by the reviewer. This can catch some "works on my machine" issues. In my experience, following this process has caught many more issues than simply scanning the code changes in the PR. It's also a useful historical reference for future developers maintaining this code, to know how it can be exercised.

## Context Shift

While waiting for their pull request to be reviewed, the developer needs to switch to another task, such as picking up someone else's code to review, or working on a small bugfix or technical debt item that doesn't depend on the current work awaiting review. When the feedback does come in on their PR, then another context shift is necessary to address the comments, and make further code changes if necessary. Another source of context shifting can be if an urgent production issue arises, or priorities change and the developer needs to switch to a different, now more important task.

All of these activities take additional time, and depending on how busy the team is, it could take a few days or more to receive feedback on the PR, address it, then have the reviewer go over it again.

## Final Push

After the code review feedback has been addressed and the PR approved, the developer needs to merge the PR, and follow the procedure to get the code into production. Ideally a [CI/CD](https://en.wikipedia.org/wiki/CI/CD) pipeline is in place to automate this activity, but there could still be some effort involved such as monitoring the deployment job, verifying the feature in production, and checking production logs to ensure all is well.

## Conclusion

So what to do with all this information? It's important to remember than when a manager is asking how long a feature will take, they really mean how many days between today and the day the feature is in production and customers are able to use it. This post has covered many other activities besides writing the code that are needed for this to happen. If you're a developer, keep these in mind when providing estimates. If you're a manager, also keep this in mind when you hear the estimates, that it covers a lot more than just implementation.
