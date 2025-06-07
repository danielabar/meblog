---
title: "The Machines Finally Made Us Care About Documentation"
featuredImage: "../images/machines-care-documentation-maxim-berg-pEb1rA-fElU-unsplash.jpg"
description: "AI coding assistants like GitHub Copilot are making engineers care about documentation again — not for their teammates, but to train the machines."
date: "2025-06-07"
category: "productivity"
related:
  - "About Those Docs"
  - "Reflections on Effective Teams"
  - "Rapid Prototyping with ChatGPT: OAS Pension Calculator Part 1"
---

I’ve been talking for years about the value of engineering documentation—and trying to convince fellow developers to write more of it. Not just the basics like a README.md, but deeper internal docs: architecture decisions, coding conventions, naming systems, third-party integrations, and those invaluable “why we do it this way” explanations. This kind of documentation accelerates onboarding, helps future-you decode past-you’s decisions, and keeps teams from reinventing the wheel every time they build something new.

But to be honest, it's been an uphill climb. For the longest time, it felt like I was shouting into the void. Engineers love writing code. But writing about code? Forget it. "Nobody reads the docs" they’d say, or "We’ll catch up with the docs later when we have time". Spoiler: there's never time and it rarely happens.

And then... AI coding assistants showed up.

## The Machines Are Reading

GitHub Copilot introduced [Repository Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot?tool=vscode). It uses a `.copilot/` directory in the root of the project repository, with markdown files that explain the project's architecture, conventions, and best practices.

And just like that, engineers are starting to do the thing they’ve resisted for years - writing thoughtful and structured documentation. Why? Because now, documentation doesn’t just help your teammates. It helps your AI coding assistant help you, and that's an immediate feedback loop.

Here's an [example](https://github.com/Duartemartins/rails_copilot_instructions/blob/master/.github/copilot-instructions.md) for a Rails 8 application, placed in `.github/copilot-instructions.md`:

```markdown
# Modern Rails 8 Application

This is a Rails 8 application built with modern practices including Turbo, Stimulus, and Solid Queue. Follow these guidelines for all code generation:

## General Coding Guidelines

- Use semantic and clean HTML in ERB templates
- Follow Ruby style conventions (2-space indentation, snake_case methods)
- Use Turbo for page transitions and dynamic updates
- Implement Stimulus controllers for interactive elements
- Utilize Tailwind CSS for styling with component-based design
- Keep controllers thin, move logic to service objects when appropriate
- Use Import Maps for JavaScript dependency management
- Use Solid Queue for background job processing
- Follow Kamal deployment best practices for production

## Technology Stack

- Rails 8.0
- Ruby 3.3+
- Turbo & Stimulus (Hotwire)
- Solid Queue
- Kamal for deployment
- SQLite
- Tailwind CSS
- Import Maps for JavaScript management

## Project Architecture

This application follows a standard Rails structure with some specific organization:

- Controllers are minimal and focused on presentation
- Service objects handle complex business logic
- Background jobs process asynchronous tasks
- Use Turbo and Stimulus for interactive components
- Prefer Import Maps over bundlers for JavaScript dependency management
- Follow Rails conventions for file structure and naming
- Use SQLite for development and PostgreSQL for production

## Specialized Instruction Files

This application uses specialized instruction files to define best practices for specific areas:

- Rails 8: See `.github/instructions/rails8.instructions.md` for Rails 8 conventions
- Turbo/Stimulus: See `.github/instructions/turbo-stimulus.instructions.md` for Hotwire patterns
- Solid Queue: See `.github/instructions/solid-queue.instructions.md` for background job processing
- Kamal: See `.github/instructions/kamal.instructions.md` for deployment configuration
- TailwindCSS: See `.github/instructions/tailwind.instructions.md` for styling guidelines
- Import Maps: See `.github/instructions/importmaps.instructions.md` for JS dependency management
```

Additional guidance can be added in `.github/instructions/*.instructions.md`. See [rails_copilot_instructions](https://github.com/Duartemartins/rails_copilot_instructions/tree/master) on GitHub for further details.

It's not just Copilot offering a structured documentation format. Tools like Windsurf and Cursor (AI-first IDEs built on VS Code) also support similar concepts to guide the assistant’s behavior.

Cursor has [Project Rules](https://docs.cursor.com/context/rules). These are written in `.mdc`, which is more structured than regular Markdown, but still human readable. Here are some [examples](https://github.com/diegomarino/awesomic-cursor-rules/tree/main).

Windsurf has [File Based Rules](https://windsurf.com/blog/windsurf-wave-8-cascade-customization-features) that perform a similar function, with markdown files placed in the projects' `.windsurf/rules` directory.

With these markdown-based engineering docs, the AI assistant can offer more relevant suggestions that are in line with the projects' tooling and standards. For example - a preference for business logic in service objects rather than "fat controllers" or "fat models", or css styles that match the existing tooling - Tailwind, SASS, BEM, etc.

## A New Reason to Care About Docs

This isn’t just a guide for your teammates anymore - it’s a training manual for your AI pair programmer. The AI has become the best reader of your internal docs, and that’s shifting how we think about writing them.

For folks like me who’ve been advocating for strong written communication in engineering teams, there's a certain irony here. Engineers that couldn't be persuaded to write docs for their fellow engineers, are now eager to write docs for their AI coding tools.

Well maintained documentation isn’t a burden. It’s leverage. It always has been. The difference is that now, you can *see* that leverage immediately in the form of smarter suggestions, cleaner diffs, and more aligned code across your team.

## Write to be Read by Humans and Machines

These AI-specific context files double as great human documentation. They’re short, focused, and actionable. Unlike Confluence or Notion wiki pages, they live alongside your code, which is another aspect of documentation I've always advocated for.

If you’ve ever thought “I don’t have time to write this down,” think of it this way: every line of context you write today means fewer irrelevant AI assistant suggestions, fewer PR comments about convention mismatches, and fewer hours debugging misunderstood business logic.

Writing is coding now. Especially when machines are reading it.
