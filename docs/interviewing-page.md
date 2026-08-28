# Interviewing Page — Maintenance Guide

The `/interviewing/` page is a standalone page shared with recruiters and hiring
managers. It is not a blog post and does not appear in the site navigation.

## Updating the content

The entire prose content lives in one file:

    src/content/interviewing.md

To update the page — add a project, rewrite a section, update a link — edit that
file only. No JavaScript or CSS files need to change.

The frontmatter block at the top of the file must stay as-is:

    ---
    title: "On Technical Assessments"
    description: "..."
    ---

Do not add `date`, `featuredImage`, `category`, or `related` — those are blog post
fields and do not apply here.

## Supported markdown features

| Syntax | Renders as |
|--------|------------|
| `## Section heading` | Section heading with thin underline |
| `**bold text**` | Bold, dark purple |
| `` `inline code` `` | Monospace, purple-tinted background with border |
| `[link text](https://...)` | Brand purple link with hover underline |
| `---` on its own line | Three-dot ornamental break (· · ·) |
| Blank line between paragraphs | New paragraph |

The `---` thematic break appears once in the content, between the neutral opening
argument and the first-person record section. The styling is defined in
`src/styles/markdown.css` (`.markdown-thematic-break`) and applies site-wide —
future blog posts can use `---` and will get the same treatment automatically.

## Previewing changes

    make dev

Open `http://localhost:8000/interviewing/`. The dev server hot-reloads on markdown
saves — no restart needed for content-only edits.

If pages are not refreshing correctly:

    make devclean

## Deploying

    make deploy

The page will be live at `https://danielabaron.me/interviewing/`.

## What NOT to change

- Do not add `/interviewing` to `src/components/nav-menu.js` or
  `src/components/nav-menu-responsive.js` — the page is intentionally unlisted.
- The `noindex` meta tag in the page component (`src/pages/interviewing.js`)
  prevents search engine indexing — do not remove it.
- The page is excluded from the sitemap in `gatsby-config.js` — keep that exclusion.

## Files involved (for reference)

| File | Purpose |
|------|---------|
| `src/content/interviewing.md` | Page content — edit this to update the page |
| `src/pages/interviewing.js` | Page component — no changes needed for content updates |
| `src/pages/interviewing.module.css` | Page-specific styles |
| `src/styles/markdown.css` | Global markdown styles including the `---` HR style |
| `gatsby-config.js` | Sitemap exclusion and filesystem source for `src/content/` |
