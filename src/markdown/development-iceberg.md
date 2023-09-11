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

If you’ve worked on a software development project of any significant complexity, you’ve probably observed that it nearly always takes longer to deliver than the planned timeline. There are many reasons for this including incomplete initial understanding of requirements, salespeople providing unrealistic timelines to close a deal, and unforseen technical challenges.

This post will cover some additional factors that are within developers control, to help in providing more realistic estimates. When asked how long some new feature will take to build, developers are often focused on the effort to write the code, and maybe also the unit tests. However there are many other items that need to get done to get the feature released and into customers hands, but are often not included in estimates.

## Ticket Description

Some time needs to be spent in writing a useful description of what will be worked on in whatever ticketing system the project is using such as Jira, Gitlab, Trello etc. The purpose is to provide both business and technical context so everyone can understand why this change is being made, and what areas of the code are impacted. It should include how the planned code changes relate to the business requirement. On some teams this task is done by a product manager, but I've found its beneficial to have the developer write this, or at least contribute to it, to confirm their understanding. One option is to have the product person write the business part, then have the developer add some technical context. It doesn't need to be too detailed such as getting into the method and variable names.

The benefit of taking the time for this activity is that it provides traceability. That is, all the commit messages to version control will contain the ticket number. Then future developers reading the code will be able to go back to the ticket to understand why the changes were made. This will also help the PR (pull request) reviewer in getting a broader understanding of the code changes. It can be tempting to skip this part and write a quick one-liner in the ticket such as "fix search results", but this apparent time-savings is an illusion. Every person that goes back to try and understand what was done will have to spend extra time tracking down the original developer and/or product person to ask them questions or dig into the code or production logs. The total human time spent on this can be much greater than the additional time taken to write a useful description.

## Local Verification

This seems straightforward enough - given the developer has checked out the project to their laptop and has added some code, make sure the feature actually works. For a monolith with comprehensive seed data that covers all scenarios and easily configurable third party services that provide sandbox modes for development mode (eg: Braintree, Stripe, Mandrill, etc.), this can be true.

However, many projects are not structured this way. The existing seed data may be insufficient to cover the new feature being worked on. So either the developer needs to write some one-off scripts to setup some data, or (better) enhance the seed data so that everyone who resets their database can also cover this scenario.

Some projects rely on third party services that either do not support a sandbox mode, or the integration only works in a deployed environment with a particular url. If the feature being developed depends on this service, development can take longer because the developer needs to deploy their changes to the test environment in order to see them working "for real".

Another complexity can be when projects are broken down into microservices, but the boundaries between them are ambiguous, which can result in any given feature requiring changes to multiple services. This will take additional time as developer has to setup multiple projects and juggle multiple change sets and PRs.


## Test Automation

WIP...

- writing automated tests (unit, integration, end-to-end). This absolutely needs to be baked into the development time and not treated as a separate activity. Otherwise its tempting to break this up into a follow-on task as in "we're in such a hurry now, we'll catch up with the testing later when things are more calm". I've seen this movie before and it never ends well. There will never be a "good" time to write tests later. If the product/feature is successful, there will always be more and more work to be done.

## Engineering Docs

TOOD...

- adding engineering docs or other docs if needed

## Deployed Verification

TODO...

Test automation and verifying locally is good to increase confidence that the feature works. But it's also necessary to deploy it to a production-like environment to rule out surprises. Could even be some library that doesn't build/minify etc...

- deploy to a production-like environment and verify it works there

- clean up git commits (git interactive rebase - link to thoughtbot post) -  its useful for PR reviewer to see a coherent set of commits that tells a story of the development
- write PR description: provide technical context of the change, the approach you took, what you changed (not the detailed file names, but for example, changed the funding request job to add new information in the payload sent to Pro)
- write PR instructions for reviewer: whatever you did to verify it works locally, write this down as instructions so the reviewer can repeat your steps and exercise the modified code on their machine (link to my other posts about benefits of this)
- context shift while waiting for your PR to be reviewed, for example: find someone else's PR to review or start on another bugfix or feature that doesn't depend on the current work
- address PR review feedback.
- Merge PR and follow your company’s process (eg: auto deploy to staging? Need another PR to deploy to production?, monitor CI job?)
- Possibly do final smoke/sanity test in production if possible.
- Context shift: Deal with production fires or other support issues that arise from time to time (even if you're not primary support, there's always a chance an issue can get escalated to you if you're the only one that knows how something works or if support needs another pair of eyes on things).

## TODO
* WIP: expand each bullet point into para
* another benefit of writing ticket description: confirm shared understanding between technical and business folks
* maybe cover: when manager asks how long? picturing the feature working in production and customers can use it, developer when asked how long? how long it takes to type up the code
* maybe something like: "what to do with all this information?" advice to devs - think about all this when providing estimates, advise to managers - not to be surprised by estimates that seem larger than you'd think even for a seemingly simple change
* intro para edit
* conclusion para
