---
title: "Audit a Rails Project with the Thoughtbot Audit Skill"
featuredImage: "../images/audit-rails-project-thoughtbot-skill-fr0ggy5-5VxbaZn7GtE-unsplash.jpg"
description: "Turning a Claude skill audit report into a labelled, severity-tiered GitHub backlog, and what the audit caught in a small Rails 8 app."
date: "2026-06-15"
category: "rails"
related:
  - "Building an AI Blog Editor with Claude Skills"
  - "Add RuboCop to a Legacy Project"
  - "The Code-Adjacent Power of AI"
---

Hello Visitor is a small Rails app I run to power cookie-free page analytics, and search on this blog. It's been chugging along for about five years. Like many solo side projects, it grew over time, and quietly accumulated tech debt I've never had time to dig into. Then I came across the [Thoughtbot Rails Audit skill](https://github.com/thoughtbot/rails-audit-thoughtbot), a Claude Skill that walks a Rails codebase and produces a structured audit report against Thoughtbot's best practices.

This post walks through a few of the findings the audit caught, and a workflow I developed to turn the markdown report into prioritized GitHub issues so improvements can be tackled one at a time.

## What the skill does

A [Claude Skill](https://claude.com/skills) is a packaged set of instructions Claude can follow on demand via a slash command.

The Rails Audit skill walks your codebase against Thoughtbot's Ruby Science and Testing Rails guidance, covering testing practices, security, code design (skinny controllers, POROs, ActiveModel), Rails conventions, database and migration hygiene, external service handling, performance antipatterns, and Ruby style. It can optionally run [SimpleCov](https://github.com/simplecov-ruby/simplecov) for test coverage and [RubyCritic](https://github.com/whitesmith/rubycritic) for code quality metrics if you opt in when prompted. The output is a single markdown report grouped by category and severity.

Installation is one command from the skill's [README](https://github.com/thoughtbot/rails-audit-thoughtbot):

```bash
git clone https://github.com/thoughtbot/rails-audit-thoughtbot \
  ~/.claude/skills/rails-audit-thoughtbot
```

There are three ways to invoke it:

| Context                           | Command                                     |
| --------------------------------- | ------------------------------------------- |
| Terminal, from Rails project root | `claude audit`                              |
| Inside a Claude session           | `/rails-audit-thoughtbot`                   |
| Inside a Claude session, scoped   | `/rails-audit-thoughtbot audit controllers` |

Here's the prompt that I actually typed:

```
/rails-audit-thoughtbot save all reports, output etc to scratch/rails-audit/
```

That trailing instruction is a free-form argument. The skill picks it up and routes its outputs into `scratch/` instead of the repo root, which keeps AI-generated artefacts out of git, as I have `scratch` in my global gitignore file.

The audit itself ran for about 8 minutes on my small-ish project. It generated a single markdown file named `RAILS_AUDIT_REPORT.md` with an Executive Summary, a Key Findings list, one section per category with detailed explanations of each issue and recommended fixes, and a Quick Wins / Short-term / Long-term split at the bottom.

![thoughtbot rails audit report summary](../images/thoughtbot-rails-audit-report-summary.jpg "thoughtbot rails audit report summary")
...
![thoughtbot rails audit report recommendations](../images/thoughtbot-rails-audit-report-recommendations.jpg "thoughtbot rails audit report recommendations")

## What it actually caught

The full report had 25 findings across 9 categories. I'm only going to walk through three, because each one is a different *shape* of finding and together they hint at the range of things an audit like this can surface.

### A missing trigram index

This was the standout, the only `severity: high` in the report. Every dashboard query filters visits by URL with `LIKE '%...%'`, a leading-wildcard pattern that a standard B-tree index can't accelerate. The fix is a `pg_trgm` GIN index on `visits.url`, deployable concurrently in one migration.

The honest punchline: **the app had been in production for about five years and I'd noticed the dashboard getting sluggish.** I hadn't connected it to a missing index; I'd half-assumed it was Heroku cold starts or a slow Chartkick render. The audit named the actual cause in one paragraph. This wasn't a "would have bit me later" finding; it was a "has been quietly biting me" finding. The audit took 8 minutes to spot something five years of casual use hadn't.

### A class with no dedicated tests

`app/queries/visit_query.rb` is the SQL layer behind the entire dashboard. It had no spec file of its own. Its seven query methods were exercised indirectly through `spec/models/visit_spec.rb`, which tests the aggregate Visit results, not the SQL itself.

The concrete worry: if I (in a year from now, probably) flipped `ORDER BY count(...) ASC` to `DESC` in `by_page_bottom`, the existing tests would still pass. The "bottom pages" widget on the dashboard would silently start showing the top pages instead. Same story for the `LIMIT` constants; no test pinned them down.

SimpleCov reported 100% line coverage on the file. That didn't catch this either, because another test happened to walk through every line. Coverage % is a floor, not a ceiling: a class can be at 100% and still have no spec defending its actual behaviour.

### Date arithmetic hiding in a view partial

The dashboard's "Quick Filters" partial has buttons for 24 Hours, 7 Days, 1 Month, 3 Months. The implementation lived directly in the ERB:

```erb
<%= quick_filter_link('24 Hours',
      { start_date: 24.hours.ago.to_date, end_date: Time.zone.today },
      ...) %>
```

The same `24.hours.ago.to_date` / `7.days.ago.to_date` / `1.month.ago.to_date` literals appeared multiple times inside the same partial: once for the link's target, once for the active-state check, once for the URL. The audit recommended pulling the ranges into `VisitsHelper` as a frozen constant hash so the view loops over a single source of truth.

I'm including this one because it's a *different shape* of finding from the other two. It's not a perf bug. It's not a missing test. It's a view-layer organization smell: the code works, the tests pass, and the only signal something's off is "this is going to be annoying to change next time." The audit caught it without me asking anything specific about my views.

![TBD: Screenshot of the GitHub issues list filtered by `label:audit` with `state=all` at https://github.com/danielabar/hello-visitor/issues?q=label%3Aaudit, showing all 25 audit findings with severity-coloured chips.](TODO)

## Turning the report into a backlog

The generated report is a single markdown file. Useful, but it's a doc, not a backlog. Here's the workflow I ended up with.

### 1. Have Claude propose a label scheme

The existing repo labels didn't capture severity or topical area. I asked Claude to look at the report and propose the minimum set of new labels needed to make the issues filterable. My actual prompt:

> read scratch/rails-audit/RAILS_AUDIT_REPORT.md, then quickly skim through all the issue md files in scratch/rails-audit/issues, specifically severity and category and just the problem statement. then look at what github issue labels are already available in this project. then writeup as sibling to the audit report a file like github-issue-new-labels.md and propose what new labels would be useful

Two things worth pointing out about the shape of this prompt:

- **It tells Claude where to look** (the report, the per-issue files, the existing labels) rather than describing the project. Cheaper context, more accurate answer.
- **It asks for a written artefact**. That's the move that turns a chat answer into a reviewable doc, and the doc is what makes the follow-up prompts tiny.

Claude came back with eight labels across three groups: severity (high/medium/low), area (security/performance/testing/code-quality), and a single `audit` origin tag so I could later filter back to the source.

### 2. Create the labels

Once I approved the proposal, the follow-up prompt was two lines:

> read: scratch/rails-audit/github-issue-new-labels.md
> then create the new labels

That's it. The proposal file already had the names, colours, and descriptions; Claude just had to translate them into `gh label create` calls.

![TBD: Screenshot of https://github.com/danielabar/hello-visitor/labels?sort=count-desc, showing the resulting labels sorted by usage count, which doubles as a visual of how many issues landed under each.](TODO)

### 3. Draft one issue file per finding

This is the step where the local-files-first detour earns its keep. The prompt:

> read: scratch/rails-audit/RAILS_AUDIT_REPORT.md
> i want to split out the recommended improvements into separate tickets, and actually i dont completely understand all of them so each one needs a writeup like what the problem is and why we're addresing it and what expected results are and how the agent can verify its own work that the change was done correctly
>
> so please create a new dir: scratch/rails-audit/issues
> and under there writeup a file per each issue with the title and description, eventually these will get created as github issues so we can address them one at a time

What I like about this prompt in hindsight: I told Claude *why* I wanted the writeups (I didn't understand all the findings) and *who* the writeups are for (an agent who'll later verify its own work). That second part is why every issue file ended up with a structured "How to Verify" section.

The shape of each file:

- **Problem:** what's broken or smelly.
- **Why We're Addressing It:** the motivation, in my own words.
- **Expected Result:** what "done" looks like.
- **How to Verify:** a numbered list a future agent (or me) can follow.
- **Implementation Notes:** example code, gotchas.

Then a separate prompt to apply labels to those files, and finally:

> for each md file in scratch/rails-audit/issues
> create the issue

Two lines. By that point all the thinking was in the files; the push was pure execution.

**Why the detour matters**: editing 25 markdown files locally is cheap. Editing 25 GitHub issues after the fact is awkward: every change is a PUT, every typo a notification email. Doing the thinking in plain files, *then* batch-pushing, kept the loop fast.

### 4. Work the backlog

I started with `severity: high` (just the trigram index), then moved into the medium pile. Beyond that there's no schedule; I work one or two on a weekend when I have time, then nothing for a few weeks, then maybe one more. Because every finding is a labelled issue, I can drop in and out without losing context. Filter by `severity: medium`, pick whichever has the cleanest scope for the time I have, ship a PR. The labelled backlog is what makes "a few hours when I have them" actually add up over time. Without it, this whole list would have lived in `scratch/rails-audit/` forever.

### What this actually cost

The 8-minute audit headline is only the audit itself, not the rest of the workflow above. End-to-end, from invoking the skill to having all the labelled issues live on GitHub, was an afternoon. About 72 minutes was active Claude conversation across five sessions; the rest was me reading the report, deciding what I wanted, and breaks. The active typing time is small; the *thinking* time isn't.

<aside class="markdown-aside">
I reconstructed those times by reading my own Claude Code conversation history. Every Claude Code conversation is persisted as a <code>.jsonl</code> file under <code>~/.claude/projects/&lt;encoded-project-path&gt;/</code>, one event per line with timestamps. That means Claude can read its own history, so if you've forgotten how long a session took, what you actually typed, or which conversation a decision happened in, you can just ask.
</aside>

## The skill is opinionated

The audit reflects thoughtbot's house style: business logic in models, POROs, or ActiveModel objects rather than service objects; names that read as Ruby objects (`Stats#collect`) rather than as patterns (`StatsCollector#call`); skinny controllers, decomposed models.

In Hello Visitor's case this lined up: the codebase already uses `VisitSearch` (ActiveModel form object), `VisitQuery` (raw SQL PORO), and `Stats` (plain aggregate). The audit was effectively grading against the style I happened to use, which made it work well here. It might land differently on a codebase built around `Interactor` / `call` / service objects.

The skill's README doesn't document any config for projects that intentionally diverge. What you can do (and this is inference, not documentation) is pass intent in the same free-form arg, something like *"we use the Interactor pattern deliberately; don't flag it as an issue."* I haven't tested how reliably the skill respects that, but it's what I'd try first.

## Wrapping up

The audit was worth running because the workflow gave me a backlog I can actually work: labelled, severity-sorted, one issue at a time. The opinionatedness lined up with my style; that's not a given on every codebase, so your mileage will vary.

If you want to try a similar workflow on your own project, I bundled it into a [companion gist](https://gist.github.com/danielabar/87730357992409e51384cc41bdc0e07a). Drop it into your project as `scratch/rails-audit/AGENT_PLAYBOOK.md`, point Claude at it with *"read scratch/rails-audit/AGENT_PLAYBOOK.md and execute it"*, and it'll walk through the same steps.

The trigram index was the most satisfying find, a real performance issue I'd been quietly noticing for years. The rest of the backlog is making its way through one PR at a time, as I have time.

## TODO
* WIP screenshots
* WIP edit
* link to Thoughtbot, mention Rails consultancy
* Awkward sentence "The generated report is a single markdown file. Useful, but it's a doc, not a backlog. Here's the workflow I ended up with.", explain what I was trying to achieve
