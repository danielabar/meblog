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

If you’ve worked on a software development project of any significant complexity, you’ve probably observed that it always takes longer to deliver than the planned timeline. There are many reasons for this including (TBD: Get from Freakonomics Why Your Projects are Always Late episode). But today, I’d like to cover some things that developers can think about, to help in providing more realistic estimates. Developers when asked how long some new feature will take to build, are usually only thinking about the effort involved in writing the code to implement it.  But there is a large list of other items that need to get done to get said feature to production, but are often not included in estimates.

- Writing a detailed ticket description for this change - this is for business context - link to pitch or other requirements docs (depending on methodology: Scrum, ShapeUp, etc.), and explain how this code change relates to the requirement, i.e this is the Why? It’s tempting to just write a one-liner description (I’ve also seen plenty of tickets with a title but no description at all!) and quickly get into the coding. But remember, each commit message and the PR will be associated with the ticket. Future developers trying to understand this change will do git blame and lookup the ticket to get more details.
- verify it works locally (setting up data, might require updating seed data if there’s no easy way to exercise this scenario locally, running local services, jobs, etc.). For a monolith that runs entirely locally, this can be straightforward, but for micro services architecture, can be more complex, especially if the change relates to communication between services
- deal with surprises within the code - no matter how much tech analysis is done up front, there's always some surprising aspect of the code discovered as yo go in and start changing things.
- writing automated tests (unit, integration, end-to-end)
- adding engineering docs or other docs if needed
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
* intro para edit
* get some more commonly known reasons why things take longer
* maybe cover: when manager asks how long? picturing the feature working in production and customers can use it, developer when asked how long? how long it takes to type up the code
* expand each bullet point into para
* maybe something like: "what to do with all this information?" advice to devs - think about all this, advise to managers - not to be surprised by estimates that seem larger than you'd think even for a seemingly simple change
* conclusion para
