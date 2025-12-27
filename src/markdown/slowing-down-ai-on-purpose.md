---
title: "Slowing Down AI On Purpose"
featuredImage: "../images/slowing-down-ai-on-purpose-arif-dalkiran-IKx2QqZqE1s-unsplash.jpg"
description: "Why I deliberately slow AI down to reason about design, context, and incremental change before writing code."
date: "2026-01-01"
category: "productivity"
related:
  - "About Those Docs"
  - "Reflections on Effective Teams"
  - "Cover Letter Writing for Nerds"
---

There's been a lot written about using AI to generate code, and I've found plenty of that advice useful. What I want to describe here is a slightly different angle: how I use AI when working in a large, long-lived codebase, where substantial features are broken down, shipped incrementally, often behind feature flags, and expected to remain understandable long after the original authors have moved on.

This post isn't about prompts or productivity hacks. It's about a workflow I've settled into that treats AI primarily as a *design partner* rather than a code generator. It's slower than "just write the code", but it scales much better to non-trivial changes.

## The Core Idea

I don't ask AI to start by writing code.

I ask it to:

1. Understand the system as it exists today
2. Externalize that understanding in a durable form
3. Reason about new requirements *within* that context
4. Ask me questions until we're aligned
5. Break work into small, explicit steps
6. Only then, write code — one step at a time

The most important output in this process is not code, but a living analysis document.

## Establish Context Using Commit History

When I'm working on a large feature that's grown over multiple commits, I'll give the AI a list of git commit SHAs that led to the current state.

I don't ask it to summarize the commits mechanically. Instead, I ask something like:

> Based on these commits, write a summary of your understanding of the system so far: what problem it's solving, how it's structured, and any constraints or patterns you notice.

The distinction matters.

I'm not looking for a changelog. I'm checking whether the AI has a *mental model* of the system that matches mine.

## Force the Thinking Into a Markdown Document

Every time, I ask for the analysis in a markdown document. That document becomes:

* a design checkpoint
* something I can read calmly
* something I can keep if the session ends
* something I can reopen later and continue from

I open it in VS Code's markdown preview and review it the same way I would a lightweight design doc. I find this easier to read than long scrolling terminal output. This flips the dynamic: The AI's reasoning is explicit and reviewable, not hidden behind (often false) confidence. If the understanding is wrong, we fix it here, before new requirements enter the picture and muddy the waters.

## Introduce the New Business Requirement

Only after we're aligned on the current system do I introduce the new requirement. Then I ask the AI to:

* propose several implementation options
* keep them consistent with the project's existing patterns
* call out tradeoffs explicitly

Crucially, I don't let it jump to "the best solution". I want to see:

* what it thinks is possible
* how it weighs constraints
* whether it respects the codebase's existing shape

Again, the output goes into another markdown document in the same directory, which adds to the context.

## Make Clarifying Questions Mandatory

When doing this kind of analysis, I'll ask the AI to *ask me clarifying questions*, and include it ask an `## Outstanding Questions` section in the analysis document. Then we go back and forth exactly like I would with another engineer:

* I answer questions
* it updates the analysis doc
* assumptions are corrected
* ambiguities are resolved

Each iteration tightens the shared understanding. This is where most AI workflows fail: they reward confidence over correctness. I design mine to do the opposite.

## Agree on an Approach, Then Decompose

Once we've converged on a technical approach, I ask the AI to break the work down into small, discrete steps, and document each one. Here we get very specific as to which files will be modified, existing methods vs new methods, what tests will be added or maintained, etc.

But still, I don't let it touch any code yet. The goal here is to answer:

* What changes, in what order?
* What can be validated independently?
* Where are the risky parts?

Only when that list feels reasonable do we proceed.

## Write Code One Small Step at a Time

Finally, we can write code according to the plan, but only:

* one step
* one change
* one reviewable unit at a time

After each step:

* I review the diff
* we update context if needed
* then move on

This keeps the AI from "helpfully" solving problems I didn't agree to solve yet.

## Why I Work This Way

This approach is slower than asking AI to "just implement the feature".

It's also:

* far less error-prone
* much easier to stop and resume
* better aligned with how engineering teams already work

Most importantly, it keeps *me* in control of the design. The analysis document is the real artifact. The code is just one possible outcome of good thinking.

## Final Thoughts

AI is very good at generating answers. It's less good at knowing whether it understood the question.

By externalizing its understanding, forcing iteration, and delaying code, I've found I can use AI on serious work without giving up the things I care about most: clarity, intent, and maintainability.

If you already collaborate this way with humans, you don't need a new mindset for AI, you just need to insist on the same standards.

## TODO

- when i first started with ai/llm assisted coding, would just type a prompt with requirements and have it write all the code in one go - it was a big mess, was never what i wanted, and had to spend more time cleaning up after the ai, it felt so impulsive
- specific tool: Claude Code, integrated terminal VSCode
- preference for reading longer tech details in markdown than long scrolling output in the terminal
- eg of things that can be caught earlier this way: will notice from previous implementation that there are different feature availability for different subscription tiers, and realize that the new feature overlaps with this and requires a policy as well
- link to my past posts on power of written communication, markdown for highly effective teams and that hasn't changed with AI, if anything, being strong written communication skills is a superpower in getting better results from AI assisted coding.
* edit
