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

When I first started using AI to generate code, my instinct was to give it a prompt with the requirements, and have it write everything at once. Occasionally it produced something useful, but more often it created a mess - not quite what I wanted, or code that wouldn't even work. Cleaning up or undoing those attempts often took longer than writing it myself. It felt impulsive, like the work of a student who had recently learned to code but had little real-world experience.

Over time, I realized that rushing straight to code with AI doesn't scale well in large, long-lived codebases. Substantial features are often broken down, shipped incrementally (sometimes behind feature flags), and expected to remain understandable long after the original authors have moved on.

This post isn't about prompts or productivity hacks. It's about a workflow I've settled into that treats AI primarily as a design partner rather than a code generator. It's slower than "just write the code", but it scales much better for non-trivial changes and helps maintain clarity, intent, and maintainability over time.

## The Core Idea

I don't ask AI to start by writing code. Rather, I ask it to:

1. Understand the system as it exists today
2. Externalize that understanding in a durable form
3. Reason about new requirements *within* that context
4. Ask me questions until we're aligned
5. Break work into small, explicit steps
6. Only then, write code — one step at a time

The most important output in this process is not code, but a living analysis document.

<aside class="markdown-aside">
I'm using Claude Code at the VS Code integrated terminal, but this workflow isn't tied to a specific tool, you could do the same with any AI coding assistant.
</aside>

## Establish Context

When I'm working on a large feature that's grown over multiple commits, I'll give the AI a list of git commit SHAs that led to the current state and ask it something like this:

> Based on these commits, write a summary of your understanding of the system so far: what problem it's solving, how it's structured, and any constraints or patterns you notice.

I'm checking whether the AI has an accurate *mental model* of the system and specific feature area we'll be building in.

## Persist Thinking

Every time, I ask the AI to put its analysis into a markdown document. That document becomes the durable artifact of the work: a design checkpoint I can read calmly, revisit later, and keep even if the session ends. I open it in VS Code's markdown preview and review it the same way I would any design doc. I find this easier to read than long scrolling terminal output.

This flips the dynamic: The AI's reasoning is explicit and reviewable, not hidden behind (often false) confidence. If the understanding is wrong, we fix it here, before new requirements enter the picture and muddy the waters.

## Introduce New Requirement

Only after we're aligned on the current system do I introduce the new requirement. At that point, I ask the AI to explore the solution space by considering multiple possible approaches, rather than jumping straight to an answer. I want to see multiple viable approaches, grounded in the project's existing patterns, with tradeoffs called out clearly.

This is a useful moment to gauge how the AI is reasoning: what it thinks is possible, how it weighs constraints, and whether it respects the shape of the codebase instead of trying to redesign it. That analysis goes into a second markdown document alongside the first, extending the shared context rather than overwriting it.

## Ask Me Questions

At this stage, I ask the AI to review the new requirements in the context of the system analyzed so far and identify areas where clarification is needed. I then instruct it to list those as questions in an `## Outstanding Questions` section of the analysis document. We then work through them exactly as I would with another engineer. One at a time, I answer the questions and the AI updates the analysis document accordingly.

At the end of this phase, assumptions are corrected, ambiguities shrink with each pass. Each iteration tightens our shared understanding of the system.

**Catching Subtle Details Early**

By forcing the AI to fully analyze the current system before writing code, it can surface complexities that might otherwise be overlooked. For example:

While summarizing the existing feature set, the AI might notice that different functionality is available depending on a user's subscription tier. If a new feature overlaps with these tiers, this early analysis highlights the need for a policy decision before coding begins, preventing a scenario where the code works technically but violates business rules.

These are the kinds of issues that usually only come up during testing or code review, but with upfront analysis, they can be caught proactively, keeping the design aligned with the system's constraints.

## Decompose

Once we’ve converged on an approach, I ask the AI to decompose the work into small, explicit steps and document them. We get concrete here: which files will change, what existing code will be extended versus replaced, and where tests need to be added or updated.

Still, no code yet. The goal is to answer whether the work is well-scoped and understandable: what changes happen in what order, what can be validated independently, where the risk lies, and whether this belongs in a single pull request or does it seem big enough that it should be split up further. Only when that plan feels solid do we move forward.

## Implementation

Only then do we start writing code, following the plan one small step at a time. Each change is intentionally narrow: one step, one diff, one reviewable unit, with tests passing before moving on.

After each step, I review the diff, try it locally, update context if needed, and then proceed. This prevents the AI from "helpfully" solving problems I didn't agree to solve yet, and keeps the work aligned with the original intent.

## Why I Work This Way

This workflow leans heavily on written reasoning and documentation — a skill that’s been undervalued in tech, but becomes a superpower when working with LLMs. The clearer the engineer can write questions, prompts, and feedback, the better the AI can reason, and produce high quality work.

<aside class="markdown-aside">
If the idea of leveraging written communication skills for more effective engineering is new to you, see a few of my previous posts on this topic:
<a class="markdown-link" href="https://danielabaron.me/blog/reflections-on-effective-teams/#culture-of-writing">Culture of Writing</a>,
<a class="markdown-link" href="https://danielabaron.me/blog/about-those-docs/">About Those Docs</a>,
<a class="markdown-link" href="https://danielabaron.me/blog/working-towards-asynchronous-future/#communication">Communication for Asynchronous Teams</a>
</aside>


This approach can feel slower than asking an AI to "just implement the feature", especially if speed is being measured by how quickly code appears on the screen. In practice, the tradeoff is overwhelmingly positive. The work becomes far less error-prone because misunderstandings are surfaced early, before they harden into code. It's also much easier to pause and resume: the analysis document captures intent, decisions, and open questions in a way a half-written diff never does. This also aligns with how effective engineering teams already operate — through shared context, explicit design, and incremental change rather than heroic leaps.

Most importantly, it keeps me in control of the design. The analysis document is the real artifact. The code is just one possible outcome of good thinking.

## Final Thoughts

AI is very good at generating answers. It's less good at knowing whether it understood the question. By externalizing its understanding, forcing iteration, and delaying code, I've found I can use AI on serious work without giving up the things I care about most: clarity, intent, and maintainability.

With my current process, I spend much more time in back-and-forth analysis and design. By the time we get to writing code, it's usually correct the first time and literally only takes minutes. The upfront time invested in reasoning carefully with the AI pays off massively - the work becomes faster, safer, and more reliable than rushing straight into implementation. This is the power of using AI as a design partner rather than (solely) a code generator.

If you already collaborate this way with humans, you don't need a new mindset for AI, you just need to insist on the same standards.
