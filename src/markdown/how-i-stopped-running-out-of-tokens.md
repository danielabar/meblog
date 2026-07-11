---
title: "How I Stopped Running out of Tokens"
featuredImage: "../images/token-efficiency-jon-moore-g4PJkWiAmVo-unsplash.jpg"
description: "A practical rundown of tools, settings, and habits that reduce token consumption when using Claude Code as your daily AI coding assistant."
date: "2026-07-19"
category: "productivity"
related:
  - "What AI-Assisted Coding Feels Like in Early 2026"
  - "Slowing Down AI On Purpose"
  - "The Code-Adjacent Power of AI"
---

## How it started

TODO: Maybe don't need to link to other post here

At work we're on Claude Enterprise, and I'd been using Claude Code for pretty much everything: writing code, [reviewing PRs, drafting docs, code-adjacent work in general](../what-ai-assisted-coding-feels-like-in-early-2026). I assumed Enterprise meant I didn't need to think about usage or limits.

Mid-month, I got this:

TODO: `ran-out-of-tokens.png`

I posted in Slack to ask if anyone else had seen it. Turns out a bunch of other engineers on the team had hit the exact same wall, right around the same point in the month. Our workspace admin gave everyone a bump in tokens. That bought some breathing room, but now that I knew where to find the usage meter, I could see the rate I was burning through it. Even with the extra tokens, I wasn't going to make it to end of month.

That's when it clicked: this wasn't sustainable, and I needed to figure out how to cut token usage without giving up quality or slowing down. What follows is what I've landed on.

## Watch your usage

### Usage meter

First thing worth knowing: there's a meter, and you can check it. In Claude Desktop, click your name at the bottom left, then Settings, then Usage. Sometimes it doesn't refresh on its own, so you have to click back in to get the latest number. Ever since that mid-month scare, I keep this open in a window off to the side.

### Claude Monitor

[Claude Code Usage Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) is a separate CLI tool that gives you a live read on burn rate within a rolling 5-hour session window. It's not connected to your account, so it's estimating, not reading real numbers. You can tell it what plan you're on (there's no Enterprise option, but there is a "custom" plan you can configure), and it'll show you things like a prediction for when you'll run out at your current rate. Treat it as a gut check on how fast you're going, not an exact figure.

TODO: screenshot of claude-monitor running

## Input tokens vs output tokens

Before getting into the tools, it helps to know that pricing is split into two buckets: input tokens (everything sent to the model: your prompt, the conversation history, any files or context loaded) and output tokens (what the model generates back). They're priced differently, with output tokens typically costing more per token than input. You don't need exact numbers to make use of this. Just knowing the two are tracked and billed separately explains why some tools target one side and some target the other, which is the next section.

## Tools

### rtk

[rtk](https://github.com/rtk-ai/rtk) (Rust Token Killer) saves input tokens. It acts as a proxy for common CLI commands. Claude runs a command like `git status`, and instead of the raw output going straight into the conversation, rtk intercepts it, runs the real command, and returns a condensed version. That condensed version is what actually gets sent to the model.

TODO: side-by-side example, `git status` output vs `rtk git status` output on a side project

You can see your savings with `rtk gain --daily`:

TODO: sample `rtk gain --daily` output

A couple of things worth knowing about reading that table: the "Input" and "Output" columns here refer to the size of the *command's* output before and after rtk compresses it, not input/output tokens in the model-pricing sense from the section above. It's easy to conflate the two since the words overlap. "Output" in this table means the raw stdout from the shell command, which then becomes a smaller amount of input sent to Claude.

Installing rtk adds a reference to your user-level `~/CLAUDE.md`, something like:

```
@RTK.md
```

That `@` reference tells Claude to load `RTK.md`, which has the actual instructions for how and when to route commands through rtk. It's set up this way so it's active on every conversation, since you want command-wrapping behavior everywhere, not just in specific projects.

### Caveman

[Caveman](https://github.com/JuliusBrussee/caveman) saves output tokens. It changes how Claude responds: strips out filler, hedging, and pleasantries, while keeping the technical content intact.

It's installed as a hook, not a slash command you invoke each time.

TODO: find and show where the caveman hook is configured (plugin.json or similar)

`full` is the default intensity once it's installed. You can turn it off mid-conversation by saying "normal mode" to compare.

TODO: side-by-side example from a side project, same question asked with caveman on vs "normal mode"

`/caveman-stats` gives you an estimate of output token savings for the current session. It's not re-running your actual commands against the model without caveman for a real comparison. Instead it estimates against benchmarks from its own repo. Treat the number as a rough estimate, not an exact accounting.

### CodeGraph

[CodeGraph](https://github.com/colbymchenry/codegraph) parses your codebase into a graph of nodes and edges (symbols and their relationships) stored in a local SQLite database. When you ask a structural question, "what calls this function," "what would break if I changed this," Claude can query the graph directly instead of grepping and reading through files to piece the answer together.

I'm not 100% sure how much this saves in raw tokens, but my read is that it helps because querying a database is a more direct path to the answer than searching and reading files, and it also tends to be faster.

TODO: `token-savings-codegraph-usage-example.jpg`, screenshot of Claude using CodeGraph mid-conversation

To be clear this isn't a black box. After running the init command, CodeGraph adds a gitignored `.codegraph/` directory to your project root containing `codegraph.db`. It also runs a background process that watches your files (TODO: find this with `ps` and show it) and keeps the graph in sync as you edit, so there's nothing to manually re-run.

Since it's just a SQLite file, you can open it yourself with any SQLite tool, DBeaver for example, and look at the nodes and edges tables directly.

TODO: screenshot of DBeaver with `.codegraph/codegraph.db` open, nodes/edges tables

Like rtk, CodeGraph adds itself to your project-level `CLAUDE.md` so it's part of every session in that repo. (TODO: Show my CLAUDE.md snip for codegraph)

## Settings and habits

### Default to Sonnet

I used to default to Opus for everything, including tasks that didn't need it, and then forget to switch back for the next task. Now I default to Sonnet. It handles the majority of day-to-day work well, and I set effort to medium rather than the current default of high.

TODO: I've found Sonnet is good enough for the majority of tasks.

Worth a note on effort levels: with the newer Sonnet models, effort defaults to high, and if you push it up further to extra-high or max, it can end up costing more than just using Opus for that task. If you find yourself wanting extra-high or max effort regularly, that's probably a sign to switch models rather than crank the effort dial. (More on the effort/cost tradeoff: [Claude Sonnet 5, Opus 4.8, Fable 5: when to use which](https://www.digitalapplied.com/blog/claude-sonnet-5-opus-4-8-fable-5-when-to-use-which-2026#effort-matrix).)

### Set advisor to Opus

Claude Code has an [advisor](https://code.claude.com/docs/en/advisor) feature. With it set to Opus, Sonnet handles the day-to-day and delegates Opus in when it hits something that genuinely needs the stronger model. Use `/advisor` to set this.

TODO: `sonnet-calling-advisor-example-2.jpg`, screenshot of Claude calling advisor mid-task

The effect is you get cheaper execution most of the time, since Sonnet is doing the bulk of the work, and you only pay Opus rates for the parts that actually need it.

### Scope your prompts

Not every question needs the full history of a task loaded in. If you're reviewing one piece of PR feedback on a single method, you don't need the entire planning discussion or every commit that led up to it. The more narrowly you can scope what's relevant to the actual question, the less gets sent as input on every turn of that conversation. This one takes some judgment. There isn't a command for it. It's more about noticing when you're carrying context that has nothing to do with what you're currently asking.

### Run /context periodically

`/context` shows you what's currently loaded into the context window during a session. This is worth checking on longer sessions because loaded context counts as input tokens, and it gets resent on every message in that conversation.

Running this at work is what led me to the biggest single win I found, covered next.

### Audit your CLAUDE.md

My team's project-level `CLAUDE.md` had accumulated a lot of `@` references over time: frontend docs, analytics how-tos, Stripe subscription details, third-party integration guides, and more. Each `@` reference tells Claude to load that file's contents into every session automatically. So even a conversation with nothing to do with subscriptions was loading the full subscriptions doc, on top of everything else, every single time.

I had Claude audit the file and help whittle it down. First pass: some of those `@` references turned out to be redundant, already covered by Rails-specific skills we had set up in the project. For the rest, the fix was to reword them from always-load references into conditional ones, something like *"When asked about subscriptions, read `path/to/subscriptions-doc.md`."* Claude only pulls that file in when it's actually relevant to the question being asked.

To make sure I wasn't losing fidelity in the process, Claude also generated a set of sample prompts I could run against the trimmed-down file to confirm it could still find the same details it could before.

TODO: before/after numbers on total input tokens saved by this CLAUDE.md cleanup

This one is worth taking seriously if you're on a team. It's not just your own savings, it multiplies by every team member, on every conversation, for as long as that file stays bloated.

### Clear often

Claude Code doesn't hold state between messages the way you might assume. The model is stateless, so the only way to maintain continuity in a conversation is to resend the entire thing each time you ask something new. A long-running session doesn't just accumulate context, every additional message costs more than the last, even if the new message itself is short.

`/clear` when you finish a task or switch to a new one. I'll also clear mid-task if I'm taking a different approach on the same problem, even before it's done, if the earlier back-and-forth isn't useful anymore.

There's a nuance here worth knowing about: [prompt caching](https://code.claude.com/docs/en/prompt-caching). It softens the resend cost somewhat, cached portions of a conversation are cheaper to resend than fresh input, but there's still a (smaller) cost to writing to the cache, and cached entries expire after a TTL that varies by plan. Worth reading the docs if you want the full picture, but the short version is that while caching helps, it doesn't eliminate the cost of a long conversation.

## Summary

| Tool / technique | Saves | What it does |
|---|---|---|
| [rtk](https://github.com/rtk-ai/rtk) | Input tokens | Condenses CLI command output before it's sent to the model |
| [Caveman](https://github.com/JuliusBrussee/caveman) | Output tokens | Strips filler and pleasantries from responses, keeps technical content |
| [CodeGraph](https://github.com/colbymchenry/codegraph) | Likely both | Answers structural code questions via a graph database instead of grep/read |
| [Claude Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) | N/A (visibility only) | Live burn-rate gauge based on a 5-hour rolling window |
| Default to Sonnet + [advisor](https://code.claude.com/docs/en/advisor) → Opus | Both | Runs cheaper model by default, escalates to a stronger model only when needed |
| Scope your prompts | Input tokens | Avoid loading irrelevant history/context into a focused question |
| `/context` | Visibility | Shows what's currently loaded into the context window |
| Audit `CLAUDE.md` | Input tokens | Replace always-loaded `@` references with conditional, on-demand ones |
| `/clear` often | Input tokens | Avoids resending a long, no-longer-relevant conversation history |

## Closing thoughts

TODO: Exhausted img/meme

If you're feeling exhausted reading this, I don't blame you. Learning to use AI tools effectively is already a big shift in how software engineering gets done. And just as that starts to feel normal, here comes another layer: "also, watch your spending," and a list of another 20 things to learn.

Here's an analogy I keep coming back to: a high-efficiency washing machine uses less water by design. You don't buy a separate gadget and bolt it onto your washer to make it use less water. It's just built that way. I'm hoping token efficiency eventually gets baked into the tooling the same way, so we can spend less time watching meters and more time actually shipping things that solve problems for the people using our software.

## TODO

- various TODO's in the post
  - some screenshots at: scratch/token-savings
- edit
