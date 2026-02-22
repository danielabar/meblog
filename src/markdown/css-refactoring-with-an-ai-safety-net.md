---
title: "CSS Refactoring with an AI Safety Net"
featuredImage: "../images/css-refactoring-with-ai-safety-net-maya-alexa-g-romero-lTv2oYFaAmE-unsplash.jpg"
description: "How to safely refactor messy CSS using AI assistance and screenshot-based visual diffing as a regression safety net."
date: "2026-03-15"
category: "css"
related:
  - "Slowing Down AI On Purpose"
  - "What AI-Assisted Coding Feels Like in Early 2026"
  - "Rapid Prototyping with ChatGPT: OAS Pension Calculator Part 1"
---

A while back I built a small breathing meditation app — vanilla HTML, CSS, and JavaScript, no
frameworks, no build tools. I vibe-coded most of it using GitHub Copilot's free tier in VS Code,
which at the time was backed by an older, less capable model. The result was exactly what you'd
expect from that workflow: it worked, the resulting app solved a real problem for me, the features were all
there, and I used it daily. But the code, particularly the CSS, was a hot mess.

I eventually wanted to do a visual design refresh — new typography, tighter spacing, a more
polished feel. And I immediately ran into a wall. The CSS was so tangled that I couldn't safely
change anything. I'd edit one rule and something unrelated would break. I'd try to understand
which styles were actually applying to an element and find three different files all claiming to
style the same thing. The free-tier vibe coding session had left me with a functioning app but
unmaintainable styles.

Before I could do the design work I wanted, I had to clean up the CSS first. By this point I'd
moved on from Copilot to a paid Claude Code subscription, which gave me access to
more capable models. Here's the technique I came up with to do that refactor safely with AI
assistance — and why it's different from the E2E testing you might already be familiar with.

## What was wrong with the CSS

Before touching anything, I had Claude Code perform an audit of the existing styles. Here's what it found:

**`index.css` wasn't just an entry point.** There was even a TODO comment in the file saying it
should only import other files. But it had accumulated ~130 lines of real styles, mostly
duplicating rules that already existed in `global.css`. Two files styling the same elements, with
the later one silently winning.

**A subtle import order bug.** `reset.css` referenced CSS custom properties (`var(--color-bg)`)
that weren't defined until the *next* file in the import chain, `variables.css`. This worked
because browsers resolve custom property values lazily at paint time, not at parse time. So it
never broke — but it was fragile by accident, not by design.

**No cascade layers, so everything was a specificity fight.** Without `@layer`, every CSS rule
competes on selector specificity. Add a class and something breaks somewhere else. This is the
root cause of the "can't touch it without breaking it" feeling that makes CSS refactors
terrifying.

**A circa-2011 Eric Meyer reset.** The old-school approach: a long list of every HTML element
zeroed out. No `box-sizing: border-box` globally, no `prefers-reduced-motion`, no modern element
handling. As a result, `box-sizing: border-box` was sprinkled ad-hoc across individual elements
wherever someone noticed it was needed.

**`width: 100vw` used about ten times.** This is almost always wrong — `100vw` includes the
scrollbar width and causes horizontal overflow. `width: 100%` is what was almost certainly
intended.

**Button styles in four different files.** There were four visually similar button types around
the app, all sharing the same brand colors, all styled independently with zero shared base. Changing
the primary color meant hunting down four separate declarations.

**Hard-coded hex values scattered throughout.** `#fff`, `#888`, `#f9f9f9`, `#e0f7fa` — all
appearing inline in rules, even though a `variables.css` file with CSS custom properties already
existed.

None of this is unusual for CSS that grew organically through a vibe-coding session with a
free-tier AI model. It works until it doesn't.

## The goal: a true refactor

Around this time I came across [csscaffold](https://github.com/robzolkos/csscaffold), a project
by Rob Zolkos that lays out a sane, opinionated CSS architecture built on cascade layers. It's
framed as a Rails tool, but the CSS organization ideas apply to any project. Reading it
made clear just how far my CSS was from where it could be, and gave me a concrete target to aim
for. This is what I pointed Claude Code to when planning the refactor. I wanted an architecture I
could actually reason about and build on, not just a cleaned-up version of the existing mess.

Before AI assistants, I wouldn't have attempted this. I'd have looked at csscaffold, thought "that's the right approach — I'll use it on the next new project" — and done a conservative cleanup of what was there instead. Retrofitting an entire CSS architecture onto an existing codebase is easy to rationalize deferring: the payoff is invisible (the app looks identical when you're done), the risk is real, and it's all on you to catch every regression. Having Claude Code to help plan the phases, make the changes, and verify nothing broke shifted that calculation enough to make it worth attempting.

The key idea from csscaffold is **CSS cascade layers**:

```css
@layer reset, base, components, utilities;
```

This declaration means cascade priority is determined by layer membership, not selector
specificity. `utilities` always beats `components`; `reset` always loses. You can write `.btn`
and `nav button` without worrying about which one has higher specificity. No more specificity
wars.

With that as the target, the objective I gave Claude Code was strict: **zero visual change**.
Improve the structure, don't touch the output. Classic refactor. We planned the work in seven
phases, one conceptual change at a time:

| Phase | What                                                  |
| ----- | ----------------------------------------------------- |
| 1     | Add `@layer` declaration to `index.css`               |
| 2     | Fix import order (variables before reset)             |
| 3     | Consolidate duplicates, make `index.css` imports-only |
| 4     | Wrap each file's content in `@layer` blocks           |
| 5     | Replace old reset with modern reset                   |
| 6     | Unified button system with shared `.btn` base         |
| 7     | Replace hard-coded hex values with CSS variables      |

## The hard part: proving nothing broke

Here's what makes CSS refactors treacherous. There's no compiler to catch a mistake. Things
just quietly look wrong — and often subtly wrong, in a way that slips past a quick manual
browse. A 2px layout shift, a slightly different `line-height`, a border radius that got
crisper. Nothing that throws an error. Nothing that breaks a test.

You might think: I already have Playwright tests, or some E2E suite — won't those catch
regressions? Not this kind. E2E tests verify *functionality*: can you click this button, does
this form submit, does this page navigate correctly. They say nothing about whether the button
looks right, whether the spacing changed, or whether a color was silently overridden. CSS
regressions are visual, and visual is exactly what functional tests skip.

With seven phases to work through, I needed a way to verify after every single change that
nothing had shifted visually. Doing that manually — opening a browser, clicking through the
app, eyeballing it — isn't just tedious. It's unreliable, because the app isn't just one
page. It has states that require interaction to reach: a navigation drawer that has to be
opened, a list view that looks completely different when populated vs. empty, form states that
are only visible after a specific dropdown selection. A manual check that misses any of those
states isn't really a check at all.

I had an idea that if all the app state screenshots could be captured before starting, then again after each refactoring step and compared, and if this could be automated, it would save me a lot of time and headaches.

## Capturing every state

I'd initially looked into using the Chrome DevTools MCP server for browser automation, but landed
on [playwright-cli](https://github.com/microsoft/playwright-cli) as a better fit — it's more
token-efficient for agentic use since it doesn't load large tool schemas into the model's context.
I asked Claude Code to write a script that would navigate through every meaningful app state,
capture a screenshot of each, and save them to a labeled directory — designed from the start to
be re-run after every refactor phase.

The first step in writing that script was to enumerate every meaningful state the app could be in
— not just the page routes, but the transient states that require interaction to reach: a form
with a secondary input revealed by a dropdown selection, the navigation drawer mid-open, a list
view that looks completely different when populated vs. empty, an in-progress state with a visible
status indicator. For this app, that came to nine distinct states.

The script drives the browser through all of them automatically — clicking navigation elements,
filling out forms, waiting for transitions to fully settle, then saving a named PNG. The
label passed on the command line determines the output directory, which is what makes the
workflow reusable across phases:

```javascript
const OUT_DIR = `scratch/css-reorg/screenshots/${process.argv[2] ?? 'run'}`;

async function capture(page, name) {
  const file = `${OUT_DIR}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
}

// example: capturing the navigation drawer in its open state
await page.click('#hamburger-btn');
await page.waitForSelector('.mobile-menu:not([hidden])');
await page.waitForTimeout(300); // wait for CSS transition to finish
await capture(page, 'menu-open');
```

With the script written, running it is one command:

```bash
node scripts/screenshots.js baseline   # before touching anything
node scripts/screenshots.js phase-3    # after each refactor phase
```

## Screenshot diffing with AI

The screenshot script has no diffing code at all. It just saves PNGs.

The comparison step was: **ask Claude to read both sets of PNG files and describe any differences.**

Claude Code can read image files directly — it processes the actual visual content of the
screenshots. After each phase, the workflow was literally one prompt:

```
"Read the baseline screenshots and the phase-3 screenshots and tell me if anything looks different."
```

Claude would load all 9 pairs of PNGs and compare them. If something changed — a spacing shift,
a color difference, a layout jump — it would describe exactly what changed and in which screenshot.
Not "these pixels differ" but "the card border radius looks slightly sharper, and there's a small
increase in the spacing above the heading."

A few things made this particularly effective:

*Signal vs. noise.* Pixel-diff tools are binary within a threshold. Anti-aliasing variations in
text glyphs, tiny rendering differences between runs, slight PNG compression artifacts — all of
these generate noise that requires threshold tuning. Claude's visual comparison filters this
naturally, the same way a human looking at two screenshots would. It ignores imperceptible
variations and flags things that actually look different.

*Actionable output.* "The card border radius looks slightly sharper in the phase-4 screenshot"
tells me exactly what to search for in the CSS. A diff heatmap doesn't.

*No context switch.* The same assistant that made the CSS changes read the screenshots. When a
regression appeared, it could immediately connect the visual change to the code change that caused
it. When replacing the old reset introduced a different default `line-height`, Claude flagged it
in the comparison, identified which reset property caused it, and proposed the fix — all in one
response. There was no jumping between a diff viewer and a code editor.

*Zero integration overhead.* No SDK, no account, no CI config, no test runner. The
"infrastructure" is a folder of PNGs and a natural language prompt.

## Why not a dedicated visual regression tool?

This is not an unexplored problem. Visual regression testing tools have existed for years — Percy,
Chromatic, Playwright's own built-in visual testing. It's worth being honest about why none of
them were the right fit here.

**Percy** (now owned by BrowserStack) is the most well-known SaaS option. You install their SDK,
run your test suite, and Percy handles screenshot capture, storage, baseline management, and diff
review in the cloud. It even recently added an AI layer that draws bounding boxes around meaningful
changes and filters rendering noise. The free tier covers 5,000 screenshots a month, which is more
than enough for a project like this.

The cost isn't money, it's overhead. Percy is built for team environments with CI pipelines, shared
baseline approval workflows, and a review dashboard for pull requests. For a solo developer doing a
one-time refactor with no CI at all, setting up Percy would mean: creating an account, installing
and configuring the SDK, wiring it into a test runner I wasn't otherwise using, and learning its
baseline management model. It felt like installing a freight elevator to move one box.

**Chromatic** is similar to Percy but built around Storybook. Not applicable here — plain HTML app,
no component library.

**Playwright's built-in visual testing** is the closest alternative and worth dwelling on. Playwright
ships `expect(page).toHaveScreenshot()` which uses pixelmatch under the hood to compare against a
committed baseline image. Since I was already using Playwright for the capture script, this was
genuinely tempting.

The problem is a well-documented one: OS-specific rendering differences. Baseline screenshots taken
on macOS differ from screenshots taken on Linux due to font rendering, subpixel antialiasing, and
color profile differences. If you ever run this in CI (even just on a different machine), your
baselines won't match. For a purely local workflow on one machine, it might work — but you'd still
need to tune pixel-diff thresholds to suppress rendering noise, and you'd need to restructure the
script as a proper test file.

**pixelmatch** is the raw library that Playwright and others use under the hood. Lightweight, no
cloud dependency, runs locally. You'd extend the screenshot script to load both PNGs, run them
through pixelmatch, and report the diff percentage. But the output is a pixel heatmap, not a
description. "42 pixels changed in screenshot-5.png" doesn't tell you *what* changed. You'd still
need to open the diff image and interpret it manually. And the false-positive problem with rendering
noise would still require threshold tuning.

## Results

All 7 phases completed. The CSS went from:
- Duplicated rules in multiple files fighting each other for cascade priority
- A 2011-era reset with no `box-sizing: border-box`
- Button styles in four different files with no shared base
- Hard-coded hex colors scattered alongside the CSS variables that should have been used

To:
- `@layer reset, base, components, utilities` — predictable cascade, no more specificity fights
- Modern reset with universal `box-sizing: border-box` and `prefers-reduced-motion`
- A unified `.btn` base class with BEM variants (`.btn--primary`, `.btn--secondary`, `.btn--menu`)
- All colors via CSS variables, no stray hex values

Zero visual regressions across all 9 states, across all 7 phases.

The entire thing — analysis, planning, and execution across all 7 phases — took around 3 hours.
Without an AI assistant to help plan the phases, write and iterate on the capture script, make
the CSS changes, and compare the screenshots, this is the kind of refactor that would have
stretched across multiple days, with long gaps between attempts while you worked up the nerve
to touch the next file.

The screenshot comparison earned its keep in Phase 5. Replacing the old reset with a modern one
introduced a different default `line-height` that subtly changed how body text rendered — slightly
different spacing across several states. It wasn't dramatic; I'm not sure I would have caught it by
eye in a manual review. Claude flagged it immediately when comparing the PNGs. The fix was a single
line. Without the comparison, that regression would have shipped.

## The honest tradeoffs

I want to be upfront about where this approach falls short.

**Token cost is real, just small at this scale.** Claude charges for image inputs based on pixel
dimensions: `tokens = (width × height) / 750`. Each screenshot here was 375px wide with a typical
full-page height of around 1,200px, which is roughly 600 tokens per image. A comparison run reads
18 images (9 baseline + 9 new), plus the prompt and response: about 12,000 tokens total. At Claude
Sonnet pricing ($3 per million input tokens), that's around **$0.04 per comparison run**. With 7
phases and a few re-runs after fixes, I estimate the total image comparison cost for this entire
refactor was around **$0.40**. For a personal project, that's nothing. For a large team running
comparisons against 100 states on every CI push, the economics shift and dedicated tools become
more attractive.

**It could miss extreme precision regressions.** A 1px shift that a human wouldn't consciously
notice could slip through. For this project — where "visually identical" meant "looks the same
to a developer at a glance" — that precision level was right. For a pixel-perfect design system
where every spacing token is load-bearing, you'd probably want pixel-diff precision layered on
top.

**It optimizes for the one-time refactor scenario.** Percy and Chromatic are better fits for
ongoing CI workflows with team review processes. This technique shines for a bounded task: a
refactor, a migration, a one-time reorganization.

One observation worth noting: Percy recently added an AI review layer that draws bounding boxes
around meaningful changes and provides human-readable summaries of what changed. They're explicitly
trying to close the gap between pixel-diff output and semantic visual comparison. The industry is
moving toward the approach I described here — just with more infrastructure around it.

## When to use this technique

I'd reach for this approach for:

- **CSS refactors targeting zero visual change** — exactly this scenario
- **Design system migrations** — moving from ad-hoc styles to a token-based system
- **Framework migrations** — Bootstrap to Tailwind, or similar, where visual parity matters
- **Any small-to-medium project with no existing visual regression setup** — this is lighter weight
  than Percy or Chromatic to get started

I'd use something else for:
- Projects already running Percy, Chromatic, or Playwright visual tests in CI — don't replace what's working
- Apps with significant animation where screenshots capture only a moment in time
- Very large apps with hundreds of distinct UI states run on every commit — the token economics and
  snapshot management favor dedicated tooling at that scale

## What made it work

Looking back, three things were essential.

**Enumerate states exhaustively before writing a single line of the capture script.** The baseline
only protects you for the states you captured. A regression in the navigation drawer won't show up
if you never took a screenshot of the navigation drawer open. I spent time upfront listing every
meaningful state — not just page routes but transient interactive states: open drawers, populated
vs. empty lists, revealed form fields, in-progress indicators. That list was the most important
artifact of the whole process.

**Keep phases small.** Each phase was one conceptual change. When a regression appeared, the cause
was obvious because there was only one thing that could have caused it. A 7-phase refactor with 9
screenshots per phase is 63 comparison points, but each comparison is against a narrow, well-defined
change. That's a completely different risk profile than "I refactored the CSS, let me see if anything
broke."

**Use a more capable model for the work that requires reasoning.** The original CSS was built with
a free-tier Copilot model through casual vibe coding. That model was fine for generating working
code on demand. But it couldn't hold the architectural picture in mind, reason about cascade
behavior across files, or identify the root cause of a visual regression from a screenshot. Using
Claude Code — a paid subscription with a more capable model — made a meaningful difference at every
step: planning the phases, reasoning about which duplicated rules were actually rendering, identifying
regression causes from PNG comparisons, and proposing correct fixes.

The refactor is done. The CSS is now layered, de-duplicated, uses a modern reset, and has a unified
button system with all colors tokenized. And I can finally work on the design refresh I wanted to do
in the first place.

The technique turned a refactor that touched every CSS file in the project into a process where every
phase ended with "all screenshots identical to baseline." That's not usually how CSS refactors feel.

## References

- [csscaffold](https://github.com/robzolkos/csscaffold) — the CSS architecture project that inspired the layer-based approach
- [playwright-cli](https://github.com/microsoft/playwright-cli) — Playwright CLI used for the screenshot capture script
- [Percy](https://percy.io/) — visual regression testing SaaS (BrowserStack)
- [Percy AI Review Agent](https://bug0.com/knowledge-base/percy-visual-regression-testing) — overview of Percy's AI-powered diff analysis feature
- [Percy vs Chromatic](https://medium.com/@crissyjoshua/percy-vs-chromatic-which-visual-regression-testing-tool-to-use-6cdce77238dc) — comparison of the two main visual regression SaaS tools
- [Visual Regression Testing with Playwright and pixelmatch](https://testrig.medium.com/visual-regression-testing-with-playwright-and-pixelmatch-002770005019) — how pixelmatch integrates with Playwright
- [Claude image token pricing](https://platform.claude.com/docs/en/build-with-claude/vision) — Anthropic docs on how image tokens are calculated (`width × height / 750`)

## TODO

- Artificial line breaks from earlier outline?
- Make it more clear around "the objective I gave Claude Code was strict" - that I told Claude i wanted a complete restructure of the CSS as per the principles in cssscaffold project (TODO: point to examples dir in that project)
- This sentence is awkward "I had an idea that if all the app state screenshots could be captured before starting, then again after each refactoring step and compared, and if this could be automated, it would save me a lot of time and headaches."
- Can some details be shortened? details of actual project, details of other tools like percy etc.
- Transitions between sections so reader can follow-along thought process that led to solution (a little jumpy right now?)
