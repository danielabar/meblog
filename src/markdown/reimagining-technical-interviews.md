---
title: "Re-imagining Technical Interviews: Valuing Experience Over Exam Skills"
featuredImage: "../reimagine-tech-interviews-dave-mcdermott-nEJmnfCCPmI-unsplash.jpg"
description: "tbd"
date: "2024-07-01"
category: "career"
related:
  - "The Development Iceberg: Unseen Efforts That Extend Project Schedules"
  - "Reflections on Effective Teams"
  - "Solving a Python Interview Question in Ruby"
---

As I navigate the job search process anew, I'm struck by how sub-optimal technical interviewing has become. Despite my extensive experience spanning over two decades in software engineering, I've encountered numerous interview practices that seem disconnected from the real-world demands of our profession. This post will delve into the shortcomings of current technical interview methods, explore why they fail to capture true engineering talent, and propose more effective alternatives.

## Live Coding Round

Many companies, as the first part of the interview process have what's called a live coding round. In this session, the candidate gets on a video call with another engineer(s) at the hiring company, and is told to click a link to a shared coding environment such as CodeSignal, CoderPad, etc. There they are presented with a problem to solve, often in the form of write a method that takes arguments foo, bar, etc. and produces output baz.

This could be a "leetcode" style question involving computer science theory. For example [Reverse a Linked List](https://leetcode.com/problems/reverse-linked-list/description/), [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/description/), [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/description/). Or it could be a more practical question from the company's domain.

The candidate is told it's a timed exercise, and they're expected to solve the problem in the allotted time, usually under an hour. Furthermore, the candidate is expected to talk out loud as they're solving the coding challenge to explain their thought process. And on top of all that, they're expected to consider whether they're choosing the most appropriate data structures, efficiency (i.e. Big O complexity analysis), and clean code principles, aka legibility.

Companies will often use this as a qualifying round, meaning is if the candidate does not pass this exercise, then they are immediately eliminated from the process. In other words, this live exam is used as a gate-keeping exercise, to keep out people who don't do well under this very specific set of circumstances: Live code a problem you've just heard about a minute ago, under a very short time pressure, while explaining the thought process out loud, and trying to optimize it for legibility and efficiency.

Here's an example from some preparation materials I was sent by one company:
Are you explaining your solutions logically?
Are you developing and comparing multiple solutions?
Are you utilizing the appropriate data structures?
Are you discussing space and time complexity?
Are you optimizing your solution?

Of course these are all important considerations on the job, but they never happen all at once, within a single hour session, and certainly not while talking out loud and trying to code at the same time, while someone watches and judges you.

The technical round of live coding interviews, while common, has several flaws that can inadvertently exclude talented individuals who might otherwise be a great fit for the role. The next sections cover the key issues with this approach.

## Problem 1: Leetcode

The first problem with these exercises is that they're unrealistic of what actual software engineering is. Often, the complexity in software engineering comes from trying to figure out *what* to build rather than *how* to build it. From my over 20 years experience in mostly web application development, I've certainly never seen a linked list in any web app! And even if they do, I can look them up rather than trying to remember the details of university computer science theory from over 20 years ago.

TODO: Example of needing linear algebra/matrix knowledge for 3d webgl computer graphics...

As for Big-O complexity analysis, while this is a useful principle to understand, it doesn't make sense to gate-keep on this. I have resolved many performance issues over the years, and the root cause has never been from a method that was written in O(n) time when it could have been O(log n). Common causes of performance issues include: loading too much data from the server (eg: lack of pagination), missing database indices, N+1 queries, lack of background task processing, or loading too much JavaScript, such as trackers or non-minified code in the browser.

An argument could be made that this is a useful interview technique for a junior engineer, as a recent comp sci graduate may not have real world experience (unless they've done co-op or summer internships). There may be some truth to this, but even so, I recall even as a junior, being struck by just how different the actual demands of an engineering job were from school assignments. For example, one of my first assignments was to integrate an affiliates program into a major retailer's e-commerce site. And that one sentence was just about all that initially came in as the business requirements from the marketing department. This task involved discussions with the marketing team to determine what they actually needed, reading documentation from the affiliates vendor to understand the integration options, discussions with the operations team to determine the performance impact of different options, analysis of the data model to determine what changes were required, analysis of the codebase to determine where to hook in the new code, and of course, some actual coding of the solution.

None of this could be completed in under an hour. The biggest challenge was figuring out what to build and how to integrate it into the existing code base. And the most useful of my skills was in figuring out who to talk to and having productive conversations. None of these skills is captured in a live coding assessment.

## Problem 2: Time Pressure

The live coding round creates a "racing against the clock mentality" - TODO: find white rabbit image from Alice in Wonder with the clock.
TODO: Fight or flight response, impact on pre-frontal cortex

- using "on the spot" coding/analysis/thinking-out-loud in under an hour is not a proxy for what an effective engineer actually does
- I can recall very few scenarios in my 20+ year career, where the ability to write some code very quickly on the spot was critical to the team's success. In one instance, a VIP was unexpectedly scheduled to come by the next day for a demo of a WIP product, the product was working, but didn't have functional styles so it looked broken. In this case, I had just a few hours to tidy up the styles to make a certain portion of the product to be demo-ed look functional.
- AND EVEN THEN, it was a product I had been working on for nearly half a year and was thus very familiar with it, and no one was hovering over my shoulder watching and judging my every line of css, such as the mistaken ones I had to remove if it didn't look quite right. And I wasn't required to talk out loud to another engineer as I was updating each line of css.
- i.e. the idea of going from first time hearing of a problem to working solution in < 1 hr never happens on the actual job

An argument in favour of the time pressure is that projects need to meet deadlines so companies need engineers that can code quickly. In my experience on projects that were struggling to meet deadlines, the issue has never been that developers weren't hammering out the code quickly enough. In fact, the "hands-on-keyboard" time is often the fastest part of the process (ref: dev iceberg). Some reasons I've seen projects take longer than expected include:
* Lack of knowledge among the team as to the full scope of the project
* Misunderstanding between client/product/design/engineering as to the business requirements
* Not realizing when there is ambiguity in requirements and make a best guess, often without realizing that's what they're doing, and end up building the wrong thing.
* Designers waiting on business requirements from product
* Developers waiting on design comps where designers are striving for pixel perfection, when really, a napkin sketch would have sufficed to get the developers started (aside: ShapeUp apparently makes this more efficient)
* Overly complicated or over engineered initial architecture that makes adding new features difficult
* Flaky/intermittent unit or integration tests means developers have to spend time investigating potentially false negative scenarios
* Lack of system/end-to-end testing requiring manual QA to avoid regressions; To the extent that there's typically less QA people than simultaneous feature changes, this becomes a bottleneck
* Lack of (or out of date) engineering documentation such as how to setup the project or work with third party integrations. This makes even seemingly simple changes take longer for developer to figure out how to even exercise that part of the code.
* Inability to run some features on laptop due to complex microservices architecture, or third party integration that's impossible to run locally

Many of the above stated issues are of communication, and will not be resolved by hiring the fastest coder.

Example: Story of senior engineer who on principle refused to ever go to PM to ask questions because he thought the definition of a senior was someone who has all the answers. The features he would deliver were frequently incorrect and required numerous lengthy meetings with the PM and team lead to clarify and multiple iterations (including multiple PR reviews and QA rounds!) to get right. I want to emphasize this engineer was a brilliant and speedy coder. He would have aced any leetcode interview, and yet the team was struggling to deliver on anything he worked on, and required additional effort from many other team members. Delivering the wrong code quickly helps no one. A leetcode style exam won't catch this because the requirements are specified so clearly.

## Problem 3: Talking Out Loud

## Problem 4: Compressing the dev cycle

- Trying to compress the principle of "first make it work, then make it right, then make it fast", which almost never happens all in under an hour.
- This also goes against real world practice of avoiding premature optimization - first get something working, then measure using observability tools for memory usage, performance etc.
- real world is not like this - when a new feature or problem arises in the real world, its often contextual - requiring knowledge of the companies existing systems and business processes. And typically, there is a lot of back and forth iteration with developers reading the requirements, going back to PM with clarifying questions, requirements getting updated, then tests get written, then the code gets written, maybe it gets deployed to get early feedback from PM if things are on the right track.
- And only then can developer think about optimizing code for legibility and performance, given that the right level of automated tests (from unit, integration, and system/end-to-end) are in place to ensure any refactoring doesn't break functionality

## Alternatives

TOOD: benefits of alternative approach, to capture skills that are so often missing and the actual cause of project struggles (question asking, analytical, appropriate level of testing, engineering documentation, overall communication)

## Pushback: You Should Practice

TODO: Rough notes...

When I've brought up the fact that these kind of "on the spot" puzzle solving skills are not required in actual engineering work, recruiters have acknowledged this, and then said "you should spend time practicing". Let's think about how silly this is - a company is hiring for, let's say a staff engineer, so they reach out to them based on their LinkedIn profile, and their many years of experience solving real world problems. But somehow they're unable to assess that so now the candidate needs to spend their precious free time practicing for a test that doesn't even assess the actual skills they're being hired for? Given that an engineer actually has some free time to dedicate to any sort of technical extra-curricular activity, I can think of so many more valuable things to be doing than practicing leetcode puzzles, such as:
- Taking online courses to learn a new skill or something tangentially related, for example, if your company is considering bringing in Typescript, or TailwindCSS
- Reading technical books, eg: Sustainable Rails
- Building side projects to explore something new or solve an actual problem (find example from Wes Bos of Syntax podcast re: broken bicycle bidding on craigslist)
- Volunteering to build software for an charitable organization (eg: Ruby for Good)
- Writing technical articles, tutorials etc to share what you're learning

I mean sure, practice these exercises if someone enjoys this kind of work, just like someone training for a marathon hopefully enjoys the process and will practice long distance running regularly.

Multiply this out by all the engineers looking for a new role, say every few years, spending weeks on these practice exercises. How many more valuable things could have been achieved with all this time?

## Pushback: Fairness

## Pushback: Cheating

## TODO
* WIP main content
* structure - maybe Problems as level 2 and each problem as level 3, same for pushback
* think about logical ordering of problems
* conclusion para
* edit
* meta tag description
* aside: based on my experience applying as intermediate, senior, staff in web development. Other areas of tech such as gaming, embedded systems etc could be completely different.
* maybe ref LI post to show the discussion https://www.linkedin.com/posts/gabag26_leetcode-codinginterview-softwareengineering-activity-7203974232509173760-92WZ/
* define leetcode
* does this fit in? This is all to say that the live-coding round is really testing for an [anachronistic](https://www.wordnik.com/words/anachronistic) skill that's rarely required any more.
> adjective of a person having an opinion of the past; preferring things or values of the past; behind the times.

* Where does this fit in?
When is this actually useful?
1. Programming competitions
2. Hack-a-thons
3. Production is down or particular page on website is broken that impacts revenue generation
For the first two, most companies aren't doing that (I mean unless the company is a known host/sponsor of programming competitions, in this case, maybe they do need developers to be representative of this particular skill set, but this is not most companies), and the resulting code quality is not what most companies would want to maintain long term in any case. And even then, candidates in competitions and hack-a-thons are not asked to talk out loud about their process as they're coding.
For the third one, since the modern introduction of containerized deployments and blue/green etc, the correct solution is to usually rollback the deployment rather than to try to fix the broken airplane in the air - TODO: image...
