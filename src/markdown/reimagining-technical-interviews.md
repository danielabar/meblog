---
title: "Re-imagining Technical Interviews: Valuing Experience Over Exam Skills"
featuredImage: "../images/reimagine-tech-interviews-dave-mcdermott-nEJmnfCCPmI-unsplash.jpg"
description: "Exploring the shortcomings of traditional technical interviews and advocating for more relevant assessment methods to better reflect the demands of modern software engineering roles."
date: "2024-07-09"
category: "career"
related:
  - "The Development Iceberg: Unseen Efforts That Extend Project Schedules"
  - "Reflections on Effective Teams"
  - "Solving a Python Interview Question in Ruby"
---

As I navigate the job search process anew, I'm struck by how sub-optimal technical interviewing has become. This post will review the shortcomings of current technical interview methods, explore why they fail to capture true engineering skill, and propose more effective alternatives.

## Disclaimer

Before diving into my observations and suggestions, it's important to note that my experiences are based on applying for senior/staff positions in web development. The tech industry is vast, encompassing areas such as gaming, embedded systems, data science, and more. Each of these fields has its own unique set of challenges. What I discuss here may not apply to all areas.

## Live Coding Round

Many companies, as the first part of the interview process have what's called a live coding round, or sometimes called a pair programming exercise. In this session, the candidate gets on a video call with an engineer(s) at the hiring company, and is told to click a link to a shared coding environment such as CodeSignal, CoderPad, etc.

They are presented with a problem to solve, often in the form of: Write a method that takes arguments `foo`, `bar`, etc. and produces some output `baz`. This could be a [LeetCode](https://en.wikipedia.org/wiki/LeetCode) style question involving computer science theory. For example [Reverse a Linked List](https://leetcode.com/problems/reverse-linked-list/description/), [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/description/), [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/description/). Or it could be a question from the company's domain.

It's a timed exercise, usually under an hour. The candidate is expected to talk out loud as they're solving the coding challenge to explain their thought process. They must also consider appropriate data structures, efficiency (i.e. Big O complexity analysis), and clean code principles such as legibility.

This is often used as a *qualifying* round, meaning if the candidate does not complete the task in the expected time with expected quality, they are immediately eliminated from the process. In other words, this live exam is used as a gate-keeping exercise, to keep out people who don't do well under this very specific set of circumstances.

## Problems

The technical round of live coding interviews, while common, has several flaws that can inadvertently exclude talented individuals who might be a great fit for the role. The next sections cover the issues with this approach.

### LeetCode

For companies that choose to use LeetCode exercises for the evaluation, these are an unrealistic reflection of daily engineering work. Often, the complexity in software engineering comes from trying to figure out *what* to build rather than *how* to build it. In over 20 years of software development, the only time I've encountered a linked list was in computer science classes at school!

If and when a more algorithmic style of problem is encountered, it can be looked up rather than having memorized computer science theory from one's school days. When these problems do come up on the job, they're usually on projects spanning weeks or even months, so the code is not arrived at in one hour. Some public examples I can share from courses and side projects include graph generation for an [interactive exploration of marine ecosystem species](https://github.com/danielabar/globi-proto/blob/master/app/scripts/services/graphservice.js),  [optimize text placement along an svg path](https://github.com/danielabar/canve-viz/commit/d026efa6b8f0c9841549040305e0694277bff4a4), [matrix manipulation for 3D computer graphics](https://github.com/danielabar/coursera-webgl/tree/master), and [generation of points along an arc for custom animation](https://github.com/danielabar/framegen/blob/master/FramegenCore/src/main/java/com/framegen/core/framehandler/option/ArcFrameHandler.java). All of these were long running projects that involved many iterations, and the algorithmic problems were contextual to the domain.

As for Big-O complexity analysis, while this is a useful principle to understand, it doesn't make sense to gate-keep on this. I have resolved many performance issues over the years, and the root cause has never been from a method that was written in O(n) time when it could have been O(log n). Common causes of performance issues in web applications include: Loading too much data from the server (eg: lack of pagination), missing database indices, database tuning/configuration, N+1 queries, lack of (or misconfigured) background task processing, or loading too much JavaScript, such as trackers or non-minified code in the browser.

Additionally, LeetCode problems can exclude candidates who lack a theoretical computer science background but have all the relevant on-the-job experience required for the role.

<aside class="markdown-memory-lane">
<h3>Trip down memory lane...</h3>
<p>
An argument could be made that this is a useful interview technique for a junior engineer, as a recent computer science or bootcamp graduate may not have significant real world experience. There may be some truth to this, but even so, I recall as a junior, being struck by just how different the demands of an engineering job were from school assignments.
</p>
<p>
For example, one of my first work tasks was to integrate an affiliates program into a retailer's e-commerce system. This involved discussions with the marketing team to determine what they actually needed, reading documentation from the affiliates vendor to understand the integration options, discussions with the operations team to determine potential performance impacts, analysis of the database to determine what changes were required to the data model, analysis of a large code base and framework to determine where to hook in the new code, and of course, some actual coding of the solution. The biggest challenge was figuring out what to build and how to integrate into the existing code.
</p>
</aside>

<aside class="markdown-aside">
Further discussion on LeetCode style interviewing can be found on <a class="markdown-link" href="https://www.reddit.com/r/cscareerquestions/comments/pbyn4v/comment/haf88zj/">Reddit Career Questions</a> and this <a class="markdown-link" href="https://syntax.fm/show/781/potluck-the-value-of-typescript-vue-vs-svelte-leetcode/">Syntax podcast</a> episode at 36:15.
</aside>

### Time Pressure

Even if companies choose a problem from their domain rather than theoretical computer science exercises, there are still problems with the timed live coding round.

The artificial time constraint creates a "race against the clock mentality", which can create a "fight or flight" response.

![white rabbit race against the clock](../images/white-rabbit-late-crop.png "white rabbit race against the clock")

There's some discussion in the [scientific literature](https://www.psychologytoday.com/us/blog/202301/does-the-amygdala-hijack-your-brain) as to whether the amygdala (brain region associated with fear and emotion) "hijacks" the pre-frontal cortex (brain region associated with logical reasoning) or whether they work in co-operation. I'm not a neuroscientist so I can only express how this scenario *feels*:

When presented with a short time interval in which to solve a problem, all my brain can focus on is the clock ticking down the minutes. This makes my analytical skills fade into the background compared to the fear response, and negatively impacts my performance.

Using "on the spot" coding/analysis/thinking-out-loud in under an hour is not a proxy for what an effective engineer actually does. On the job, software engineers have access to resources like documentation, the ability to collaborate with colleagues, and time to research and think through problems.

<aside class="markdown-aside">
Having at least one night to "sleep on it" is also critical, as the brain uses sleep to integrate and solidify learnings from the day. Learn more about this in the book <a class="markdown-link" href="https://www.goodreads.com/book/show/34466963-why-we-sleep/">Why We Sleep</a> by Matthew Walker.
</aside>

When a company provides a problem from their own domain, which they've been working on for years, it can be unrealistic to expect someone unfamiliar with it to understand and solve it in an hour. Onboarding and product training for a new employee typically take at least a few weeks. This mismatch in expectations can further exacerbate the stress and pressure felt during the interview.

Additionally, in a typical development cycle, the very first solution that comes to mind is almost never the one that gets delivered to production. Instead, there's a period of days or even weeks spent refining the solution, addressing edge cases, and ensuring robustness. Yet, live coding interviews judge candidates based on their ability to immediately produce a fairly polished solution.

<aside class="markdown-memory-lane">
<h3>Trip down memory lane...</h3>
I can recall very few scenarios in my career where the ability to write some code, literally within a few hours, was critical to the team's success. In one instance, the team was told at the last minute that an important client representative was scheduled to come by the next day for a demo. The product was working, but wasn't yet styled, so it looked broken. I had just a few hours to make the views look functional. And even then, it was a product I had been working on for nearly half a year and was therefore very familiar with. This urgent task would not have been assigned to someone who had only just seen the code for the first time that day.
</aside>

### Talking Out Loud

Individuals who are introverted or prefer to process information internally may struggle with the expectation to think out loud and articulate their thought process in real-time.

Speaking from my own experience, I find it nearly impossible to think about a solution to a coding problem *and* talk out loud about it at the same time. I can however explain it in a written format, after the problem is solved, and generate educational materials such as [engineering documentation](../about-those-docs) or a [blog post](../python-interview-question-in-ruby).

By rejecting candidates for not being able to think out loud and code at the same time, it creates the impression that only one particular way of thinking is valued.

### Bias Towards Quick Thinkers

The ability to solve problems quickly under observation is not necessarily indicative of an individual's overall problem solving skills or coding proficiency in a less pressured environment. Many complex software problems require extended periods of deep thought and experimentation, which are not represented in short, timed coding challenges.

There are professions where the ability to think quickly on your feet in response to surprises is useful. For example courtroom lawyer, standup comic, improv actor, combat pilot, emergency room doctor. But I don't think software engineering generally fits into this list.

Occasionally, quick thinking is required of software engineers, such as when resolving a production outage or a bug that's blocking some a feature from functioning correctly. However, if companies qualify candidates primarily based on this ability, it gives the impression that the company regularly faces these emergencies, which might not be the intended message.

Furthermore, if a company does frequently experience production emergencies, hiring the fastest coder is unlikely to address the root cause of these issues.

<aside class="markdown-memory-lane">
<h3>Trip down memory lane...</h3>
I recall one scenario earlier in my career where a deployment caused a critical feature to malfunction shortly after release. This incident occurred before the widespread adoption of containerized deployments and automated CI/CD pipelines, which simplify rollbacks and mitigate such risks. I had to quickly diagnose and resolve the issue to restore functionality. Since then, modern practices in deployment and continuous integration have significantly enhanced the ability to manage these issues.
</aside>

### Lack of Empathy

The nature of the live coding "solve this method" type of question can induce a lack of empathy on the side of the assessor. This is because they already know the solution, so they're in a fixed mindset of either the candidate achieves a working solution or they don't. If they've been doing this interview style for a long time, they've likely forgotten what it was like to not know the answer.

On the job, when a problem is first presented to a team of developers, no one knows what the correct solution is. So as people propose and try out different ideas, they're not judged on right or wrong, but rather, that's the expected iterative process of software development.

### Qualifier

Some companies use this round as a qualifying step, meaning it's the first phase in the interview process, and if the candidate doesn't pass, they're immediately rejected. Attempting to condense years of experience into a one-hour, high-pressure, and unrealistic test-taking session is not an accurate assessment of a candidate's capabilities.

## Making Things Better

Now that we've covered the problems with live coding as an interview technique, let's turn our attention to how the process could be improved.

A good starting point is a brainstorming exercise to determine what are the qualities of an effective engineer at the level being hired for. I would encourage everyone who has a say in defining interview processes to open up your company's performance review template for the role, and identify the key points that engineers are evaluated on. For example, here's a few from my past roles as senior and staff engineer:

- Technical skills
- Code quality
- Communication
- Conducting effective PR reviews
- Mentoring
- Problem solving & root cause analysis
- Prioritizing
- Collaboration & teamwork
- Technical leadership
- Scalable and performant solutions
- Process improvements
- Adaptability & continuous learning

Then open up the project team's retrospectives for the past few months, and review what went well and what didn't. Try to identify some themes for what makes engineering successful at your organization and what are the challenges. I've never been in a retrospective that recorded "This sprint didn't go well because the developers couldn't figure out whether an array or hash was appropriate in this method".

The outcome of the above brainstorming can be used to guide the interview process, thinking about how to assess for qualities the company needs for successful engineering teams. Of course technical proficiency will be up there, but so will other qualities.

**Another important consideration is the format:** Some topics are suitable for a conversational/real-time format, such as discussions about the candidate's past experiences. On the other hand, "forging new knowledge", where the candidate is asked to solve a problem, is generally more suited to asynchronous style, where the candidate works through a problem on their own, and then there's a follow on conversation about the solution.

The next sections describe some alternatives. Not to suggest that *all* of these should be used, rather, this is to get people thinking about alternative ways of assessing technical proficiency.

### Greenfield a Very Small Project

In my experience, the reason projects struggle is often related to communication issues, in understanding business requirements and understanding what other developers did previously. In this case, here's an alternative to the live coding round to assess both technical skills and the ability to communicate effectively.

Email the candidate an assignment they'll do on their own. Intentionally make the problem statement vague, the way a business person might word things. Let the candidate know that the first part of the assignment is for them to take the time to think about clarifying questions, and to email back a list of questions to the company. Emphasize they're being evaluated on their questions at this point, not on knowing the answers. And it's ok to send a question like "I'm not familiar with this business process, can you share more detailed steps on what's involved here".

Then the team assessing the candidate can send back answers to the questions. The answers should be worded in such a way that the solution can be completed in a few hours, i.e. not much longer than the live coding round would have been.

Then the candidate can go ahead and solve the problem on their own time, with their own editor, tooling, keyboard shortcuts etc. This is very reflective of how things happen on the job. Based on questions developers think of, often the product manager will be like "Good question! I hadn't thought of that case". Then the solution may take a different shape.

If writing automated tests is important to the company, as part of the assignment, let the candidate know to include *some* automated testing. This need not include 100% coverage as that's more time than can reasonably be asked of someone who is doing unpaid work. However, the goal here is to see if they can identify the critical path(s) in the code and ensure these are covered with meaningful tests.

If engineering documentation is important to the company, as part of the assignment, let the candidate know to provide setup and "how to" instructions in the Readme so that the assessor can setup the project and reproduce the solution. Tell them that the goal of this write-up is to ensure that another developer could pick up where they left off and further enhance the product.

After the candidate submits the solution, a follow-on meeting can be scheduled to discuss it. Such as what was the most challenging part, why the given solution was chosen, what trade-offs were considered etc. Part of the assessment can also include, how easy was it to follow along with the setup instructions? How easy would it be to enhance the solution to add more features?

**Benefits of this alternative approach:**

Captures essential skills that impact projects, beyond writing working code such as analytical thought, automated testing, engineering documentation, and overall communication.

Due to the dynamic nature of what questions the candidate may ask, the solution could be different for each candidate. This means the assessor doesn't know the exact solution at the start of the assignment. This can improve empathy for the candidate in the process because everyone is figuring out the solution as part of the process. This avoids the fixed mindset of this candidate got the solution correct, good or incorrect, bad.

### Add a Feature

Engineers spend a lot more time reading code other people wrote to determine where their new code fits in, rather than starting from a blank slate.

A variation on the previous assessment (again to be done asynchronously) is to send the candidate some working code. Then the assignment is to enhance it with a new feature (again, going through a round of clarifying question asking).

### Fix a Bug

Another variation on the previous assessment is to send the candidate some existing code that runs, but isn't behaving correctly. Send them a bug report along with the code sample. Ideally this bug report will be in the form of: Steps to Reproduce, Expected Result, Actual Result.

Then have the candidate resolve the bug. Part of this assessment could also include maintaining the tests and a brief write-up explaining what techniques were used to troubleshoot and what was the issue.

### Review a Pull Request

If the role that's being hired for involves extensive PR reviews, this can be another type of assessment that can be done asynchronously.

Ask candidates to review a piece of code, identify issues, and suggest improvements. This assesses their understanding of code quality and best practices. Evaluate how empathetic that candidate is and how they word their feedback.

### Deep Dive Technical Walkthrough

If the candidate has some existing work that they can share, another way to assess technical proficiency is to have them give a detailed technical walkthrough of a feature they've developed. This can cover the initial analysis, what problems were encountered in implementation, and how the final solution came together.

## Objections

This next section addresses some objections to the idea of eliminating the live coding round.

### We Need to Move Quickly

An argument in favour of the timed live coding round is that projects need to meet deadlines, therefore companies need engineers that can code quickly.

In my experience on projects that were struggling to meet deadlines, the issue has never been that developers weren't hammering out the code fast enough.

![cat typing on laptop](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDRyNndwM2RnNG04MHZxbDEzczRiNjZ3YXV4czNreWE5d2dtamVmMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lzz3B3xLZluuY/giphy.gif "cat typing on laptop")

Some reasons I've seen projects take longer than expected include:

* Lack of knowledge among the team as to the full scope of the project.
* Shifting priorities requiring frequent context changes.
* Misunderstandings between client/product/design/engineering.
* Designers waiting on business requirements from product.
* Developers waiting on design comps where designers are striving for pixel perfection, when really, a napkin sketch would have sufficed to get the developers started.
* Overly engineered initial architecture that adds unnecessary overhead.
* Intermittent/flaky automated tests.
* Lack of system/end-to-end testing, and reliance on manual QA.
* Lack of (or out of date) engineering documentation.
* Inability to run some features on laptop due to complex architecture, or third party integrations that can't be run locally.

None of the above issues are resolved by hiring the fastest coder.

<aside class="markdown-memory-lane">
<h3>Trip down memory lane...</h3>
Many years ago I worked with an engineer who refused to ever go to the product manager to ask questions because he thought the definition of a senior was someone who has all the answers. The features he would deliver were frequently incorrect and required numerous lengthy meetings with the product manager and tech lead to clarify and multiple iterations (including multiple PR reviews and QA rounds!) to get right. This engineer was a brilliant and speedy coder. He would have excelled at any live-coding/LeetCode interview, and yet the team was struggling to deliver on anything he worked on, and required additional effort from many other team members. Delivering the wrong code quickly helps no one.
</aside>

### You Should Practice

When I've brought up the fact that these kind of "on the spot" puzzle solving skills are not required in actual engineering work, recruiters have acknowledged this, and then said "you should spend time practicing". Here's an example [practice list](https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions) that was recommended. Does it really make sense to have someone spend precious free time practicing for a test that doesn't even assess the actual skills needed for the job?

Multiply this time by all the engineers looking for a new role, say every few years, spending weeks on these practice exercises. Given that someone has free time to dedicate to technical extra-curricular activities, I can think of more meaningful things to be doing such as:

- Taking online courses to learn a new skill.
- Reading technical books.
- Building a side project to solve an [actual problem](https://syntax.fm/show/119/hasty-treat-better-living-through-side-projects).
- Volunteering to build software for an charitable organization.
- Writing technical articles, tutorials, create a course etc. to share knowledge.

To be clear, I'm *not* suggesting people *should* be spending their spare time doing any of the above. What I'm suggesting is that if someone has spare time that they'd like to spend on career development, the above can be more impactful than practicing LeetCode exercises.

### Fairness

Another push-back from companies when suggesting alternatives to the live-coding round is the desire to be "fair" by having everyone go through the exact same process. However, forcing all candidates through the same gate-keeping mechanism isn't genuinely fair.

I've been on the other side of the interview process and approach it with a legitimate curiosity about the candidate's experience. For example, if a candidate has listed both Kafka and RabbitMQ on their resume, then I'm going to ask them about that - such as what worked well and didn't work well on projects where they used these, what different behaviour did they observe on the projects that used these, what would they do differently if starting those projects from scratch, when would they use one vs the other, etc.

The fairness doctrine would suggest that I must ask every candidate the exact same list of questions. But if interviewing another candidate that hasn't used any messaging systems, would it really be fair to ask them questions about Kafka and RabbitMQ?

It's important to recognize that different candidates have different strengths and bring different valuable skills to the table. A one-size-fits-all approach can exclude talented individuals who would excel in the actual work environment. By offering alternative assessments, companies can create a more equitable hiring process that better identifies the most qualified candidates, regardless of their performance under artificially high-pressure conditions.

### Cheating

A concern companies may have regarding take-home assignments is the possibility of cheating, such as using generative AI or referencing external resources like Google or Stack Overflow. Throughout history, new tools and technologies often faced skepticism and were initially viewed as cheating.

However, the use of online resources like Google, Stack Overflow, and more recently, generative AI should be seen not as cheating, but as leveraging available tools to solve complex problems efficiently. If an existing employee uses Copilot, Google, or Stack Overflow to find a solution to a work-related problem, is that considered cheating?

The interview process needs to evolve with available tools. For example, allowing candidates to use generative AI during assessments can provide insights into their problem-solving approach, as in, can they spot the issues with the generated code such as bugs or maintainability issues. The ability of tools to generate code instantly, while not perfect, signals that gating candidates based on the skill of generating code on the spot may no longer be relevant.

## Suitable Scenarios for Live Coding

There are some scenarios where a live coding assessment may be useful.

In early-stage startups, the pace is extremely fast, and the priority is to deliver functional code as quickly as possible. This is not unlike a [hackathon](https://en.wikipedia.org/wiki/Hackathon), where the ability to jump in and write code rapidly is crucial. Frequent emergencies and production issues, which are likely in such settings due to the lack of extensive testing and established processes, require engineers who can quickly address problems and implement solutions on the fly.

![airplane quick fix](../images/airplane-quick-fix.jpg "airplane quick fix")

Another scenario could be a company that exclusively does pair, or [mob programming](https://en.wikipedia.org/wiki/Team_programming#Mob_programming), where engineers collaborate continuously, either in pairs or in larger groups, to write code together in real-time. This setup emphasizes real-time problem-solving, and constant "out loud" communication.

If a live coding round is necessary, provide candidates with the category of the problem beforehand so they can focus their preparation efforts accordingly. Ideally, this will be only one part of the overall process on which a candidate is being evaluated on, rather than a qualifier.

## Conclusion

This post has covered the shortcomings of current technical interview methods, particularly focusing on the live coding round, which often fails to accurately assess the skills and capabilities crucial for real-world software engineering roles. From biased evaluation against diverse thinking styles to unrealistic time pressures, this practice can inadvertently exclude qualified candidates.

However, there is hope for improvement. By re-evaluating the assessment criteria to align more closely with the skills that drive successful engineering projects, a more effective and inclusive hiring process is possible.
