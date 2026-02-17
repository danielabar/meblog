---
title: "Building an AI Blog Editor with Claude Skills"
featuredImage: "../images/ai-blog-editor-yannick-pulver-hopX_jpVtRM-unsplash.jpg"
description: "How I built a custom Claude skill to act as a technical blog post editor, automating editorial review that previously required human reviewers."
date: "2026-02-21"
category: "productivity"
related:
  - "Slowing Down AI On Purpose"
  - "What AI-Assisted Coding Feels Like in Early 2026"
  - "AI Forecasts, Fear, and Focus"
---

I've been blogging for years, but I've never had an editor. My process has always been: write a draft, sleep on it for a few days, then come back with "fresh eyes" to do my own editing. It works, but it's far from ideal. When I worked at a company with an engineering blog, we had a group of writers who would take turns editing each other's posts. Having another person's feedback and perspective was invaluable. But on my personal blog? I could ask a friend or colleague, but I don't like to bother people with that kind of commitment.

## The Code Review Parallel

In software development, no matter how confident you are in your code, you always have another developer review it before merging. That fresh perspective catches issues you'd never notice yourself. It's not about skill level, it's about having been too close to the problem.

Blog posts are the same way. After spending hours crafting an article, you lose objectivity. You know what you meant to say, so you read what you intended rather than what you actually wrote.

## Enter Claude Skills

I've been using Claude Code for development work and found it significantly better than other AI coding assistants. So when I learned about [Claude Skills](https://claude.com/skills), I wondered: could someone have built a skill to make Claude function as a technical blog post editor? I searched and found several skills for blog post *writing*, but nothing for *editing*. So I decided to build one myself.

## Building the Skill

In true AI-assisted fashion, I asked Claude to develop its own editing skill. I pointed it to the official documentation, including the [Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf), and explained what I needed.

My requirements for a technical blog post editor:

**Detect common writing issues:**

- Long run-on sentences
- Overly verbose explanations
- Too many superlatives
- Repetition of concepts
- Poor logical flow
- Unexplained acronyms or technical terms
- Posts that are too long (should they be split into a series?)

**Check technical accuracy:**

- Validate code snippets for the specified language
- Verify that technical explanations are accurate

**Provide actionable feedback:**

- Don't just point out problems—suggest rewrites
- Give concrete recommendations

**Save output systematically:**

- Generate editorial review in `scratch/{post-slug}-editorial-review.md`
- (I keep a `scratch` directory in all my projects for AI output)

Claude came up with additional checks I hadn't even considered, like reviewing SEO elements in the frontmatter description. And categorizing recommendations by priority like Must Address, Should Address, and Nice to Have.

<aside class="markdown-aside">
Ironically, even after reading the official documentation, Claude initially created the skill file as <code>.claude/skills/blog-editor.md</code>. When I tried to use it, I kept getting "unknown skill 'blog-editor'" errors, even after restarting. The correct location is <code>.claude/skills/blog-editor/SKILL.md</code>—the skill needs to be in its own directory with a file named <code>SKILL.md</code>. Once I renamed it, everything worked perfectly.
</aside>

## Using the Skill

Invoking the skill is simple—use the `/blog-editor` command (Claude makes skills available via slash-command syntax) with the path to your draft:

```bash
/blog-editor src/markdown/building-a-no-frills-meditation-app.md
```

The skill reads the post, analyzes it comprehensively, and generates a detailed editorial review with specific suggestions in the `scratch` dir.

## Real-World Results

I've now used this skill for several blog posts, and it feels remarkably close to having another human review my work. It's caught numerous issues I would have missed:

- **Repetition tracking:** In long posts, I sometimes repeat a concept multiple times without realizing it. The skill catches this every time.
- **Logical flow:** It's helped reorganize sections to improve the narrative structure.
- **Sentence tightening:** It excels at identifying overly long sentences and suggesting more concise alternatives.
- **Transitions:** It points out where transitions between sections are needed to avoid jarring jumps in topic.

## The Complete Skill

The full skill implementation is available in my blog's GitHub repository: [blog-editor/SKILL.md](https://github.com/danielabar/meblog/blob/master/.claude/skills/blog-editor/SKILL.md)

## Conclusion

Building this Claude skill has been like having a dedicated editor on call 24/7. While it won't replace the nuanced feedback of an experienced human editor, it provides a remarkably thorough editorial review that catches the majority of common issues.

If you're a technical blogger, I'd encourage you to try building a similar skill or feel free to copy and modify mine. The investment is minimal, it took one conversation with Claude to create, and the ongoing value is substantial. Every post I publish now gets that "second pair of eyes" review I've always wanted.

And in a pleasant bit of meta-circularity, this very post was edited by the skill it describes.

## TODO

- clarify in "Using the Skill" that slash commands are a different thing, but claude also makes skills available via the same syntax
- use blog-editor!
