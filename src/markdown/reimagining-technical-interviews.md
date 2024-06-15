---
title: "Re-imagining Technical Interviews: Valuing Experience Over Exam Skills"
featuredImage: "../images/reimagine-tech-interviews-dave-mcdermott-nEJmnfCCPmI-unsplash.jpg"
description: "tbd"
date: "2024-07-01"
category: "career"
related:
  - "The Development Iceberg: Unseen Efforts That Extend Project Schedules"
  - "Reflections on Effective Teams"
  - "Solving a Python Interview Question in Ruby"
---

As I navigate the job search process anew, I'm struck by how sub-optimal technical interviewing has become. Despite my extensive experience spanning over two decades in software engineering, I've encountered practices that seem disconnected from the real-world demands of our profession. This post will delve into the shortcomings of current technical interview methods, explore why they fail to capture true engineering talent, and propose more effective alternatives.

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

## Problems

The technical round of live coding interviews, while common, has several flaws that can inadvertently exclude talented individuals who might otherwise be a great fit for the role. The next sections cover the key issues with this approach.

### Leetcode

The first problem with these exercises is that they're unrealistic reflection of daily engineering work. Often, the complexity in software engineering comes from trying to figure out *what* to build rather than *how* to build it. From my over 20 years experience in mostly web application development, I've certainly never seen a linked list in any web app! And the few times that something like this comes up (eg: traversing a tree-like structure), it can be looked up rather than trying to memorize university level comp sci theory.

TODO: Example of needing linear algebra/matrix knowledge for 3d webgl computer graphics...

As for Big-O complexity analysis, while this is a useful principle to understand, it doesn't make sense to gate-keep on this. I have resolved many performance issues over the years, and the root cause has never been from a method that was written in O(n) time when it could have been O(log n). Common causes of performance issues include: loading too much data from the server (eg: lack of pagination), missing database indices, N+1 queries, lack of background task processing, or loading too much JavaScript, such as trackers or non-minified code in the browser.

Trip down memory lane...
An argument could be made that this is a useful interview technique for a junior engineer, as a recent comp sci graduate may not have real world experience (unless they've done co-op or summer internships). There may be some truth to this, but even so, I recall as a junior, being struck by just how different the actual demands of an engineering job were from school assignments. For example, one of my first work tasks was to integrate an affiliates program into a major retailer's e-commerce site. And that one sentence was just about all that initially came in as the business requirements from the marketing department. This task involved discussions with the marketing team to determine what they actually needed, reading documentation from the affiliates vendor to understand the integration options, discussions with the operations team to determine the performance impact of different options, analysis of the data model to determine what changes were required to the database, analysis of the codebase to determine where to hook in the new code, and of course, some actual coding of the solution. And when it came time to do the coding, no one was watching me type with a timer, expecting me to talk out loud as I typed.

None of this could be completed in under an hour. The biggest challenge was figuring out what to build and how to integrate it into the existing code base. And the most useful of my skills was in figuring out who to talk to and having productive conversations. None of these skills is captured in a live coding assessment.

But even if companies choose a problem from their domain rather than theoretical leetcode type exercises, there are still problems with the timed live coding round.

### Time Pressure

The live coding round creates a "race against the clock mentality" - TODO: find white rabbit image from Alice in Wonder with the clock.
TODO: Fight or flight response, impact on pre-frontal cortex

Using "on the spot" coding/analysis/thinking-out-loud in under an hour is not a proxy for what an effective engineer actually does

In real-world settings, software engineers often have access to resources like documentation, the ability to collaborate with colleagues, and time to research and think through problems. Live coding interviews typically do not allow for these. How often has it happened that the very first solution that popped into your head upon hearing the initial business requirements is the one that was delivered to production? Almost never, there's usually days or even weeks in between to clarify, develop, and iterate on the solution.

Trip down memory lane...
- I can recall very few scenarios in my 20+ year career, where the ability to write some code very quickly on the spot was critical to the team's success. In one instance, a VIP was unexpectedly scheduled to come by the next day for a demo of a WIP product, the product was working, but didn't have functional styles so it looked broken. In this case, I had just a few hours to tidy up the styles to make a certain portion of the product to be demo-ed look functional.
- AND EVEN THEN, it was a product I had been working on for nearly half a year and was thus very familiar with it, and no one was hovering over my shoulder watching and judging my every line of css, such as the mistaken ones I had to remove if it didn't look quite right. And I wasn't required to talk out loud to another engineer as I was updating each line of css.

An argument in favour of the time pressure is that projects need to meet deadlines so companies need engineers that can code quickly. In my experience on projects that were struggling to meet deadlines, the issue has never been that developers weren't hammering out the code quickly enough. In fact, the "hands-on-keyboard" time is often the fastest part of the process (ref: dev iceberg).

Some reasons I've seen projects take longer than expected include:
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

Many of the above stated issues are of communication or overall project architecture, and will not be resolved by hiring the fastest coder.

Trip down memory lane...
Example: Story of senior engineer who on principle refused to ever go to PM to ask questions because he thought the definition of a senior was someone who has all the answers. The features he would deliver were frequently incorrect and required numerous lengthy meetings with the PM and team lead to clarify and multiple iterations (including multiple PR reviews and QA rounds!) to get right. I want to emphasize this engineer was a brilliant and speedy coder. He would have aced any leetcode interview, and yet the team was struggling to deliver on anything he worked on, and required additional effort from many other team members. Delivering the wrong code quickly helps no one. A leetcode style exam won't catch this because the requirements are specified so clearly.

### Talking Out Loud

Live coding interviews create a high-pressure environment that can induce anxiety and stress, affecting the candidate's performance. This pressure does not accurately reflect the typical working conditions of a software engineer. Many people experience nervousness when being watched, which can hinder their ability to think clearly and solve problems effectively.

Individuals who are introverted or prefer to process information internally may struggle with the expectation to think out loud and articulate their thought process in real-time. Candidates with neurodivergent conditions, such as autism or ADHD, might find it challenging to perform under the specific constraints of live coding, even if they excel in actual work scenarios.

Speaking from my own experience, I find it nearly impossible to think about a solution to a coding problem *and* talk out loud about it at the same time. I can however explain it in a written format, after the problem is solved, and generate educational materials such as internal engineering documentation or a public blog posts. However, by rejecting candidates for not being able to think out loud and code at the same time, companies are showing that they only value one particular way of thinking.

### Compressing the dev cycle

- Trying to compress the principle of "first make it work, then make it right, then make it fast", which almost never happens all in under an hour.
- This also goes against real world practice of avoiding premature optimization - first get something working, then measure using observability tools for memory usage, performance etc.
- real world is not like this - when a new feature or problem arises in the real world, its often contextual - requiring knowledge of the companies existing systems and business processes. And typically, there is a lot of back and forth iteration with developers reading the requirements, going back to PM with clarifying questions, requirements getting updated, then tests get written, then the code gets written, maybe it gets deployed to get early feedback from PM if things are on the right track.
- And only then can developer think about optimizing code for legibility and performance, given that the right level of automated tests (from unit, integration, and system/end-to-end) are in place to ensure any refactoring doesn't break functionality
- How often has it happened that the very first solution that popped into your head upon hearing the initial business requirements is the one that was delivered to production? Almost never, there's usually days or even weeks in between to clarify, develop, and iterate on the solution. And yet, the live coding round does exactly this and judges you based on essentially, the first thing that pops into your head.
- Imagine as an employee, if your performance evaluation was based on the very first ideas that popped into your head? If that doesn't make sense, then why are we evaluating candidates this way?

### Bias Towards Quick Thinkers

The ability to solve problems quickly under observation is not necessarily indicative of an individual's problem-solving skills or coding proficiency in a less pressured environment. Many complex software problems require extended periods of deep thought and experimentation, which are not represented in short, timed coding challenges. Especially when hiring at a senior, staff, or above level, it's likely been a long time since that person was solving "exam" style questions.

Arguably, if a problem is so well specified and the scope so small that it can be solved in under an hour, it's more likely to be assigned to an intern or junior as an introductory exercise, rather than a senior or staff.

By emphasizing a specific way of thinking and solving problems, companies may miss out on candidates who offer unique and diverse approaches to problem-solving. Diverse teams are known to drive innovation. By excluding those who do not excel in live coding interviews, companies risk creating homogenous teams that lack creative and innovative thinking.

TODO: Where to fit in, at beginning of this section?
I can think of a few jobs where the ability to think quickly on your feet in response to surprises is useful:
* Courtroom lawyer
* Standup comic
* Improv actor
* Combat pilot
* Emergency room doctor

TODO: Also this
Imagine if every time a new project is proposed to an engineering team, every team member was forced to blurt out the first solution that came to mind. Then at the end of the project the delivered solution was compared to what everyone said at the beginning. And then performance evaluations were written based on how accurately the first thing people thought matched what actually got delivered. This is essentially what's happening in these live coding interviews.

### Lack of Empathy

The nature of the live coding "solve this method" type of question induces a lack of empathy on the side of the assessor. This is because they already know the solution, so they're in a fixed mindset of either the candidate achieves a working solution or they don't. And if they've been doing this interview style for a long time, they've likely forgotten what it was like to not know the answer.

But in the real world, when a problem is first presented to developers, no one knows what the correct solution is. So as people propose and try out different ideas, they're not judged on right or wrong, but rather, that's the expected iterative process of software development.

### Qualifier

TODO: Some companies use this round as a qualifying round, meaning its the first step in the interview process and if the candidate doesn't pass, then they're immediately rejected. Trying to boil down 5, 10, even 15, 20 years worth of experience into a one hour high pressure, unrealistic test taking session just doesn't make sense.

## Making Things Better

Now that we've thoroughly covered the problems with live coding as an interview technique, let's turn our attention to how the process could be improved.

To start with, I would encourage everyone who has a say in defining interview processes to open up your company's performance review template for engineers (at whatever level you're hiring for), go over it and make a note of the key points that engineers are evaluated on. For example, here's a few points from my past roles as senior and staff engineer:

- technical skills
- code quality
- communication
- conducting effective PR reviews
- mentoring
- problem solving & root cause analysis
- prioritizing tasks
- collaboration & teamwork
- technical leadership
- scalable and performant solutions
- process improvements
- adaptability & continuous learning

Then open up the project team's retrospectives for the past few months, and review what went well and what didn't. Try to identify some themes for what makes engineering successful at your organization and what are the challenges. Cross reference this with current engineers that are performing well and identify their qualities that are driving the team's success. Is it really their ability to hammer out a reverse linked list in record time?

On the flip side, also think about what engineering teams are struggling with currently and what could make things better.

Also think about how your current engineering employees solve problems today? When a new feature is requested - do you put forth a blank editor in front of them and expect them to code up a working, efficient solution right there on the spot? Or do they take the time to read the requirements, go back and forth with PM on clarifications, maybe do a spike or two, then gradually work on the solution over a few days, deploying their work as they go and getting feedback from PM, and perhaps QA.

The outcome of the above brainstorming can be used to guide the interview process, thinking about how an interview process can select for the qualities the company needs for successful engineering teams.

Notice how it's unlikely that "the ability to code a working solution from first seeing the problem statement, in under an hour, while talking aloud and someone watches" is on the list of things employees are evaluated on. It's also unlikely to find something like this in the retrospective what didn't go well section, i.e. "this sprint didn't go well because the developers couldn't figure out whether an array or hash was appropriate in this method".

TODO Another important consideration is the format. Some topics are suitable for conversational/real-time - such as the candidate's past experiences. Other topics are more suited to async style, where the candidate works through a problem on their own, in quiet, and then there's a follow on conversation about the solution. "forging new knowledge" such as being asked to solve a specific coding challenge, or to think through a data modelling exercise is better done async, to mimic how this is done on the job.

The next sections describe some alternatives.

### Example: TBD Title

In my experience, the reason projects struggle is often related to communication issues, in understanding business requirements and understanding what other developers did previously. In this case, here's an alternative to the live coding round to assess both technical skills and the ability to communicate effectively:

Email the candidate an assignment they'll do on their own. Intentionally make the problem statement vague, the way a business person might word things. Let the candidate know that the first part of the assignment is for them to take the time to think about clarifying questions, and to email back a list of questions to the company. Emphasize they're being evaluated on their questions at this point, not on knowing the answers. And it's ok to send a question like "I'm not familiar with this business process, can you share more detailed steps on what's involved here".

Then the team assessing the candidate can send back answers to the questions (answer them in such a way that the solution can be coded, tested, and documented in a few hours, i.e. not much longer than the live coding round would have been).

Then the candidate can go ahead and solve the problem on their own time, with their own editor, tooling, keyboard shortcuts etc. Since each candidate may come up with different questions, the direction the solution may also vary. This is very reflective of how things happen in the real world. Based on questions developers think of, often product will be like "Good question! I hadn't thought of that case". Then the solution may take a different shape.

If writing automated tests is important to the company, as part of the assignment, the candidate should include *some* automated testing. This need not include 100% coverage as that's more time than can reasonably be asked of someone who is doing unpaid work. However, the goal here is to see if they can identify the critical path(s) in the code and ensure these are covered with meaningful tests. Leave it up to the candidate to decide what level of testing is appropriate.

If engineering documentation is important to the company, as part of the assignment, the candidate should also provide setup and "how to" instructions in the Readme so that the assessor can setup the project and reproduce the solution. And a brief write-up of their solution. Tell them that the goal of this write-up is to ensure that another developer could pick up where they left off and further enhance the product.

After the candidate submits the solution, a follow-on meeting can be scheduled to discuss it. Such as what was the most challenging part, why the given solution was chosen, what trade-offs were considered etc. Part of the assessment can also include, how easy was it to follow along with the setup instructions? How easy would it be to enhance the solution to add more features?

Benefits of this alternative approach:

Captures essential skills that deeply impact projects, beyond writing working code: question asking, analytical thought, appropriate level of testing, engineering documentation, overall communication.

Due to the dynamic nature of what questions the candidate may ask, the solution could be different for each candidate. This means the assessor doesn't know the exact solution at the start of the assignment. This can improve empathy for the candidate in the process because everyone is figuring out the solution as part of the process. This avoids the fixed mindset of this candidate got the solution correct, good or incorrect, bad. And this is how real software gets built.

By adopting a more holistic and inclusive approach to technical assessments, companies can better evaluate a candidate's true potential and foster a more diverse and capable engineering team.

### Example: Add a Feature

It's well known that engineers spend a lot more time reading code other people wrote, then figuring out where their new code fits in, rather than starting from a blank slate. A variation on the previous assessment (again to be done asynchronously) is to send the candidate some working code. Then the assignment is to enhance it with a new feature (again, going through a round of clarifying question asking). This is testing for the real world skill of being able to analyze existing code, figure out what if anything can be re-used, and to integrate new code.

If doing this, make sure to send the existing code in a language the candidate is familiar with.

### Example: Fix a Bug

### Example: PR Review

If the role that's being hired for involves extensive PR reviews, this can be another type of assessment that can be done asynchronously.

- Ask candidates to review a piece of code, identify issues, and suggest improvements. This assesses their understanding of code quality and best practices.
- Tell them it was written by a junior and contains a lot of mistakes - see how empathetic that candidate is and how they word their feedback.
- This technique is especially useful for evaluating candidates in a senior, staff or above role that will be expected to be performing a lot of code reviews

## Pushback

### You Should Practice

TODO: Rough notes...

When I've brought up the fact that these kind of "on the spot" puzzle solving skills are not required in actual engineering work, recruiters have acknowledged this, and then said "you should spend time practicing". Let's think about how silly this is - a company is hiring for, let's say a staff engineer, so they reach out to them based on their LinkedIn profile, and their many years of experience solving real world problems. But somehow they're unable to assess that so now the candidate needs to spend their precious free time practicing for a test that doesn't even assess the actual skills they're being hired for? Given that an engineer actually has some free time to dedicate to any sort of technical extra-curricular activity, I can think of so many more valuable things to be doing than practicing leetcode puzzles, such as:
- Taking online courses to learn a new skill or something tangentially related, for example, if your company is considering bringing in Typescript, or TailwindCSS
- Reading technical books, eg: Sustainable Rails
- Building side projects to explore something new or solve an actual problem (find example from Wes Bos of Syntax podcast re: broken bicycle bidding on craigslist)
- Volunteering to build software for an charitable organization (eg: Ruby for Good)
- Writing technical articles, tutorials etc to share what you're learning

I mean sure, practice these exercises if someone enjoys this kind of work, just like someone training for a marathon hopefully enjoys the process and will practice long distance running regularly.

Multiply this out by all the engineers looking for a new role, say every few years, spending weeks on these practice exercises. How many more valuable things could have been achieved with all this time?

### Fairness

Another push-back from companies when suggesting reasonable accommodations is the desire to be "fair" by having everyone go through the exact same process. However, forcing all candidates through the same gate-keeping mechanism isn't genuinely fair. The famous illustration of three people of different heights trying to view a baseball game over a fence perfectly captures this concept. If each person is given an equal-sized block to stand on, the tallest person doesn't need the block, and the shortest person still can't see over the fence. True fairness, or equity, means providing the shortest person with more blocks so that everyone has an equal opportunity to see the game.

In the context of technical interviews, this means recognizing that different candidates have different strengths and bring different valuable skills to the table. For some, a live coding challenge might be straightforward, while for others, it might not accurately reflect their abilities. A one-size-fits-all approach can exclude talented individuals who would excel in the actual work environment. By offering alternative assessments, such as project-based evaluations and technical discussions, companies can create a more equitable hiring process that better identifies the most qualified candidates, regardless of their performance under artificially high-pressure conditions.

Ultimately, companies should consider what skills they actually need. They could do this by going through past performance reviews that rated highly, and see what skills existing employees have that are doing well, and then design the interview process to assess for that. It's very likely not the ability to solve a very well specified leetcode question in under an hour while talking aloud the solution and optimizing it in a performative setting.

### Cheating

A concern companies may have regarding take-home assignments is about "cheating" by using generative AI or referencing external resources like Google or Stack Overflow. While this is a valid concern, it's essential to consider the broader implications and context.

Historically, new tools and technologies have often been viewed with skepticism and even considered cheating. For example, when calculators were first introduced, they were seen as a form of cheating in engineering and math exams. However, over time, they became widely accepted as essential productivity tools that enhance rather than hinder professionals' abilities.

Similarly, the use of online resources like Google and Stack Overflow, and more recently, generative AI should be viewed not as cheating but as leveraging available tools to solve complex problems efficiently. In the real world, engineers frequently rely on documentation, libraries, and online resources to aid their work. Dismissing candidates for using these resources during a take-home assignment overlooks the reality of how engineering is practiced in professional settings.

Furthermore, consider the implications for current employees. If a team member uses Google or Stack Overflow to find a solution to a work-related problem, would they be accused of cheating? Effective engineering is not about being able to come up with some solution on the spot, but about leveraging available resources, collaborating with peers, and applying problem-solving skills to create robust and innovative solutions. Embracing this mindset can lead to a more inclusive and realistic assessment of candidates' abilities.

TODO:
- interview process needs to evolve with the available tools
- eg: maybe tell the candidate to go ahead and use generative AI, and then explain what the problems are with the solution, and how it could be improved
- the fact that tools can now auto-generate code immediately when asked (albeit not perfectly but getting better every day) is a signal that it no longer makes sense to gate-keep on this particular skill (generating code on the spot while someone watches). i.e. this makes about as much sense as testing if a candidate can do long division by hand rather than using a calculator

## Suitable Scenarios for Live Coding Interviews

Yes, if you're preparing a team to enter a programming competition, absolutely, coding as fast as possible to solve a very specific precisely worded problem, under time pressure is exactly the skill that's needed.

TODO: Road runner image?

Or if you're hiring for a computer science instructor, obviously in this role, the ability to work through these kinds of problems *and* talk about them out loud at the same time is part of the job.

But in all seriousness...

While live coding interviews often fail to accurately assess seasoned software engineers, they might be appropriate for specific types of companies, particularly early-stage startups. In these environments, the pace is extremely fast, and the priority is to deliver functional code as quickly as possible. Startups may operate in a "hackathon" style, where the ability to jump in and write code rapidly is crucial. Frequent emergencies and production issues, typical in such settings due to the lack of extensive testing and established processes, require engineers who can quickly address problems and implement solutions on the fly, and who don't mind the ensuing chaos.

TODO: If the company works primarily with pairing or mob style programming...

BUT: Make this clear in the job description such as in a "How we work" section. Developers do not sit alone to think, in this role, you will always be paired with another developer or work at the same time with a team of developers all looking at the same screen and taking turns with the keyboard. You will be expected to constantly say out loud the solutions you're thinking about as you write the code.

## Conclusion

In my 20+ years of experience in software engineering, I've never encountered a situation where I had to solve a complex problem by live coding in front of someone within an hour and talking through it out loud. The challenges I face daily are multifaceted, requiring thoughtful deliberation, extensive collaboration with product managers, operations/platform, and other engineers, and iterative feedback. Real-world software development is a dynamic and intricate process, far removed from the contrived scenarios of live coding interviews. The real value lies in understanding the problem domain, negotiating requirements, and architecting scalable and maintainable solutions, often over days or even weeks. Live coding tests, however, seem to cater predominantly to recent computer science graduates whose primary exposure to coding is through academic exams, rather than navigating the complexities of real-world software projects.

Moreover, the emphasis on quickly solving algorithmic puzzles under observation fails to capture the true essence of software engineering. The industry needs problem solvers who can integrate domain knowledge, communicate effectively across teams, and adapt to evolving requirements. By relying heavily on live coding tests, companies risk overlooking seasoned professionals who excel in these areas but might not perform well under the artificial constraints of a high-pressure interview setting. It’s high time we re-evaluate our hiring practices to better align with the real-world demands of software engineering.

Creating a more inclusive and effective hiring process is not just about fairness; it's about building better-performing teams and a more vibrant tech community. By rethinking our approach to technical interviews, we can better identify and attract talented individuals who bring diverse perspectives and skills to the table. Adopting more inclusive practices will not only ensure a more equitable environment but also foster innovation and success in the ever-evolving landscape of technology.

## TODO
* WIP main content
* polish up rough notes and bullet points
* think about logical ordering of problems
* edit
* meta tag description
* aside or caveat at beginning: All of this is based on my experience applying as intermediate, senior, staff in web development. Other areas of tech such as gaming, embedded systems etc could be completely different.
* interview process should be included in the JD
* maybe ref LI post to show the discussion https://www.linkedin.com/posts/gabag26_leetcode-codinginterview-softwareengineering-activity-7203974232509173760-92WZ/
* define leetcode
* emphasize: I'm not suggesting to include *all* of these exercises - this is to get people thinking about alternative assessment techniques that capture real world conditions and lessen performance anxiety/stress.
* if you can't fathom the interview process without a live coding round, at the very least, don't make it a qualifying round, take into account all the skills and experience the candidate brings to the table rather than focusing on this one particular skill
* does this fit in? This is all to say that the live-coding round is really testing for an [anachronistic](https://www.wordnik.com/words/anachronistic) skill that's rarely required any more.
> adjective of a person having an opinion of the past; preferring things or values of the past; behind the times.

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
