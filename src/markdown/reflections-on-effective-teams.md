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

Listening to this podcast made me reflect on my many years experience of software development on various project and product teams across different sized companies and industries in terms of what practices have made some teams more effective than others. In this post, I'll share practices I've experienced that have made teams effective.

## Definition

But first, what do I mean by an effective team? My definition of this term is a team that can continuously deliver working software that solves their customers problems, keeping the customers happy to keep on paying for the service, and spreading the good word.

The delivery of each release introduces little to no [regressions](https://en.wikipedia.org/wiki/Software_regression).

Equally important, an effective team consists of team members who communicate well with each other, feel satisfied and fulfilled in their work, and reasonably look forward to starting work each day.

Now that the definition is out of the way, the rest of this post will cover qualities that make effective teams.

<aside class="markdown-aside">
There are of course, many more projects and teams in this world that I haven't worked on than those I have, so all the practices suggested in this post are based only on my experience. There could be other practices that I've missed that are also effective, and some of my suggestions may not work for all teams. Your mileage may vary.
</aside>

## Product

An effective team starts with good product direction. The role of the person(s) that define this has changed names over the years, from Business Analyst, to Product Manager or Product Owner. I'll just refer to it as PM.

An effective team will have a PM that has a strong sense of product direction and can express clearly how different areas of the product should work and why. These features should be driven by what will solve the customers problems, ultimately generating revenue. The PM should also expect clarifying questions from engineers and consistently update written requirements to reflect those clarifications (more on writing later in this post). This way all team members current *and* future can gain an understanding of why the product works the way it does.

Sometimes the product direction is not entirely clear. The company could be dealing with unknowns and engaging in research and experiments to determine market fit. A team can still be effective in this case if it's communicated clearly to all team members that they're dealing with unknowns. In this environment, people are encouraged to think creatively of potential solutions and to try things out, with the understanding that many features may not stick and have to be rolled back. i.e. no one is blamed if something doesn't work out because it all contributes to increased understanding.

The only style of product I've seen be ineffective is when there are a lot of unknowns, but the PM (or key business decision makers) doesn't seem to be aware that they don't know. In this case, when developers ask clarifying questions, the answers are still vague. Then developers will make their best guess. When the feature is delivered, its not what anyone expected, but no one can exactly explain why. This can lead to finger pointing where product blames developers for not meeting requirements and developers in turn saying the requirements weren't clear. This leads to constant frustration, stress and high turnover.

## Minimal Process

An effective team keeps the spirit of [agile](https://agilemanifesto.org/principles.html) alive, while not burying themselves under needless ceremonies and process. In my experience, this means keeping a focus on getting things done using a flow approach rather than a rigid methodology like Scrum. A small(ish) team of intrinsically motivated people with solid written communication skills and autonomy over the entire stack can get a lot done with a minimum of process and meetings.

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
There's been a lot said about ticketing systems being four letter words and all that. It doesn't need to be this way. The ticketing system is simply a communication tool to help teams know what needs to be done and what's most important. It's not intended as a management tool to measure developers performance or to make developers spend any more time in it than necessary. Ideally the ticketing system is fully integrated with version control so that ticket status changes such as In Progress, In Review, and Done are applied automatically as developers start pushing to branches, submit PRs, and merge.
</aside>

## Traceability

How often has it happened that you're looking at a particular section of code and wondering "What does this even do?" or "How did this ever work?". Since developers spend more of their time reading code others wrote rather than writing brand new code, traceability is needed for effectiveness. Traceability refers to being able to answer questions like "what does this do?" by following a path from every line of code, to the business requirements that necessitated it, *and* to the PR (pull request) where this code got merged into the main branch for more technical context.

In order to achieve this, all changes to the code (except for very simple adhoc work such as fixing a typo in the docs) should be associated with a ticket number in the ticketing system. This ticket should contain the business requirements in the case of a new feature, or for a bug, it should contain the steps to reproduce with actual vs expected results.

When developers commit their code, the commit message should include the ticket number. Furthermore, the ticketing system should be integrated with the system where the code is hosted (eg: Github, Gitlab, etc.). This means that when a PR is created for this ticket, the ticketing system automatically updates the ticket with a link to the PR.

Now when the developer is looking at any line of code, they can run `git blame` to see the commit message and associated ticket number. Then they can [open the ticket](../find-jira-tickets-faster) to understand the business context around this code. From the ticket, they can follow through to the PR, and read the technical context in the PR description, and also the step by step instructions how to exercise the code (which should be part of the PR description).

## Culture of Writing

An effective team develops a culture of writing, both on the business and technical side.

On the business side, writing is used to capture the requirements and business rules, and also the *why* behind these. This could be tied to improved revenue generation or user experience. I've found its helpful for developers that are implementing the requirements to understand why a feature is being built a certain way.

On the technical side, [writing](../about-those-docs#what-to-document) is used to share knowledge and expertise to level up all team members, current and future. This includes architectural proposals and decisions, project setup, common workflows through the application, troubleshooting tips, third party integrations, configuration, how to do deployments, how to exercise new code being added in a pull request, and anything else that helps developers understand how the project works.

These written documents are not intended as contracts where people can finger point later if something is not working. Rather, they are living documents owned by the entire team. They support collaboration and team continuity, and are updated as questions and new information arises. Here is where I differ from one of the Agile Manifesto principles which states:

> The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.

Relying primarily on face-to-face conversations:

* Results in a lot of scheduled or impromptu meetings that interrupt flow state.
* Requires co-incidence that everyone required to make a decision happens to be online at the same time. What if someone's out sick, vacation, appointment, works in a different timezone etc.
* Relies on people having perfect memories of what was discussed and decided in the conversation.
* Assumes that the best way to get people's input into decisions is via realtime conversation - this can result in "off the cuff" remarks that upon deeper technical analysis, may not turn out to be optimal.
* Can be prone to [loudest voice in the room](https://www.linkedin.com/pulse/loudest-voice-room-hisako-esaki/) effect where the more dominant personalities assert their opinions, and the quieter types that may have differing opinions don't feel comfortable challenging it or can't get a word in.
* Results in a lot of knowledge that only lives in people's heads, and gets lost as people leave.

Using written communication can improve team effectiveness by:

* Minimizing interruptions - developers can review proposals or questions others may have when its an optimal time for them.
* Asynchronous nature of responding to written communication means the team can be distributed and can still function even when people have different schedules or personal matters to attend to. i.e. work can revolve around life rather than life needing to revolve around work.
* Leaves a written artifact of discussions and decisions. No more "What was that we decided in the meeting last week?" or "Why was tool X over Y chosen to solve this problem?".
* Captures everyone's feedback because everyone has an opportunity to contribute to a shared document or via comments.
* Contributes to a shared understanding, not just the current team members, but future team members. i.e. as the usual churn of tech workers coming and going happens, the project can still continue smoothly because important decisions have been captured in writing.

## Meetings

The previous section on writing is not to suggest that face-to-face conversations are never needed. There could be a tricky issue that's gone back and forth in comments in a document or PR and isn't getting resolved. Or some people think better "out loud" and sometimes need to bounce ideas off a few other people. An effective team will support all types of thinkers. So if a meeting is needed, here's how to get the most out of the precious time:

**Keep it brief:** Set the default meeting time to 30 minutes in whatever calendar/scheduling tool the company is using. If you think you'll need longer, bump it up to 45 minutes, but try not to go over an hour. In my experience, people lose their focus beyond this, and if the issue hasn't been resolved in an hour, dragging it on any longer doesn't help.

**Limit attendees:** The entire team is not needed at every meeting. For example, if two people are having a strong difference of opinion over a technical proposal, only those two, plus maybe the team lead or manager should be required. Other team members can be marked as optional. It's not always the case that every team member has a strong opinion, for these folks, not interrupting them and letting them get on with their work may be best.

**Have a goal:** Include a goal in the meeting description. This is different from an agenda, which is simply a list of items to be discussed. You could have a list of points that even after discussion, doesn't move the team forward. A goal on the other hand is very specific. For example: "At the end of this meeting, we will have a decision on whether we will be using either RabbitMQ or Kafka for messaging". Or "The purpose of this meeting is to finalize the design for the search results page".

**Come prepared:** The meeting description should include pointers to documents/discussion that has happened prior, so all attendees can be fully up to speed before the meeting starts. In the case of a technical decision, this could be a link to an [ADR](../about-those-docs/#architecture-decision-records) and/or related PR comments. In the case of a UI/UX decision, it could be pointers to the Figma document (or whatever design tool is being used).

**Update docs:** Update the referenced documents during the meeting as decision(s) are being made. This way there's no issue of forgetting what was decided or having to be a secretary later transcribing what people said. Finally, at the conclusion of the meeting, share/publish the decision to make it visible to the entire team.

<aside class="markdown-aside">
Shopify has gone as far as <a class="markdown-link" href="https://www.forbes.com/sites/jenamcgregor/2023/01/03/shopify-is-canceling-all-meetings-with-more-than-two-people-from-workers-calendars-and-urging-few-to-be-added-back/?sh=61950fd6fe8a">cancelling all recurring meetings involving two or more people</a>. Perhaps once a company gets to a large enough size, a top-down edict like this is needed. My suggestion is to consider what problem you're trying to solve by booking a meeting, and then see if there's an asynchronous/written approach that could solve it first. If that's been tried and didn't work, then book the meeting, keeping the above guidelines in mind to maximize the time investment.
</aside>

## Small-ish Team Size

Over the years, I have found the optimal team size to be on the small end, ranging from 2 - 4 developers, plus a PM and designer. Keeping the team size small limits the number of [lines of communication](https://www.leadingagile.com/2018/02/lines-of-communication-team-size-applying-brooks-law/). Here is a useful diagram from that blog post to illustrate the issue:

![lines of communication and team size](../images/lines-of-communication-teams-size.png "lines of communication and team size")

If the team has 2 developers, a PM, and a designer, that's a total size of 4, resulting in 6 lines of communication, which is manageable. Bumping this up to 4 developers results in a total team size of 6, which leads to 15 lines of communication. That's pushing at the maximum of what a team can manage and still be effective.

It can be tempting to add more developers to a project thinking that productivity will improve linearly. For example if one developer can complete one feature per week, then adding 9 more developers will result in 9 features completed per week. However, 9 developers plus a PM and designer makes 11 team members, which translates to an astonishing 55 lines of communication! What's more likely is people end up stepping on each other's toes attempting to modify the same area of the code for different reasons, or spending the majority of their time in meetings trying to co-ordinate rather than hands-on building software. This is explained by [Brook's Law](https://en.wikipedia.org/wiki/Brooks%27s_law) which observes that adding people to a software project that is behind schedule delays it even longer.

There's a little more nuance here in that it varies with the surface area of the project. A large project could potentially support a few more developers, if the areas that need to be developed in parallel are independent of each other, and there's thorough, up-to-date [engineering documentation](../about-those-docs) that allows new developers to onboard independently.

## Do the Simplest Thing That Works

I learned this motto from a company I worked at earlier in my career and the advice has served me well.

An effective team chooses relatively simple solutions that get the job done, while not painting themselves into a corner. The idea here is to value maintainability and ease of deployment over cleverness or attempting a "big tech" scale architecture from day one of the project. While its nice to think that in the future the project will be so popular it needs to support millions, or even billions of simultaneous users, the reality is, most projects don't get to Meta/Alphabet/Amazon scale.

This often means starting with a monolith rather than microservices. It can always be split up later *if* transaction volumes and revenue generated from these justifies that. And even then, you would want to measure and identify where the performance bottlenecks are, and come up with optimal solutions to address those directly. For example, if incoming requests are receiving errors due to running out of database connections, splitting up into microservices may not resolve the underlying issue. Instead investigate - is connection pooling being used? Is there a memory leak where some code is always opening, then forgetting to close a connection? Is there some work that could be moved to a background task manager to reduce the length of time needed to service a request? If many requests are read-only could increasing the number of database replicas help? For reads and writes, could consider [horizontal scaling](https://dzone.com/articles/how-to-horizontally-scale-your-postgres-database-using-citus) of database. Notice these investigations are going from simplest to most complex.

Avoid over-engineering, i.e. building in abstractions and flexibility unless its known to be needed. Otherwise what can happen is this flexibility is never needed, but when future requirements come in, they need to "flex" in a different direction, resulting in overly complex code.

Avoid premature optimization. For example, writing harder to understand code that shaves microseconds of performance over more straightforward code. Developers spend more of their time reading code others wrote rather than writing net new code so legibility and avoiding second takes is often more valuable than a few microseconds that some obscurely written code saves. In my experience, performance issues have been caused more frequently by loading too much data (lack of pagination), missing database indices, N+1 queries, and loading too much JavaScript, such as intrusive trackers or non-minified code.

There are exceptions of course, in some domains such as real-time systems or graphics processing, these microseconds matter. This is a good place to add code comments explaining what this code does, and more importantly *why* this code is needed.

## Fullstack

When I started my career, there were no separate titles for front and back end developers. The titles were just like "software developer" or "programmer analyst". These were fullstack roles before that term had been developed. Developers were responsible for building out features end to end, including database schema design, back end services and APIs, and making the front end look and function as specified in the [design comps](https://thedilldesign.com/web-design-comps-made/).

Then some years later, a trend emerged to separate out the roles into "back end developer" and "front end developer". The idea being that these are separate skills with often, separate languages (until [Node.js](https://nodejs.org/en/) came along and made it possible to build the back end in the same language as the front end), and that people should specialize in one area or another.

It's true that there's a different kind of thinking involved in building the front end such as the declarative nature of HTML and CSS, weaving in JavaScript in an organized way (which could mean learning a number of [SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA) frameworks), a focus on the visual for different media, animations, and accessibility, just to name a few items. Whereas on the back end a developer is focused on ensuring the database is normalized, efficient queries, building models that accurately represent the business domain, and services and APIs that implement the business rules.

However, neither of these are how the business people (who are paying the developers to have this software built), nor the customers (who will use the product) actually think about it. They view the application as a single unit that either solves their problem or doesn't. For example, when the PM specifies a new feature to be added to the product such as Advanced Search, the story/requirements will have the design comps showing the layout of all the search fields that should be supported, and specify the behaviour for what kind of results should be returned for various combinations of fields. The PM is not thinking about (nor should they) which parts of the logic will execute on the server and which on the browser client.

In a world where there are separate teams of developers doing front vs back end work, this feature would get split up into two tickets - one to implement the front end and another for the back end. Now there's a very tight dependency between the two people working on these tickets. They might collaborate to determine what the search API endpoint will look like and what parameters it will support. Then the back end person will implement it and submit a PR for that work, which will get merged. In the meantime, the front end person can start building their part, perhaps with a mock API (which someone will have to implement) that mirrors the real API that was agreed to.

But the front end person won't be able to finish their work until the back end developer's real API is merged. Then the front end developer can update their branch with the real API and start using it. Then they might realize there's an issue, perhaps some edge cases that the search endpoint isn't handling or a bug, resulting in the front end being broken. Another thing that frequently happens is when the PM views the front end with the real back end, they may want some changes. Who here hasn't had the experience of a conversation with a PM along the lines of "I thought it should work this way, but now that I see it in action, I think it would be better if it behaved this other way..."

Now the front end developer has to reach out to the back end developer, who may or may not be available, maybe they've moved on to another ticket and either have to context switch or tell the front end developer to wait awhile until they have time to fix it. So the front end developer will mark the ticket as blocked and move on to something else, hopefully remembering to return to the original ticket whenever the backend developer gets around to merging the fixes.

The other thing that often happens is there's a deadline to get the feature complete. In this case the front end developer may implement some workarounds on the front end to make things seemingly work, when it would have been more efficient to have the back end do this work.

It's not the fault of the PM that is asking for changes, remember Agile tells us we're supposed to embrace change! But when the teams are structured as horizontal slices of the stack (database, back end, front end), it creates needless friction to get features complete that are vertical slices through the entire stack. I have found it more effective to give every developer autonomy over the entire stack so they can use the appropriate tools to get their job done.

## Linting & Tests

An effective team puts linting, automated testing, and CI (Continuous Integration) in place from the very early days of the project. Unless it's a hack-a-thon or throw-away code, this is a must.

A good set of linting rules suggests best practices, prevents common coding errors, and enforces code style/formatting to avoid [bike shedding](https://en.wikipedia.org/wiki/Law_of_triviality) in PRs. Especially when it comes to code style, (eg: braces on same line or next, semi colons or not, etc.), it's less important to be "right" and more important for the team to be consistent.

Getting in the habit of writing tests leads to better quality code. It also supports adding new features and refactoring without fear of causing regressions.

Finally, linting and tests should be easy to run on each developers laptop, via CLI and/or editor plugins. These should also run as part of CI, which should be running on each commit pushed to feature branches and the main branch. A failure in CI should notify the developer that pushed the breaking commit. The main branch should be protected such that CI must be passing before any PR can be merged.

## KTLO

As exciting as it is to work on new features, an effective team dedicates a certain percentage of time to KTLO (keep the lights on) activities. This could include dealing with dependabot PRs, alerts from monitoring systems, deprecation warnings, library upgrades, and bug fixes. Otherwise things can get stale or stop working altogether, and make it difficult to keep moving the project forward.

Some teams will set aside a certain part of the year for these activities. Another way is to regularly add these items to the ticketing system with a certain tag such as `Maintenance`, and then let developers know for every 3 or so features they work on, pick up a maintenance task.

## Rotate Assignments

On many teams, developers tend to become experts on the area of the application that they've worked on most. It could be based on interest, or just by co-incidence of the initial task assignments. What tends to happen is whenever new feature requests or bugs come up, they get assigned to the developer that's already most familiar with that area because it will be "faster" to get it done.

However, this speed is an illusion, or a trade-off between the short term and long term viability of the project. When the expert goes on an extended vacation or leaves to pursue another opportunity, then the project will slow down when development is needed in the area that only the expert was familiar with.

To mitigate this risk, an effective team will intentionally rotate task assignments so that all developers get opportunities to work on all areas of the project. It may feel slower at first, but the payoff is a more resilient team in the future.

The purpose of this strategy is to lower the lottery count, i.e. how many team members would have to win the lottery and take off to travel the world in order for the project to be in trouble. This is also known as the [truck factor](https://www.agileadvice.com/2005/05/15/agilemanagement/truck-factor/), but it's nicer to visualize a lottery win rather than getting hit by a truck.

This is also an opportunity to improve engineering documentation. As a developer works on an area of the project for the first time, they will naturally have questions that only the expert knows, and may not have realized this is specialized knowledge. The new developer can then update the engineering docs in this area and include it in the PR for the expert to review. This will improve speed of development for the next "new" developer to work on this area.

## Psychological Safety

Psychological safety is an absolute must in order for any team to work effectively. Here is the definition that was given on the [podcast](https://www.se-radio.net/2022/12/episode-543-jon-smart-on-patterns-and-anti-patterns-for-successful-software-delivery-in-enterprises/) that inspired this post:

> Psychological safety is the ability to feel safe to ask questions, to challenge authority, to have your voice heard, to express your thoughts without fear of repercussion, without fear of being shot down or belittled. It's the ability to have open, vulnerable conversations with respect. Not having a blame culture. If something goes wrong, its not because someone did something wrong, it's because there was something in the system of work that enabled this thing to happen.

To this I would add, not just feeling safe to ask questions and challenge authority, but for it to be *encouraged* across the hierarchy. For example, it should be ok for a junior dev to question the architecture proposed by the CTO. This is necessary for new idea generation. Otherwise the team stagnates into a culture of "we've always done things this way", and stops innovating. Not every new idea that people suggest will work out, but they should never be censured for it because other people will look to that example and think "I better keep my mouth shut", and that other idea that never gets surfaced could have been amazing.

Developers also need to feel safe suggesting accurate estimates (which are typically larger than business people like to hear) or indicating that something is going to take longer than the initial estimate. When this safety isn't present, people end up working long hours trying to reach unrealistic deadlines, quality suffers, and burn out ensues.

<aside class="markdown-aside">
The topic of estimates is way too large to fully cover in this post, and somewhat out of scope so I've only touched on it. Give a listen to this podcast from Freakonomics on <a class="markdown-link" href="https://freakonomics.com/podcast/heres-why-all-your-projects-are-always-late-and-what-to-do-about-it/">why all your projects are always late</a> for an insightful and entertaining take.
</aside>

The other aspect of psychological safety is what happens when someone makes a mistake that has a serious impact such as data loss. It's important to not assign blame to the individual but look to how the system can be improved so no one else can ever make this mistake again. For example, is there some connection between the dev and production environments that shouldn't exist? Was some operational documentation out of date? Should every developers shell profile include logic to automatically turn the title bar or prompt red when connecting to production? Every mistake is an opportunity to improve systems and documentation. On the other hand if an individual "gets in trouble" for admitting to a mistake, you can be sure that no one will ever admit to a mistake again, which makes the entire matter worse.

## Conclusion

This post has covered the definition of an effective software development team, and practices that lead to effectiveness. These practices include:

* Lightweight process that lets developers get into flow state and supports traceability.
* Favoring written communication to solve problems over frequent meetings.
* Maintaining a small team.
* Sticking to simple implementations where possible.
* Favoring fullstack over multiple teams split up by horizontal layers or technologies of the stack.
* Automation from the start including linting rules and tests.
* Dedicated time to maintenance.
* Giving all team members opportunities to work on all areas of the product, especially those in which they're less familiar.
* Ensuring a psychologically safe environment for everyone.

For further reading on this topic, see this post on [Developer Effectiveness](https://martinfowler.com/articles/developer-effectiveness.html) on Martin Fowler's blog.

## TODO
* Maybe add CD to Automation section?
* Where does effective communication (between engineers and between engineers and product) fit in - maybe in Culture of Writing section?
  * You could have a team of genius developers that can solve every leet code interview question ever written but still not have an effective team if the engineers struggle to understand the user stories, or recognize when there’s additional clarifications to go to PM with. This is sometimes called “soft skills”, but I consider it just as critical as the ability to code.
* Edit feature image
* Add Objection to fullstack re: some people prefer to specialize
* Maybe mention original Agile Manifesto from early 2000's? (when exactly), a lot has changed since then including WFH/remote, DEI, recognition of [neurodiversity](https://www.health.harvard.edu/blog/what-is-neurodiversity-202111232645) in the workplace, psychology research on flow state
* Fullstack:
  * Make the Node.js same language back/front an aside?
  * Mention that I've worked in all 3 (fullstack, back end only, front end only)