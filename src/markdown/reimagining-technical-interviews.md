---
title: "Re-imagining Technical Interviews: Valuing Experience Over Exam Skills"
featuredImage: "../images/reimagine-tech-interviews-dave-mcdermott-nEJmnfCCPmI-unsplash.jpg"
description: "Exploring the shortcomings of traditional technical interviews and advocating for more relevant assessment methods to better reflect the demands of modern software engineering roles."
date: "2024-07-01"
category: "career"
related:
  - "The Development Iceberg: Unseen Efforts That Extend Project Schedules"
  - "Reflections on Effective Teams"
  - "Solving a Python Interview Question in Ruby"
---

As I navigate the job search process anew, I'm struck by how sub-optimal technical interviewing has become. Despite my extensive experience spanning over two decades in software engineering, I've encountered practices that seem disconnected from the real-world demands of our profession. This post will review the shortcomings of current technical interview methods, explore why they fail to capture true engineering skill, and propose more effective alternatives.

## Disclaimer

Before diving into my observations and suggestions, it's important to note that my experiences are based on applying for senior/staff positions in web development. The tech industry is vast, encompassing areas such as gaming, embedded systems, data science, and more. Each of these fields has its own unique set of challenges, expectations, and interview processes. What I discuss here may not fully apply to those areas.

## Live Coding Round

Many companies, as the first part of the interview process have what's called a live coding round. In this session, the candidate gets on a video call with another engineer(s) at the hiring company, and is told to click a link to a shared coding environment such as CodeSignal, CoderPad, etc. There they are presented with a problem to solve, often in the form of write a method that takes arguments `foo`, `bar`, etc. and produces some output `baz`.

This could be a "leetcode" style question involving computer science theory. For example [Reverse a Linked List](https://leetcode.com/problems/reverse-linked-list/description/), [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/description/), [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/description/). Or it could be a question from the company's domain.

The candidate is told it's a timed exercise, and they're expected to solve the problem in the allotted time, usually under an hour. Furthermore, the candidate is expected to talk out loud as they're solving the coding challenge to explain their thought process. And on top of all that, they're expected to consider whether they're choosing the most appropriate data structures, efficiency (i.e. Big O complexity analysis), and clean code principles, aka legibility.

This is often used as a *qualifying* round, meaning if the candidate does not complete the task in the expected time with expected quality, then they are immediately eliminated from the process. In other words, this live exam is used as a gate-keeping exercise, to keep out people who don't do well under this very specific set of circumstances.

## Problems

The technical round of live coding interviews, while common, has several flaws that can inadvertently exclude talented individuals who might otherwise be a great fit for the role. The next sections cover the issues with this approach.

### Leetcode

For companies that choose to use leetcode exercises for the evaluation, these are an unrealistic reflection of daily engineering work. Often, the complexity in software engineering comes from trying to figure out *what* to build rather than *how* to build it. In over 20 years of software development, I've never encountered a linked list!

If and when a more algorithmic style of problem is encountered on the job, it can be looked up rather than having memorized computer science theory from one's school days. When these problems do come up on the job, they're usually on projects spanning weeks or even months, so the code is not arrived at in one hour. Some public examples I can share include [graph generation for an interactive exploration](https://github.com/danielabar/globi-proto/blob/master/app/scripts/services/graphservice.js) of marine ecosystem species,  [optimize text placement along an svg path](https://github.com/danielabar/canve-viz/commit/d026efa6b8f0c9841549040305e0694277bff4a4), [matrix manipulation for 3D computer graphics](https://github.com/danielabar/coursera-webgl/tree/master), and [generation of points along an arc for custom animation](https://github.com/danielabar/framegen/blob/master/FramegenCore/src/main/java/com/framegen/core/framehandler/option/ArcFrameHandler.java). All of these were long running projects that involved many iterations.

As for Big-O complexity analysis, while this is a useful principle to understand, it doesn't make sense to gate-keep on this. I have resolved many performance issues over the years, and the root cause has never been from a method that was written in O(n) time when it could have been O(log n). Common causes of performance issues in web applications include: loading too much data from the server (eg: lack of pagination), missing database indices, database tuning/configuration, N+1 queries, lack of (or misconfigured) background task processing, or loading too much JavaScript, such as trackers or non-minified code in the browser.

***Trip down memory lane..***

An argument could be made that this is a useful interview technique for a junior engineer, as a recent computer science or bootcamp graduate may not have significant real world experience. There may be some truth to this, but even so, I recall as a junior, being struck by just how different the actual demands of an engineering job were from school assignments. For example, one of my first work tasks was to integrate an affiliates program into a major retailer's e-commerce system. This involved discussions with the marketing team to determine what they actually needed, reading documentation from the affiliates vendor to understand the integration options, discussions with the operations team to determine potential performance impacts, analysis of the database to determine what changes were required to the data model, analysis of the codebase to determine where to hook in the new code, and of course, some actual coding of the solution. The biggest challenge was figuring out *what* to build and *how to integrate* into the existing code base.

### Time Pressure

Even if companies choose a problem from their domain rather than theoretical computer science type exercises, there are still problems with the timed live coding round.

The artificial time constraint creates a "race against the clock mentality", which can create a "fight or flight" response:

![white rabbit race against the clock](../images/white-rabbit-late-crop.png "white rabbit race against the clock")

There's some discussion in the [scientific literature](https://www.psychologytoday.com/us/blog/202301/does-the-amygdala-hijack-your-brain) as to whether the amygdala (brain region associated with fear and emotion processing) "hijacks" the pre-frontal cortex (brain region associated with logical reasoning) or whether they work in co-operation. I'm not a neuroscientist so I can only express how this scenario *feels*: When presented with a short time interval in which to solve a problem, all my brain can focus on is the clock ticking down the minutes. This makes my usual analytical skills fade into the background compared to the fear response, and negatively impacts my performance.

Using "on the spot" coding/analysis/thinking-out-loud in under an hour is not a proxy for what an effective engineer actually does. In real-world settings, software engineers often have access to resources like documentation, the ability to collaborate with colleagues, and time to research and think through problems.

<aside class="markdown-aside">
Having at least one night to "sleep on it" is also critical, as the brain uses sleep to integrate and solidify learnings from the day. Learn more about this in <a class="markdown-link" href="https://www.goodreads.com/book/show/34466963-why-we-sleep/">Why We Sleep</a> by Matthew Walker.
</aside>

Also, in a typical development cycle, the very first solution that comes to mind is almost never the one that gets delivered to production. Instead, there's a period of days or even weeks spent refining the solution, addressing edge cases, and ensuring robustness. Yet, live coding interviews judge candidates based on their ability to immediately produce a fairly polished solution.

***Trip down memory lane...***

I can recall very few scenarios in my decades long career where the ability to write some code, literally within a few hours, was critical to the team's success. In one instance, the team was told at the last minute that a VIP was scheduled to come by the next day for a demo. The product was working, but wasn't yet styled, so it looked broken. In this case, I had just a few hours to tidy up the styles to make a certain portion of the product to be demo-ed look functional. And even then, it was a product I had been working on for nearly half a year and was therefore very familiar with.

### Talking Out Loud

Individuals who are introverted or prefer to process information internally may struggle with the expectation to think out loud and articulate their thought process in real-time.

Speaking from my own experience, I find it nearly impossible to think about a solution to a coding problem *and* talk out loud about it at the same time. I can however explain it in a written format, after the problem is solved, and generate educational materials such as engineering documentation or a [blog post](../python-interview-question-in-ruby).

By rejecting candidates for not being able to think out loud and code at the same time, it creates the impression that only one particular way of thinking is valued.

### Bias Towards Quick Thinkers

The ability to solve problems quickly under observation is not necessarily indicative of an individual's overall problem-solving skills or coding proficiency in a less pressured environment. Many complex software problems require extended periods of deep thought and experimentation, which are not represented in short, timed coding challenges. This is particularly true when hiring at a senior, staff, or higher level.

By emphasizing a specific way of thinking and solving problems, companies may miss out on candidates who offer unique and diverse approaches to problem-solving. Diverse teams are known to drive innovation, and by excluding those who do not excel in live coding interviews, companies risk creating homogenous teams that lack creative and innovative thinking.

There are professions where the ability to think quickly on your feet in response to surprises is useful. For example courtroom lawyer, standup comic, improv actor, combat pilot, emergency room doctor. But I don't think software engineering generally fits into this list.

Occasionally, quick thinking is required of software engineers, such as when resolving a production outage or a bug that's blocking some a feature from functioning correctly. However, if companies qualify candidates primarily based on this ability, it gives the impression that the company regularly faces these emergencies, which might not be the intended message. Furthermore, if a company does frequently experience production emergencies, hiring the fastest coder may not address the root cause of these issues.

***Trip down memory lane...***

I recall one scenario earlier in my career where a deployment caused a critical feature to malfunction shortly after release. This incident occurred before the widespread adoption of containerized deployments and automated CI/CD pipelines, which simplify rollbacks and mitigate such risks. The team had to quickly diagnose and resolve the issue to restore functionality promptly. Since then, modern practices in deployment and continuous integration have significantly enhanced the ability to manage such challenges.

### Lack of Empathy

The nature of the live coding "solve this method" type of question can induce a lack of empathy on the side of the assessor. This is because they already know the solution, so they're in a fixed mindset of either the candidate achieves a working solution or they don't. If they've been doing this interview style for a long time, they've likely forgotten what it was like to not know the answer.

On the job, when a problem is first presented to a team of developers, no one knows what the correct solution is. So as people propose and try out different ideas, they're not judged on right or wrong, but rather, that's the expected iterative process of software development.

### Qualifier

Some companies use this round as a qualifying step, meaning it's the first phase in the interview process, and if the candidate doesn't pass, they're immediately rejected. Attempting to condense 5, 10, or more years of experience into a one-hour, high-pressure, and unrealistic test-taking session is not an accurate assessment of a candidate's capabilities.

## Making Things Better

Now that we've covered the problems with live coding as an interview technique, let's turn our attention to how the process could be improved.

A good starting point is a brainstorming exercise to determine what are the qualities of an effective engineer at the level being hired for. I would encourage everyone who has a say in defining interview processes to open up your company's performance review template for the role, and identify the key points that engineers are evaluated on. For example, here's a few from my past roles as senior and staff engineer:

- technical skills
- code quality
- communication
- conducting effective PR reviews
- mentoring
- problem solving & root cause analysis
- prioritizing
- collaboration & teamwork
- technical leadership
- scalable and performant solutions
- process improvements
- adaptability & continuous learning

Then open up the project team's retrospectives for the past few months, and review what went well and what didn't. Try to identify some themes for what makes engineering successful at your organization and what are the challenges. Cross reference this with current engineers that are performing well and identify their qualities that are driving the team's success. Is it really their ability to hammer out a reverse linked list in record time? I've never been in a retrospective that recorded "this sprint didn't go well because the developers couldn't figure out whether an array or hash was appropriate in this method".

The outcome of the above brainstorming can be used to guide the interview process, thinking about how to assess for qualities the company needs for successful engineering teams. Of course technical proficiency will be up there, but so will other qualities.

Another important consideration is the format. Some topics are suitable for a conversational/real-time format, such as discussions about the candidate's past experiences. On the other hand, "forging new knowledge", where the candidate is asked to solve a problem, is more suited to async style, where the candidate works through a problem on their own, in quiet, and then there's a follow on conversation about the solution.

The next sections describe some alternatives.

### Greenfield a Small Project

In my experience, the reason projects struggle is often related to communication issues, in understanding business requirements and understanding what other developers did previously. In this case, here's an alternative to the live coding round to assess both technical skills and the ability to communicate effectively.

Email the candidate an assignment they'll do on their own. Intentionally make the problem statement vague, the way a business person might word things. Let the candidate know that the first part of the assignment is for them to take the time to think about clarifying questions, and to email back a list of questions to the company. Emphasize they're being evaluated on their questions at this point, not on knowing the answers. And it's ok to send a question like "I'm not familiar with this business process, can you share more detailed steps on what's involved here".

Then the team assessing the candidate can send back answers to the questions (answer them in such a way that the solution can be coded, tested, and documented in a few hours, i.e. not much longer than the live coding round would have been).

Then the candidate can go ahead and solve the problem on their own time, with their own editor, tooling, keyboard shortcuts etc. This is very reflective of how things happen on the job. Based on questions developers think of, often the product manager will be like "Good question! I hadn't thought of that case". Then the solution may take a different shape.

If writing automated tests is important to the company, as part of the assignment, let the candidate know to include *some* automated testing. This need not include 100% coverage as that's more time than can reasonably be asked of someone who is doing unpaid work. However, the goal here is to see if they can identify the critical path(s) in the code and ensure these are covered with meaningful tests.

If engineering documentation is important to the company, as part of the assignment, let the candidate know to provide setup and "how to" instructions in the Readme so that the assessor can setup the project and reproduce the solution. Tell them that the goal of this write-up is to ensure that another developer could pick up where they left off and further enhance the product.

After the candidate submits the solution, a follow-on meeting can be scheduled to discuss it. Such as what was the most challenging part, why the given solution was chosen, what trade-offs were considered etc. Part of the assessment can also include, how easy was it to follow along with the setup instructions? How easy would it be to enhance the solution to add more features?

**Benefits of this alternative approach:**

Captures essential skills that deeply impact projects, beyond writing working code: question asking, analytical thought, automated testing, engineering documentation, overall communication.

Due to the dynamic nature of what questions the candidate may ask, the solution could be different for each candidate. This means the assessor doesn't know the exact solution at the start of the assignment. This can improve empathy for the candidate in the process because everyone is figuring out the solution as part of the process. This avoids the fixed mindset of this candidate got the solution correct, good or incorrect, bad.

### Add a Feature

It's well known that engineers spend a lot more time reading code other people wrote to determine where their new code fits in, rather than starting from a blank slate.

A variation on the previous assessment (again to be done asynchronously) is to send the candidate some working code. Then the assignment is to enhance it with a new feature (again, going through a round of clarifying question asking). This is testing for the real world skill of being able to analyze existing code, figure out what if anything can be re-used, and to integrate new code.

If doing this, make sure to send the existing code in a language the candidate is familiar with.

### Fix a Bug

Another variation on the previous assessment is to send the candidate some existing code that runs, but isn't behaving correctly. Send them a bug report along with the code sample. Ideally this bug report will be in the form of: Steps to Reproduce, Expected Result, Actual Result. Then have the candidate resolve the bug. Part of this assessment could also include maintaining the tests and a brief write-up explaining what techniques were used to troubleshoot and what was the issue.

### Review a Pull Request

If the role that's being hired for involves extensive PR reviews, this can be another type of assessment that can be done asynchronously.

Ask candidates to review a piece of code, identify issues, and suggest improvements. This assesses their understanding of code quality and best practices. Evaluate how empathetic that candidate is and how they word their feedback.

### Deep Dive Technical Walkthrough

If the candidate has some existing work that they can share, another way to assess technical proficiency is to have them give a detailed technical walkthrough of a feature they've developed. This can cover the initial analysis, what problems were encountered in implementation, and how the final solution came together.

## Objections

This next section addresses some objections to the idea of eliminating the leetcode/live-coding round in favour of an asynchronous assessment.

### We Need to Move Quickly

An argument in favour of the timed live coding round is that projects need to meet deadlines, therefore companies need engineers that can code quickly.

In my experience on projects that were struggling to meet deadlines, the issue has never been that developers weren't hammering out the code fast enough.

![cat typing on laptop](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDRyNndwM2RnNG04MHZxbDEzczRiNjZ3YXV4czNreWE5d2dtamVmMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lzz3B3xLZluuY/giphy.gif "cat typing on laptop")

The "hands-on-keyboard" time is often the fastest part of the process, more on this topic in [The Development Iceberg](../development-iceberg).

Some reasons I've seen projects take longer than expected include:

* Lack of knowledge among the team as to the full scope of the project.
* Misunderstandings between client/product/design/engineering.
* Designers waiting on business requirements from product.
* Developers waiting on design comps where designers are striving for pixel perfection, when really, a napkin sketch would have sufficed to get the developers started ([ShapeUp](https://basecamp.com/shapeup) can help with this).
* Overly engineered initial architecture that adds unnecessary overhead.
* Unmaintained intermittent tests resulting in developers spending time investigating false negatives.
* Lack of system/end-to-end testing requiring manual QA to avoid regressions, which creates bottlenecks.
* Lack of (or out of date) engineering documentation such as how to setup the project or work with third party integrations. This makes even seemingly simple changes take longer for developers to figure out how to exercise the portion of the code requiring changes.
* Inability to run some features on laptop due to complex microservices architecture, or third party integrations that can't be run locally.

None of the above issues are resolved by hiring the fastest coder.

***Trip down memory lane...***

Many years ago I worked with a senior engineer who refused to ever go to the product manager to ask questions because he thought the definition of a senior was someone who has all the answers. The features he would deliver were frequently incorrect and required numerous lengthy meetings with the PM and tech lead to clarify and multiple iterations (including multiple PR reviews and QA rounds!) to get right. This engineer was a brilliant and speedy coder. He would have aced any leetcode interview, and yet the team was struggling to deliver on anything he worked on, and required additional effort from many other team members. Delivering the wrong code quickly helps no one. A leetcode style exam won't catch this because the requirements are specified so clearly.

### You Should Practice

When I've brought up the fact that these kind of "on the spot" puzzle solving skills are not required in actual engineering work, recruiters have acknowledged this, and then said "you should spend time practicing". Let's think about this: A company is hiring for, let's say a staff engineer, so they reach out to them based on their LinkedIn profile, and their years of experience. But somehow they're unable to assess that so now the candidate needs to spend their precious free time practicing for a test that doesn't even assess the actual skills they're being hired for?

Multiply this out by all the engineers looking for a new role, say every few years, spending weeks on these practice exercises. How many more valuable things could have been achieved with all this time?

Given that an engineer actually has some free time to dedicate to any sort of technical extra-curricular activity, I can think of so many more valuable things to be doing, for example:

- Taking online courses to learn a new skill or something tangentially related.
- Reading technical books.
- Building side projects to explore a new tech stack or solve an [actual problem](https://syntax.fm/show/119/hasty-treat-better-living-through-side-projects).
- Volunteering to build software for an charitable organization.
- Writing technical articles, tutorials, create a course etc. to share what you're learning.

To be clear, I'm *not* suggesting people should be spending their spare time doing any of the above. What I'm suggesting is that if someone has spare time that they'd like to spend on career development, the above can be more impactful than practicing leetcode exercises.

### Fairness

Another push-back from companies when suggesting alternatives to the live-coding round is the desire to be "fair" by having everyone go through the exact same process. However, forcing all candidates through the same gate-keeping mechanism isn't genuinely fair.

I've been on the other side of the interview process at times and approach it with a legitimate curiosity about the candidate's experience. For example, if a candidate has listed both Kafka and RabbitMQ on their resume, then I'm going to ask them about that - such as what worked well and didn't work well on projects where they used these, what different behaviour did they observe on the projects that used these, what would they do differently if starting those projects anew, when would they use one vs the other, etc.

The "fairness" doctrine would suggest that I must ask every candidate the exact same list of questions. But if interviewing another candidate that hasn't used any messaging systems, would it really be fair to ask them questions about Kafka and RabbitMQ?

It's important to recognize that different candidates have different strengths and bring different valuable skills to the table. A one-size-fits-all approach can exclude talented individuals who would excel in the actual work environment. By offering alternative assessments, companies can create a more equitable hiring process that better identifies the most qualified candidates, regardless of their performance under artificially high-pressure conditions.

### Cheating

A concern companies may have regarding take-home assignments is the possibility of cheating, such as using generative AI or referencing external resources like Google or Stack Overflow. Throughout history, new tools and technologies often faced skepticism and were initially viewed as cheating. For instance, when calculators were introduced, they were considered cheating in engineering and math exams. However, over time, they became widely accepted as essential productivity tools that enhance professionals' abilities.

Similarly, the use of online resources like Google, Stack Overflow, and more recently, generative AI should be seen not as cheating, but as leveraging available tools to solve complex problems efficiently. If an existing team member uses Copilot, Google, or Stack Overflow to find a solution to a work-related problem, is that considered cheating?

The interview process needs to evolve with available tools. For example, allowing candidates to use generative AI during assessments can provide insights into their problem-solving approach, as in, can they spot the issues with the generated code such as bugs or maintainability issues. The ability of tools to generate code instantly, while not perfect, signals that gating candidates based on the skill of generating code on the spot may no longer be relevant.

## Suitable Scenarios for Live Coding Interviews

While live coding interviews often fail to accurately assess seasoned software engineers, they might be appropriate for specific types of companies.

For example, in early-stage startups, the pace is extremely fast, and the priority is to deliver functional code as quickly as possible. This is not unlike a [hackathon](https://en.wikipedia.org/wiki/Hackathon), where the ability to jump in and write code rapidly is crucial. Frequent emergencies and production issues, typical in such settings due to the lack of extensive testing and established processes, require engineers who can quickly address problems and implement solutions on the fly, and who thrive in the ensuing chaos.

Another scenario could be a company that exclusively does pair, or even mob programming, where engineers collaborate continuously, either in pairs or in larger groups, to write code together in real-time. This setup emphasizes real-time problem-solving, and constant "out loud" communication.

In this case, it would be beneficial for the company to clearly state this in the job description. For example, in a "How we work" section, they could explain that developers do not sit alone to think. Instead, they will always be paired with another developer or work at the same time with a team of developers, all looking at the same screen and taking turns with the keyboard. Candidates should know that they will be expected to constantly verbalize the solutions they're thinking about as they write the code. This will help to attract people that enjoy working like this.

If a live coding round is necessary, provide candidates with a broad category of the problem beforehand so they can prepare accordingly. The scope of challenges engineers tackle is extensive, ranging from tasks like implementing graph algorithms or optimizing database queries to addressing intricate concurrency issues.

## Conclusion

This post has covered the shortcomings of current technical interview methods, particularly focusing on the live coding round, which often fails to accurately assess the skills and capabilities crucial for real-world software engineering roles. From biased evaluation against diverse thinking styles to unrealistic time pressures and limited reflection of actual job demands, these practices can inadvertently exclude highly qualified candidates.

However, there is hope for improvement. By reevaluating the assessment criteria to align more closely with the skills that drive successful engineering projects, such as problem-solving, communication, collaboration, and adaptability, companies can create a more effective and inclusive hiring process. Alternative methods like project-based evaluations, asynchronous assignments with emphasis on communication and documentation, and realistic scenarios that simulate real-world challenges can better identify qualified candidates.

## TODO
* edit
* real world -> on the job or find more suitable phrase
* problems that are that well specified down to the method name, input and output format don't get assigned to seniors. And arguably with generative AI, these kinds of problems will no longer be done by human at all so does it even make sense to test for this?
* exceptions for if company's domain does directly require comp sci theory, eg: navigating social graph, animation, physics, etc.
* custom style for "trip down memory lane" sections?
* interview process should be included in the JD (some companies are doing this, good!)
* maybe ref LI post to show the discussion https://www.linkedin.com/posts/gabag26_leetcode-codinginterview-softwareengineering-activity-7203974232509173760-92WZ/
* define leetcode
* maybe another objection: We don't have time for the async assessment. Then think about - do you have time to keep re-hiring if the leetcode/live-coding isn't accurately assessing for required skills?
* emphasize: I'm not suggesting to include *all* of these exercises - this is to get people thinking about alternative assessment techniques that capture real world conditions and lessen performance anxiety/stress.
* if you can't fathom the interview process without a live coding round, at the very least, don't make it a qualifying round, take into account all the skills and experience the candidate brings to the table rather than focusing on this one particular skill
* Where does this fit in?
  When is this actually useful?
  1. Programming competitions
  2. Hack-a-thons
  3. Production is down or particular page on website is broken that impacts revenue generation
  For the first two, most companies aren't doing that (I mean unless the company is a known host/sponsor of programming competitions, in this case, maybe they do need developers to be representative of this particular skill set, but this is not most companies), and the resulting code quality is not what most companies would want to maintain long term in any case. And even then, candidates in competitions and hack-a-thons are not asked to talk out loud about their process as they're coding.
  For the third one, since the modern introduction of containerized deployments and blue/green etc, the correct solution is to usually rollback the deployment rather than to try to fix the broken airplane in the air - TODO: image...

* Ref Syntax Podcast: https://syntax.fm/show/781/potluck-the-value-of-typescript-vue-vs-svelte-leetcode 36:15 "Leetcode type interview questions"
> Not a definitive judgement on someone's abilities or skills
> I would hope that companies are getting away from these types of interviews
> Knowing how to solve leetcode problems is a completely different skill than what we do on a daily basis
> It's valuable in knowing did this person study leetcode style problems... It's a very specific skill set
> When you test someone on a leetcode in an interview, you're testing are they good at solving leetcode problems, you're not testing are they good at writing software, working on a team, implementing features, communicating well, and all the other things that are important besides just being able to code real good
> Best technical interview I've had, they dropped me into a sample code base, gave me an example ticket that would look exactly like what I would get on a day in the job, and worked through it together.

* Ref Reddit Discussion: https://www.reddit.com/r/cscareerquestions/comments/pbyn4v/comment/haf88zj/
* Ref Reddit, if perf issue, re-evaluate business requirements: https://www.reddit.com/r/cscareerquestions/comments/pbyn4v/comment/haf9j5q/
