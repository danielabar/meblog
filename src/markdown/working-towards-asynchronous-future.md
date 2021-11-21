---
title: "Working Towards an Asynchronous Future"
featuredImage: "../images/work-async-jon-tyson-dm9EHhIZm-k-unsplash.jpg"
description: "TBD..."
date: "2021-12-05"
category: "career"
related:
  - "Is a Career in Software Development Right for You?"
  - "How to Learn New Things"
  - "Off with the Digital Distractions!"
---

I was inspired to write this after reading a post about how big tech companies organize their software engineering processes and the [curious absence of scrum](https://blog.pragmaticengineer.com/project-management-at-big-tech/) at these companies. While I don't work at a FAANG (or MAANA given some company renames!), I am fortunate to be working on a team where engineers are empowered to be self organizing, and try different ways of working to optimize for results, developer productivity, and overall quality of life.

To this end, our team has moved increasingly to an asynchronous work style and the results have been fantastic. This post will walk through why we decided to try this, how we're doing it, and address some common concerns.

## Background

But first, a little background. Our team is composed of three senior engineers (and looking for a fourth at the time of this writing), and a product manager. We also have an engineering manager who manages several teams. There is no QA as the product has a thorough suite of end-to-end tests that cover just about every feature and workflow. The product consists of several publicly accessible web apps, built with Rails and MySQL. Our team is in full control over the product direction, features to be added and tech debt that should be addressed. The code base is very large, having been developed and iterated on over 10 years.

We're part of a mid-sized company that delivers a number of other products and services. Prior to the pandemic, most people worked in office, with a few work-from-home days here and there. After the pandemic, the company went fully remote and will remain that way going forward.

Our team has never been big fans of the official scrum methodology, preferring a more kanban/flow approach to delivering features. So we were fairly light on the ceremonial meetings, but we did have some regular meetings including a daily standup and some planning meetings. We were also in the habit of "let's hop on a call" type meetings, for example to deal with a tricky production bug or figure out how a new feature should be integrated into the existing product.

This all came to a head one day when our manager seemed really stressed out in standup and remarked that he was in too many meetings. Since none of us were fans of meetings to start with (is any engineer really??), we decided right there and then to move standup to an async channel using Slack and to generally try and work more asynchronously. Although this wouldn't solve the issue of numerous other meetings our manager had, it could at least get rid of one of them.

## Remote !== Async

Some terminology to clarify before moving on. Sometimes the terms remote working and asynchronous working get used interchangeably but they're quite different.

Remote working is when the entire team is not co-located in a physical office, and instead is working from home or some other location such as a coffee shop. However, they are still required to all be online and working during official business hours, typically 9am - 5pm. Some companies may have a variation on this where everyone is required to be online during "core hours", say 10am - 4pm, then provide a little flexibility for those that wish to start and finish earlier, or start and finish later. For example an early bird may wish to start at 8am and finish at 4pm, whereas a night owl may prefer to start later in the morning at 10am and work into the evening, finishing at 6pm. This results in the majority of the teams work hours overlapping so it's easy to book meetings because there's an expectation that every one is available at the same times.

Asynchronous working is a whole other level of this. In addition to the team not being co-located, there is no expectation of overlapping work hours at all. Each team member picks their own working hours that suit them best. Furthermore, these hours don't have to be contiguous or the same times each day. For example, someone may find their optimal focus time is in the very early hours of the morning, then take the afternoon off for exercise, running errands, picking up kids from school etc. and then log back in later in the evening to complete some tasks. Someone else may prefer start around midday or later, and work late into the night because that's when they're at their most productive.

There can also be a spectrum, where a team may still want some real-time meetings such as weekly one on ones with managers, but the rest of the week everyone is free to manage their time however suits them. This is where our team has landed.

Now that the definitions are out of the way, how does a team go from everyone working more or less the same hours to async?

## Communication

One thing we realized in moving to async is that we would all have to hone our written communication skills. Not only can effective writing can replace a lot of meetings, there's also a benefit to the company in that decisions and discussions in a written format are easily accessible to everyone, not just whoever happened to participate in the meeting that day. This is also helpful to the team in an environment of shifting priorities, where people may not remember what was discussed in a meeting several months ago. When decisions are written down, this is no longer a problem.

Here are a few examples of the type of writing our team has been doing to reduce the need for all of us to be online at the same time. We try as much as possible to choose writing tools that support markdown, which is more developer friendly than WYSIWG editors, but that's just our team preference.

### Pull Requests

When a pull request is submitted for review, the developer writes a detailed description including what the new code does, what areas of the project were modified, and most importantly, step by step instructions for the reviewer how they can exercise the code. Our review process includes not just providing feedback on the code, but also having the reviewer check out the branch and try out the new feature or bug fix on their laptops.

This level of detail in the PR description eliminates the need for real-time chatter on Slack about the PR. And having the reviewer try it out means at least one other person besides the original developer gains an understanding of this feature beyond what merely scanning the code can provide.

### Project Docs

The main project `README.md` file contains project setup instructions which we strive to maintain whenever there's a change, such as some new configuration or external dependency required. The idea being that a new developer should be able to spin up a working dev environment without getting stuck and needing real time help from someone else on the team. If something is discovered that's missing from the setup instructions, then that's a great first PR for the new developer to submit to update the readme.

Further, whenever a new feature is added, we add or update the project documentation as part of the PR. This takes the form of markdown files in a `/docs` directory of the project, and a link to this doc from the `Further Reading` section of the main project `README.md` file. The benefit of maintaining these docs is it spreads the knowledge of each feature so if someone has a question, they can find the answer in the docs rather than requiring the original developer to be online to answer.

<aside class="markdown-aside ">
Even for a non async team, including docs with each PR is helpful because the original developer may be on vacation or have left the company, and this knowledge could otherwise be forever lost.
</aside >

### Jira

Hear me out, please don't close this tab. Jira is painful when used as a management tool. Like those dreaded sprint review meetings where the scrum master is closing out the sprint, and there's one lonely ticket in the Done column and all the others are scattered throughout the Not Started, In Progress, and In Review columns. Or when developers have to track actual hours vs estimate hours in Jira, shudder!

But our use of Jira is simply to use the epics to write down an overall goal, and the individual tickets within an epic serve as our todo list. We take care to write detailed descriptions in each ticket, including context and scope. We also take care to use links between tickets to identify dependencies. For a bug report, we include steps to reproduce and actual vs expected results. This way everyone knows the big picture, what everyone else is working on, and can pick up work without a planning meeting or any other real-time co-ordination.

### Slack Async

For simple question and answer communication, we use Slack but in an async fashion. Effectively this means there's no expectation of an immediately reply and we don't monitor whether someone's dot is green on Slack. We mostly disable notifications to make this type of communication less disruptive to focus time.

<aside class="markdown-aside">
Regardless of your team being async or not, it's a good idea to minimize notifications and other <a class="markdown-link" href ="https://danielabaron.me/blog/off-with-the-digital-distractions/">digital distractions</a> to get the most out of your focus time.
</aside>

### Wiki Adhoc Discussions

We use Github to host our project source, which also has a Wiki. If a team member has something they'd like to discuss that is a little more involved than a Slack question, they can add a page and write up a discussion topic in markdown, and then share it with the team via Slack. Then team members can update the document with their thoughts on the topic on their own time. This replaces the "let's hop on a call" type of meetings and has helped us resolve a number of issues. The benefit of this written approach over a real-time meeting is each developer can do some analysis on the code before piping in to the "conversation". This results in more accurate and thoughtful points being made.

The meeting equivalent of this is where some participants say says "umm... let me check...", clackety clack of keyboards, while other participants watch and wait. The async version of this has been more effective for our team and leaves a searchable artifact for ourselves and future team members.

### Architecture Decision Records

[ADR](https://adr.github.io/) is a more formal written document to be used when someone would like to propose a significant architectural decision or change to the project. It gets submitted as a markdown document in a PR, then team members can discuss via PR comments. This is a new format we're experimenting with so I can't yet comment on how effective its been.

What brought this about is since the project code is ~10 years old, we sometimes come across areas of the code where the original developer is long gone and it's not well understood why that particular implementation was chosen. There may have been a meeting at that time to discuss the approach, but of course, the conclusions of that meeting are forever lost. The idea with ADR docs is to generate discussion about proposed changes *and* have the the reasoning and final decisions captured in writing for posterity.

## Ownership

In addition to effective writing, another thing that's required to make async work is that each engineer has full ownership of their tasks. This means they are responsible for the entire feature end to end and have freedom to make all implementation decisions. This minimizes real time co-ordination with other engineers. For example, rather than splitting a feature into back end assigned to one engineer, and another gets the front end, one person would be responsible for the entire vertical slice.

This doesn't mean "cowboy" style coding, there's still room for questions and discussion as described in the previous section on writing, but we leave it to the engineer's judgement to decide if something is significant enough to require team input, or if its something they can make an "executive" decision on.

## Trust

Related to the ownership point, is trust. I don't think it would be possible for a team to work asynchronously without a high degree of trust. We trust that each team member is intrinsically motivated to move the project forward without any monitoring of their online status and that they can manage their time effectively to complete their tasks.

## Objections

This post is not to suggest that everyone should stop what they're doing and switch to this approach. If your team feels happy and productive working fixed hours and having regular meetings, then by all means, continue. But for those feeling burned out by all the meetings or open to exploring a more flexible way of working, you may have some concerns like "what about..." or "our team could never...". This next section will address some common concerns with async working.

TBD Objections

- Scrum ceremonies (standup, planning, grooming, retro)
  - Spirit of agile vs waterfall rebranding (reference AV's linkedin post)
- We don't have time to do all this writing
- I'm not a good writer
- Onboarding
- Social connection
- Manager says: How do I know people are really working
  - Gets back to trust...

### TBD Objection 1...

...

TBD Maybe belongs in Conclusion: What team does this work best for?
- Small team size *relative* to size of code base. Needs to be large enough that every developer can work on a feature without stepping on someone else's toes, otherwise, will need more real time co-ordination.
- Don't all have to be senior, but a recent graduate may require a little more real time guidance mentoring.
- Great for product and SAAS companies, may be more challenging to implement with project based consulting. Would have to sell each client on the idea.

## Conclusion

Our team has found a great deal of benefits from working asynchronously. The individual benefits include freedom to manage your own time, and arrange work around life rather than the other way around. Having a nearly clear calendar allows everyone to do their most important work whenever is optimal for them. The benefits also extend to the company. When everything important about a project is written down, this eliminates the "single point of failure" where all knowledge about a given area is in a single person's head. If that person goes on vacation or leaves the company, the rest of the team or even new team members can get up to speed.