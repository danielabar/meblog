---
title: "The Code-Adjacent Superpowers of AI"
featuredImage: "../images/code-adjacent-superpowers-ai-paul-felberbauer-tM16SjCYy84-unsplash.jpg"
description: "AI coding assistants are obviously useful for writing code, but some of their most valuable contributions happen in the work that surrounds it."
date: "2026-04-15"
category: "productivity"
related:
  - "Slowing Down AI On Purpose"
  - "CSS Refactoring with an AI Safety Net"
  - "Building an AI Blog Editor with Claude Skills"
---

When most people think about AI coding assistants, they picture the obvious: writing code. And yes, that's what these tools are marketed for, and it's where much of the conversation lives. But after months of daily use, I've found that some of the most valuable things I do with AI assistants aren't about producing code directly.

They're the tasks that surround the code — analysis, documentation, planning, onboarding. I've started calling these *code-adjacent* activities, and they're where AI's superpowers really shine — in compressing work that used to take hours or days into minutes.

Here's what that looks like in practice.

## Analyzing Existing Workflows

On long-running projects, there's a sort of question that comes up from time to time: "How does this feature *actually* work? It usually comes from a business stakeholder — a product manager, a customer success lead, someone who needs to understand the current behavior before they can decide what to change. The problem is that nobody knows the answer. The original developers are gone, the PM who wrote the spec left two years ago, and the documentation (if it exists at all) is outdated.

This used to mean hours or days of a developer tracing through the code, leaving breadcrumbs in a scratch document, cross-referencing database schemas, services, background jobs, etc. and then translating all of that into something a non-technical person could follow. It was valuable work, but it was slow and tedious.

Now I point an AI assistant at the codebase and ask.

A recent example: a customer success team member asked in Slack what happens when a subscriber's payment fails. Simple question, right? It turned into a deep investigation because nobody was certain which emails were being sent, when, or by whom. Some people thought Stripe was handling the notifications. Others assumed the app was covering it.

I had Claude analyze the entire payment failure flow — the Stripe webhook events, the controller routing, the mailer logic, the background jobs, the cron-based cleanup. Within about thirty minutes, it produced a comprehensive document that included:

- A plain-English explanation of the business problem
- Flow diagrams showing how webhook events route through the system
- The discovery that Stripe's email sending was actually turned off
- A table showing exactly what emails/content different subscriber types would see at each stage of the payment failure process

The resulting document served both the technical team (who used it to plan the implementation) and the business team (who could finally see what customers were actually experiencing). Work that would have taken a developer a day or more to research and write up happened in under an hour.

## Mining Open Source for Patterns

Sometimes you know that an open source project has solved a problem similar to yours, but extracting the relevant pattern means reading through an unfamiliar codebase and figuring out which parts are essential versus incidental. AI assistants are remarkably good at this — point them at a repository, tell them what you're looking for, and they'll pull out the structural pattern in minutes.

A recent example: I was working on a back office system where we were adding admin features and onboarding internal users for customer support. We needed structured audit events — who did what, when, and to which record — rather than the scattered `Rails.logger.info` calls we'd been relying on. I knew [Fizzy](https://github.com/basecamp/fizzy), 37signals' open source Kanban tool, had an event tracking system worth studying.

So I pointed Claude at Fizzy's `Event` model and the related files and asked it to explain the pattern. Within minutes, it identified the key architectural decisions:

- **Polymorphic `eventable` association** — any model can generate events by including a concern, with actions automatically prefixed by the model name (`card_published`, `comment_created`) so event types are self-documenting.
- **A JSON `particulars` column** — context-specific metadata stored in a flexible JSON column rather than separate tables for every event type.
- **Separate `Description` class** — display logic kept out of the model, with a dedicated class that renders human-readable sentences from event data.
- **Webhook dispatch on create** — every event automatically triggers webhook delivery for external system integration.

What would normally be a half-day of reading unfamiliar code and taking notes became a thirty-minute exploration.

And because the assistant also has access to *your* codebase, it can go further than just explaining the open source pattern — it can identify where the adaptation points are. Fizzy uses plain old Ruby objects and concerns to organize its event logic. Our codebase organizes business logic in service objects. The assistant can bridge that gap: here's the pattern, here's how your code is structured differently, and here's how you might reconcile the two. That kind of cross-codebase reasoning is difficult to do quickly on your own, especially when you're not yet familiar with the source project.

## Onboarding to a New Codebase

Starting on a new codebase is disorienting. Even experienced developers spend their first days (or weeks) building a mental model of how things fit together. What business problem does this solve? How is authentication handled? How about authorization? Where does the business logic live — service objects? Concerns? Plain old Ruby objects? How are tests organized? What's the deployment process?

This gets even harder when you're crossing technology boundaries. I'm a Rails developer. My day-to-day is a Rails monolith — ActiveRecord, PostgreSQL, RSpec, Sidekiq, the usual. But an upcoming initiative requires me to work across our company's main product, which is a .NET application, backed by MongoDB with an Angular SPA frontend. Different language, different framework, different database paradigm, different everything.

Rather than spending days sifting through unfamiliar directories and trying to figure out how the pieces fit together, I pointed Claude at the codebase and asked it to generate onboarding documentation *for me specifically* — a Rails developer who needs to understand this system.

What it produced wasn't a generic .NET tutorial. It was a customized orientation that mapped every unfamiliar concept to its Rails equivalent:

- The `.sln` solution file with numerous `.csproj` projects? "Think of each project like a gem that lives inside the repo instead of being published externally. The `.sln` ties them together so `dotnet build` knows what to compile."
- The layered architecture with Controllers, Services, Providers, Domain, and Data projects? A table mapping each one to Rails equivalents — `App.Web.Services` is like `app/services/`, `App.Providers` is like your Faraday client wrappers, `App.Domain` is like ActiveRecord models but without the ORM magic.
- Dependency injection? "In Rails, you just call `User.find(id)` or `SomeService.new` anywhere. In .NET, dependencies are declared in constructors and wired up at boot time." Followed by side-by-side code examples in C# and Ruby showing the same service written both ways.
- MongoDB instead of PostgreSQL — no schema, no migrations, no `rails db:migrate`. "Adding a field to an entity just works. Old documents without that field return `null`. But also no rollback safety net."

The result is a document I keep open alongside the code. When I encounter an unfamiliar pattern, I can scan to the relevant section and immediately understand what I'm looking at in terms I already know. It's like having a bilingual dictionary for codebases — and it was generated in a few minutes instead of the days it would take to build that mental model from scratch.

## Splitting Large Features into Deliverable Work

Developers often struggle with breaking a large feature into smaller pieces that can be delivered, reviewed, and shipped independently. The natural instinct — and what AI assistants default to if you don't guide them — is to split horizontally: one ticket for the data model, one for the service layer, one for the API, one for the frontend. Clean slices that make architectural sense.

The problem is that nothing works end-to-end until the very last piece lands. Vertical slices are better: each ticket delivers a thin, end-to-end piece of functionality that a user can actually exercise — maybe only the happy path, or only one account type — but it works. You can demo it, get feedback, and catch integration issues before investing in the next slice.

When I describe a feature to an AI assistant and explicitly ask for vertical slices, it produces a breakdown that I'd estimate takes me about 70% of the way there. I usually need to adjust priorities, merge some tickets that are too granular, or add edge cases it missed. But the structure — the act of identifying what the thin slices are — is done in minutes instead of the hour-plus it used to take me staring at a blank Jira board.

Once I approve the breakdown, I use an MCP server for the ticketing system to have the assistant create the tickets directly, What used to be an afternoon of writing tickets becomes a focused thirty-minute session.

## Managing your TODO List

I had a flat bullet-point list in Apple Notes. Every time something came up at work — a Slack discussion about a bug we should investigate, a nice-to-have idea someone mentioned, a deprecation warning from our hosting provider, a Dependabot PR with breaking changes, a support ticket revealing a deeper issue — I'd add a line. Sometimes I'd copy-paste a raw Slack URL with a one-word reminder. Other times I'd dump in a paragraph of context with no formatting.

Within a few months, it was eighty-plus items in a wall of text. Active work mixed with vague future ideas. Bug reports tangled with tech debt notes. Items with Jira tickets next to items that were just a Slack link and a half-formed thought.

I moved the whole thing into a Markdown file and asked Claude to organize it. It read through every item, inferred the nature of each one, and sorted them into categories — Active, Business Priority, Tech Debt, Product Backlog, and others. Items that were just a raw Slack URL got expanded into a clear one-line description with the link preserved as a reference. Related items that I'd logged separately got grouped together

But the real value isn't the one-time organization — it's the ongoing maintenance. We have a Slack MCP server connected to our AI assistant, so when something new comes up, I can point to a Slack discussion and say "add this to the TODO." The assistant reads the thread, understands the context, writes up a well-worded item, and places it in the appropriate category. When I finish something, I tell it and it removes the item. When a ticket gets created for something that was previously "not in Jira yet," I mention that and it updates the entry with the link.

The document went from an overwhelming wall of text I couldn't make sense of to a structured reference I actually use. It's a living document that stays organized without me having to do the organizing.

## Rewriting Project Documentation

One of my side projects, [retirement drawdown simulator](https://github.com/danielabar/retirement_drawdown_simulator_canada) had a README that I wrote the way most developers write READMEs: it explained how to install and run the project, a bare-bones bulleted list of features, showed some sample output, and listed the configuration options. Functional, but it undersold the project by a wide margin.

When I asked Claude to review the README, its first observation was that the documentation didn't communicate what made the project genuinely valuable. The README talked about implementation details — YAML configuration, command-line flags, output tables — but it didn't explain *why* someone should care. It didn't explain that the simulator handles Canadian tax-aware withdrawals across multiple account types with interacting income sources, or that it uses statistical modeling to stress-test plans against futures worse than history.

The rewritten README leads with what the project *does* and *why it matters*, then moves to how to use it. It includes annotated sample output that walks through a specific scenario year by year, explaining what each number means and why it matters for the financial decision. It even has a failure scenario showing how a bad sequence of early returns can drain an otherwise reasonable plan.

## SR&ED Report Generation

Scientific Research and Experimental Development (SR&ED) is a Canadian federal tax incentive program that provides credits for companies doing eligible R&D work — with small Canadian-controlled private corporations able to receive up to 35% back on qualifying expenditures. The application process involves answering detailed questions about what technological uncertainties you encountered, what systematic approaches you tried, and what you learned — essentially proving that work qualified as genuine research rather than routine development.

If you've ever filed an SR&ED claim, you know the pain: go back through months of git history — sometimes even the reflog for aborted experiments — to find evidence of repeated attempts to solve problems that couldn't be easily answered by existing knowledge. Then map those struggles onto the government's specific questions about technological uncertainty, systematic investigation, and advancement.

I used this in two phases. First, I had Claude help me understand what SR&ED eligibility actually looks like from an accountant's perspective — what questions they'd ask, what red flags disqualify work, and what green flags suggest eligibility. It produced a structured questionnaire covering technological uncertainty, systematic investigation, advancement, and the critical distinction between eligible experimentation and routine development. That alone saved me hours of reading government documentation.

Then came the real heavy lifting. I'd completed a major global search overhaul about eight months earlier and the details had faded. The project had two areas that potentially qualified: a PostgreSQL full-text search optimization where a widely-used gem's generated SQL became unusable at production scale with user-ownership filtering, and a hybrid architecture pattern for embedding server-rendered Rails views inside a legacy Backbone/Marionette SPA.

I fed Claude the Jira epic and child tickets, then had it traverse the corresponding git commits (our commits always reference the Jira ticket, so the mapping was straightforward). I also told it to search through my `git reflog` for abandoned experimental commits. What it found in the git history told the story of systematic experimentation far better than my memory could have:

- For the search work: seven distinct indexing attempts — each with commit evidence showing what was tried and why it was insufficient. The progression from "maybe we can make the gem work with better indexes" to "the fundamental SQL structure is the problem" was visible right there in the commit timeline.

- For the architecture work: the iterative journey from a first experiment (server-rendering just the navigation bar) to discovering that server-rendered links break SPA routing, to building a bridge layer, to the final "shell" pattern. Each phase had its own ticket and commits showing the progression.

Claude cross-referenced all of this against the SR&ED eligibility framework and produced a structured technical summary organized around technological uncertainty, evidence of systematic investigation, and technical advancement achieved — the exact structure an SR&ED accountant needs. It even pulled relevant open source issue threads from the gem's GitHub repository to demonstrate that the performance limitations were systemic and acknowledged but unresolved by the maintainers for over a decade.

What would have been days of archaeological work — re-reading old commits, reconstructing the timeline of what I tried and why, translating it into SR&ED language — became an afternoon of reviewing and validating what the assistant produced.

## So What Ties These Together?

Looking at this list, a pattern emerges. The common thread isn't that AI writes code for me. It's that AI handles the *cognitive overhead* that surrounds the code — the reading, the cross-referencing, the organizing, the translating between audiences, the reformatting. Work that was always necessary but never anyone's favorite part of the job.

These tasks share a few characteristics that make them particularly well-suited to AI:

- **They involve synthesizing large volumes of existing information** — codebases, git histories, Slack threads, personal notes, government forms — rather than inventing something new.
- **They require translating between contexts** — technical to business, code to documentation, raw notes to structured plans, experience to interview answers.
- **The output quality matters but isn't precious** — a well-organized backlog is valuable, but it doesn't need to be perfect. A workflow analysis document is a starting point for discussion, not a final artifact. This makes them forgiving of the occasional AI mistake in a way that production code is not.

I've written before about [slowing down AI on purpose](../slowing-down-ai-on-purpose) — using it as a design partner rather than a code generator. These code-adjacent uses are the natural extension of that philosophy. When you stop thinking of AI as a thing that writes code and start thinking of it as a thing that processes and organizes information, the range of useful applications expands dramatically.

## TODO

- maybe too long, can some details within each section be cut out?
