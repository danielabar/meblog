---
title: "Reflections on Effective Teams"
featuredImage: "../images/effective-teams.png"
description: "Reflecting on my years of experience as to what makes effective software delivery teams."
date: "2023-05-01"
category: "career"
related:
  - "Working Towards an Asynchronous Future"
  - "Maximize Learning from Screencasts"
  - "About Those Docs"
---

I was inspired to write this post after listening to a Software Engineering Radio podcast with guest Jon Smart on the subject of [Patterns and Anti-Patterns for Successful Software Delivery](https://www.se-radio.net/2022/12/episode-543-jon-smart-on-patterns-and-anti-patterns-for-successful-software-delivery-in-enterprises/). He discusses why "Agile Transformation" is an anti-pattern, the importance of focusing on outcomes rather than outputs, and avoiding one-size-fits-all solutions. He says the goal shouldn't be to "do agile", but rather introduces a new language of better (quality), sooner (time to value), safer (agile not fragile), and happier (customers, colleagues, citizens, clients).

Listening to this podcast made me reflect on my 20 years experience of software development on various project and product teams across different sized companies and industries in terms of what practices have made some teams more effective than others. In this post, I'll share practices I've experienced that have made teams effective.

## Definition

But first, what do I mean by an effective team? My definition of this term is a team that can continuously deliver working software that solves their customers problems, keeping the customers happy to keep on paying for the service, and spreading the good word.

The delivery of each release introduces little to no [regressions](https://en.wikipedia.org/wiki/Software_regression).

Equally important, an effective team consists of team members who communicate well with each other, feel satisfied and fulfilled in their work, and reasonably look forward to starting work each day.

Now that the definition is out of the way, the rest of this post will cover qualities that make effective teams.

## Product

An effective team starts with good product direction. The role of the person(s) that define this has changed names over the years, from Business Analyst, to Product Manager or Product Owner. I'll just refer to it as PM.

An effective team will have a PM that has a strong sense of product direction and can express clearly how different areas of the product should work and why. These features should be driven by what will solve the customers problems, ultimately generating revenue. The PM should also expect clarifying questions from engineers and consistently update written requirements to reflect those clarifications. This way all team members current *and* future can gain an understanding of why the product works the way it does.

Sometimes the product direction is not entirely clear. The company could be dealing with unknowns and engaging in research and experiments to determine market fit. A team can still be effective in this case if it's communicated clearly to all team members that they're dealing with unknowns. In this environment, people are encouraged to think creatively of potential solutions and to try things out, with the understanding that many features may not stick and have to be rolled back. i.e. no one is blamed if something doesn't work out because it all contributes to increased understanding.

The only style of product I've seen be ineffective is when there are a lot of unknowns, but the PM (or key business decision makers) doesn't seem to be aware that they don't know. In this case, when developers ask clarifying questions, the answers are still vague. Then developers will make their best guess. When the feature is delivered, its not what anyone expected, but no one can exactly explain why. This can lead to finger pointing where product blames developers for not meeting requirements and developers in turn saying the requirements weren't clear. This leads to constant frustration, stress and high turnover.

## Minimal Process

An effective team keeps the spirit of [agile](https://agilemanifesto.org/principles.html) alive, while not burying themselves under needless ceremonies and process. In my experience, this means keeping a focus on getting things done using a flow approach rather than a rigid methodology like Scrum.

There does need to be some process to avoid chaos, i.e. every day should not feel like a hack-a-thon, but it should not be a burden and should not be disrupting developer flow with regular meetings. This process could include:

* Breaking up large requirements into smaller items and entering these into a ticketing system to keep track of the work to be done, in priority order.
* Developers pick up tickets by assigning the next most important item in the list to themselves and starting a feature branch in version control with the ticket number and brief description in the branch name. Commit messages also include the ticket number.
* All code has automated tests at the appropriate level (from unit to end-to-end). Definitely investing in end-to-end testing to limit the need for manual QA (or only need it for things that can't be automated).
* Non-obvious things are included in [engineering documentation](../about-those-docs) as part of feature development.
* Linting is in place for consistent formatting and to prevent coding errors. Ideally linting has been added on day one of the project. [It can be added later](../markdown/add-rubocop-to-legacy-project), although that will be more effort.
* CI (Continuous Integration) runs on each commit to verify the build, lint rules and passing tests
* Developers submit PRs when their feature is ready for review, with [instructions to reviewer](../markdown/working-towards-asynchronous-future#pull-requests) how to exercise the code.
* Developers address feedback on their PRs, and when approved merge.
* If CI passes on the merge commit, CD (Continuous Deployment) kicks in and automatically deploys the code to production.
* Developers pick up next most important item, rinse and repeat.

<aside class="markdown-aside">
There's been a lot said about ticketing systems being four letter words and all that. It doesn't need to be this way. The ticketing system is simply a communication tool to help teams know what needs to be done and what's most important. It's not intended as a management tool to measure developers performance or to make developers spend any more time in it than necessary. Ideally the ticketing system is fully integrated with version control so that ticket status changes such as In Progress, In Review, and Done are applied automatically.
</aside>

## Culture of Writing

An effective team develops a culture of writing, both on the business and technical side.

On the business side, writing is used to capture the requirements and business rules, and also the *why* behind these. This could be tied to improved revenue generation or user experience. I've found its helpful for developers that are implementing the requirements to understand why a feature is being built a certain way.

On the technical side, [writing](../about-those-docs#what-to-document) is used to capture architectural proposals and decisions, project setup, common workflows through the application, troubleshooting tips, third party integrations, configuration, how to do deployments, how to exercise new code being added in a pull request, and anything else that helps developers onboard to a project.

These written documents are not intended as contracts where people can finger point later if something is not working. Rather, they are living documents to support collaboration, and are updated as questions and new information arises. Which leads me to...

This is one place where I differ from one of the Agile Manifesto principles which states:

> The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.

Relying primarily on face-to-face conversations:

* Results in a lot of scheduled or impromptu meetings that interrupting flow state.
* Requires co-incidence that everyone required to make a decision happens to be online at the same time. What if someone's out sick, vacation, appointment, works in a different timezone etc.
* Relies on people having perfect memories of what was discussed and decided in the conversation.
* Assumes that the best way to get people's input into decisions is via realtime conversation - this can result in "off the cuff" remarks that upon deeper technical analysis, may not turn out to be optimal.
* Can be prone to [loudest voice in the room](https://www.linkedin.com/pulse/loudest-voice-room-hisako-esaki/) effect where the more dominant personalities assert their opinions, and the quieter types that may have differing opinions don't feel comfortable challenging it or can't get a word in.

WIP:

Using written communication can improve team effectiveness:

...

This is not to suggest that face-to-face conversations are never needed...

## Small-ish Team Size

## Do the Simplest Thing That Works

## Vertical Development

## Automation

- linting
- testing
- CI/CD

## Psychological Safety

Definition from podcast: Ability to feel safe to ask questions, to challenge authority, to have your voice heard, to express your thoughts without fear of repercussion, without fear of being shot down or belittled. Ability to have open, vulnerable conversations with respect. Not having a blame culture. If something goes wrong, its not because someone did something wrong, it's because there was something in the system of work that enabled this thing to happen.

I would add: Not just feeling safe to ask questions and challenge authority, but for it to be encouraged.

Not assigning blame when something goes wrong, but looking to the process and how it can be improved to avoid this kind of error in the future.

## TODO
* Caveat - based on my experience, of course there are many more teams and companies I haven’t worked at that may have different lessons learned, your mileage may vary
* Where does effective communication (between engineers and between engineers and product) fit in?
* Does this fit somewhere? Focus on writing differs from original Agile Manifesto that emphasizes face-to-face conversations. The purpose of writing isn't to define a formal contract, rather, its to support product continuity in a world where tech workers come and go frequently. Relying primarily on face-to-face conversations generates a lot of institutional knowledge that only lives in peoples heads and is lost when people leave. Also it can be forgotten unless someone is willing to take on the role of secretary to diligently document the results of every single conversation.
* Traceability: Eg: Jira ticket can either have the requirements, or just high level and point to a Wiki/Confluence doc with more details. Every Git commit and PR should reference ticket number. Then future developers that are maintaining code can git blame, find the jira ticket, then find the detailed requirements to fully understand why the current code behaves as it does. They can also find the PR which should contain instructions about how to exercise that feature.