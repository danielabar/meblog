# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Gatsby 5 and React. It features:
- Blog posts written in Markdown with frontmatter
- Pagination with programmatically generated list pages
- SEO optimization with React Helmet (Facebook Open Graph, Twitter cards)
- Syntax highlighting via gatsby-remark-vscode with custom VSCode extensions
- RSS feed generation
- PostgreSQL full-text search integration (generates search.sql during build)
- CSS Modules for component styling

## Development Commands

**Start development server:**
```bash
make dev
```

**Clean cache and start dev (use when pages don't refresh properly):**
```bash
make devclean
```

**Test production build locally:**
```bash
make serve
```

**Deploy to GitHub Pages:**
```bash
make deploy
```

**Format code:**
```bash
npm run format
```

**Generate new blog post:**
```bash
./scripts/generate-post.sh my-article-title my-category
# Creates src/markdown/my-article-title.md with template
```

## Testing

**Run all tests:**
```bash
make test
```

**Run tests in watch mode:**
```bash
make testw
```

**Run specific test:**
```bash
node_modules/.bin/jest -t "Component renders correctly"
# Use the describe + it strings to target a specific test
```

**Update snapshots:**
```bash
make testu
```

**Test coverage:**
```bash
make testc
```

Test files use `.spec.js` extension and are colocated with source files. Tests use Jest with React Testing Library and jsdom environment.

## Architecture

### Page Generation System

Gatsby uses two methods to create pages:

1. **Static pages** - Files in `src/pages/` automatically become pages:
   - `index.js` → `/` (homepage)
   - `about.js` → `/about/`
   - `learning.js` → `/learning/`
   - `search-results.js` → `/search-results/`
   - `404.js` → `/404.html`

2. **Programmatic pages** - Created in `gatsby-node.js`:
   - Individual blog posts use `src/templates/post.js`
   - Paginated blog lists use `src/templates/blog-list.js`
   - Pages are created by querying all markdown files and calling `createPage()` for each

### Content Structure

- **Blog posts**: Markdown files in `src/markdown/`
- **Learning content**: Markdown files in `src/learning/`
- **Images**: `src/images/` and `src/images/learning/`
- **CSV data**: `src/csv/` (transformed by gatsby-transformer-csv)

All markdown files require frontmatter with:
```yaml
---
title: "Post Title"
featuredImage: "../images/image-name.jpg"
description: "Brief description for SEO"
date: "YYYY-MM-DD"
category: "category-name"
related:
  - "slug-of-related-post-1"
  - "slug-of-related-post-2"
---
```

### Component Organization

- `src/components/` - Reusable React components (Header, Footer, SEO, Layout, etc.)
- `src/components/learning/` - Components specific to the learning section
- `src/templates/` - Page templates for programmatically generated pages
- Components use CSS Modules (`.module.css` files) for styling

### Utilities and Helpers

- `lib/search-helper.js` - Generates SQL INSERT statements for PostgreSQL search
- `lib/node-edges-helper.js` - Helper for processing GraphQL query results
- `src/workers/` - Web workers (e.g., hello.worker.js)
- `src/hooks/` - Custom React hooks (e.g., useviewport.js)

### Key Gatsby Files

- `gatsby-config.js` - Site configuration, plugins, metadata
- `gatsby-node.js` - Build-time page generation and search.sql creation
- `gatsby-browser.js` - Browser-specific runtime APIs

## Search Feature

The build process generates `search.sql` at project root containing INSERT statements for a PostgreSQL full-text search service. This happens in `gatsby-node.js` during the `createPages` API call. Each blog post is converted to an INSERT statement via `lib/search-helper.js`.

The search service is external (hello-visitor) and requires `HELLO_URL` environment variable set in `.env.development` and `.env.production`.

## Styling

- Global styles: `src/styles/markdown.css` for markdown content
- Component styles: CSS Modules (`.module.css` files colocated with components)
- Markdown element styling: Map markdown elements to CSS classes in `gatsby-config.js` under `gatsby-remark-classes` plugin

## Environment Variables

Create `.env.development` and `.env.production` with:
```bash
HELLO_URL=http://localhost:3000/visits  # or production URL
```

## GraphQL Queries

Use GraphiQL at `http://localhost:8000/___graphql` during development to test queries.

To query blog posts:
```graphql
{
  allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    sort: { frontmatter: { date: DESC } }
  ) {
    edges {
      node {
        frontmatter { title date category }
        fields { slug }
      }
    }
  }
}
```

## Markdown Asides

To add a callout/aside box in a blog post, use raw HTML (not markdown syntax) as follows:

```html
<aside class="markdown-aside">
Content goes here. Use <code>inline code</code> for code snippets (not backticks — this is HTML).
For links, use <a class="markdown-link" href="https://example.com">link text</a>.
</aside>
```

Rules:
- The `<aside>` element must have `class="markdown-aside"` for correct styling
- Links inside the aside must use `<a class="markdown-link" href="...">` — plain `href` without the class won't be styled correctly
- Use `<code>...</code>` for inline code, not backticks, since the content is HTML not markdown

## Markdown Linking

**Link to another post:**
```markdown
[Link text](../other-post-slug)
```

**Link to section within post:**
```markdown
[Link text](../other-post-slug#section-heading)
```

**Embed image:**
```markdown
![alt text](../images/image-name.png "image description")
```

## Post Artifacts

A post can link to a standalone, self-contained visual explainer (e.g.
generated by a tool like the eli5 skill) rendered on its own page under
the post's URL.

To add one:

1. Place the self-contained HTML file in `static/artifacts/<file>.html`.
   It's served as-is; it should not depend on the site's CSS or JS.
2. Declare it in the post's frontmatter:

   ```yaml
   artifacts:
     - slug: "metabolic-theory-eli5"
       title: "Cancer's Power Plants: The Metabolic Theory, Explained Simply"
       file: "metabolic-theory-eli5.html"
       creditText: "eli5 skill"
       creditUrl: "https://github.com/anthropics/claude-plugins-community/tree/main/eli5"
   ```

This automatically creates a page at
`/blog/<post-slug>/<artifact-slug>/`, but nothing links to it until you
place a card for it in the post body (below). There is no automatic
top-of-post list.

**Placing a link card at a specific point in the post** (the normal way
to surface an artifact): drop a marker comment where you want the card to
appear, referencing the `slug` from that post's `artifacts` frontmatter:

```markdown
<!-- artifact: metabolic-theory-eli5 -->
```

This is handled by the local remark plugin at
`plugins/gatsby-remark-artifact-embed/`, which swaps the marker for a
link card (icon, title, "Simplified visual explainer" subtitle, arrow)
pointing at the artifact's page. Place it wherever in the post the
content it explains has just been covered, not necessarily near the top.
The build fails if the slug isn't declared in that post's `artifacts`
frontmatter, so a typo or a stale slug (e.g. after a rename) is caught at
build time rather than shipping a broken link.

**Linking to it inline as plain text instead of a card** (e.g. mid-sentence,
or from inside an `<aside>`), relative to the post (note `./`, not `../`,
since the artifact page is nested one level under the post's own URL):

```markdown
For a visual walkthrough, see [this explainer](./metabolic-theory-eli5).
```

From inside an `<aside>` (which uses raw HTML, not markdown syntax, per
the "Markdown Asides" section above), use `<a class="markdown-link">`
with the same relative path:

```html
<aside class="markdown-aside">
For a visual walkthrough, see <a class="markdown-link" href="./metabolic-theory-eli5">this explainer</a>.
</aside>
```

## Installation Notes

Use `--legacy-peer-deps` flag when installing dependencies:
```bash
make install
# or
npm install --legacy-peer-deps
```
