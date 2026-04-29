# My Blog

My blog is built with [GatsbyJS](https://www.gatsbyjs.com/), initialized with [Gatsby's Hello World Starter](https://github.com/gatsbyjs/gatsby-starter-hello-world), and customized with:

1. SEO component for static pages, and dynamically generated content per post, including Facebook Open Graph and Twitter meta tags.
2. Pagination.
3. Optimized images and per post featured image.
4. Navigation for desktop and mobile responsive menu collapse/expand.
5. SVG icons from [react-icons](https://github.com/react-icons/react-icons).
6. Custom 404 page.
7. Syntax highlighting with [gatsby-remark-vscode](https://www.gatsbyjs.com/plugins/gatsby-remark-vscode/).
8. RSS with [gatsby-plugin-feed](https://www.gatsbyjs.com/docs/how-to/adding-common-features/adding-an-rss-feed/), [validate](https://validator.w3.org/feed/#validate_by_input)

## Setup

In terminal at root of project, run:

```bash
touch .env.development
echo "HELLO_URL=http://localhost:3000/visits" >> .env.development
touch .env.production
echo "HELLO_URL=https://replace.with.hello.host/visits" >> .env.production
npm install
```

## Development

Generate a new post:

```bash
./scripts/generate-post.sh my-article-title my-category
# generates markdown file at: src/markdown/my-article-title.md
```

In a terminal at root of project, run:

```bash
make dev
```

If some pages don't refresh as expected, try this task which will first wipe out the cache:

```bash
make devclean
```

GraphQL queries to get distinct categories:

```graphql
{
  posts: allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    sort: {frontmatter: {category: ASC}}
  ) {
    distinct(field: { frontmatter: { category: SELECT} })
  }
  courses: allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/learning/" } }
    sort: {frontmatter: {category: ASC}}
  ) {
    distinct(field: { frontmatter: { category: SELECT} })
  }
}
```

To test the production build locally:

```bash
make serve
```

To deploy to Github Pages:

```bash
make deploy
```

## Format Code

```bash
npm run format
```

## Testing

Run all tests and exit:

```bash
make test
```

Run tests in watch mode:

```bash
make testw
```

Run just one test by `describe` and it `strings`:

For example, given a test like:

```javascript
describe("Course", () => {
  it("renders correctly", () => {
    // test body...
  })
  it("other test", () => {
    // some other stuff...
  })
})
```

To run just the `renders correctly` test:

```bash
node_modules/.bin/jest -t "Course renders correctly"
```

## Markdown Links

To another post:

```markdown
[Part 1: Search Introduction](../roll-your-own-search-service-for-gatsby-part1)
```

To a specific section (within same or other post):

```markdown
[post template](../gatsby-related-posts#post-template)
```

Image in src/images:

```markdown
![image alt text](../images/image-file-name.png "image description")
```

## Markdown Styling

* Add entry mapping markdown element to a css class in in `gatsby-config.js` under the `plugins` -> `gatsby-transformer-remark` section.
* Add css styles for the class in `src/styles/markdown.css`.

## Fonts

This project uses [Fontsource](https://www.gatsbyjs.com/docs/how-to/styling/using-web-fonts/#self-host-google-fonts-with-fontsource) to self-host Google fonts. The site loads four families, each scoped to where it's used:

| Font | Used for | Imported in | Weights loaded |
|---|---|---|---|
| [Bai Jamjuree](https://www.npmjs.com/package/@fontsource/bai-jamjuree) | Site-wide body and heading default. The `--base-font-family` CSS variable in `src/styles/global.css`. | `gatsby-browser.js` (loads on every page) | 300, 400, 400-italic, 500, 600, 700 |
| [DM Sans](https://www.npmjs.com/package/@fontsource/dm-sans) | Homepage `/` only. The `--font-family-2026` variable consumed by `pages/index.module.css`, `components/shared/header.module.css`, `components/shared/footer.module.css`. | `src/pages/index.js` | 400, 500, 600, 700 |
| [Figtree](https://www.npmjs.com/package/@fontsource/figtree) | Course card bodies inside `/learning`. Applied via `src/components/learning/course.module.css`. | `src/pages/learning.js` | 400, 600 |
| [Fira Code](https://www.npmjs.com/package/@fontsource/fira-code) | Inline code and syntax-highlighted code blocks on individual blog posts. Applied via `.content code` in `src/templates/post.module.css`. | `src/templates/post.js` | default (400) |

### Where to add a new font

- **Site-wide font (used on most/every page):** import in `gatsby-browser.js` alongside the existing CSS imports. This is where Bai Jamjuree lives because it's the default body font and would otherwise need to be re-imported in every page file. (Historical note: prior to a 2026-04 cleanup, Bai Jamjuree was imported only in `src/pages/index.js` and silently leaked to other pages via Gatsby's CSS chunking. When the V1 homepage redesign replaced that import with DM Sans, Bai Jamjuree stopped loading entirely on non-Apple devices — Apple devices ship Bai Jamjuree as a system font and masked the bug locally. Don't repeat that pattern.)
- **Page-specific font (used on one page only):** import at the top of the page file in `src/pages/<page>.js`. Examples: DM Sans on `index.js`.
- **Template-specific font (used on programmatically generated pages):** import at the top of the template file in `src/templates/<template>.js`. Example: Fira Code on `post.js` for code-block rendering.

### Verifying a font actually loads

After adding or changing a font import, verify in DevTools on a non-Apple device (or with the system font equivalent disabled in macOS Font Book — many Google Fonts are now built into macOS/iOS and will render even when the webfont isn't loading):

1. Network tab → filter for the font name → confirm 200 responses on the woff2 files.
2. Computed style on a body paragraph → "Rendered Fonts" panel → confirm the source is the loaded webfont, not "Local font."

## Gatsby Upgrade Checklist

[4 - 5](https://v5.gatsbyjs.com/docs/reference/release-notes/migrating-from-v4-to-v5/)

The following all needs to work:

- [x] `rm package-lock.json && rm -rf node_modules && make install`
- [x] `make devclean`
- [x] `make dev`
  - [x] verify `search.sql` is generated in project root
  - [x] `/visits` (while running local [hello-visitor](https://github.com/danielabar/hello-visitor))
  - [x] `/search` (while running local [hello-visitor](https://github.com/danielabar/hello-visitor))
  - [x] syntax highlighting (eg: fix `graphql`)
- [x] `make test`
- [x] `make serve` (serve prod build)
  - [x] Sitemap should be generated (wherever it is, update Google Search Console -> Sitemaps, after deploy, eg: `/sitemap-0.xml`)
- [x] CI workflow passing on Github

### References

- [Gatsby Unit Testing](https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/)
- [Jest](https://jestjs.io/docs/getting-started)
- [Jest Expect](https://jestjs.io/docs/expect)
- [react testing library and Gatsby](https://www.emgoto.com/gatsby-unit-testing/)
- [example react testing library mock server](https://testing-library.com/docs/react-testing-library/example-intro#full-example)
- [jest and dotenv](https://tekloon.dev/using-dotenv-with-jest)
- [jest dom matchers](https://github.com/testing-library/jest-dom#custom-matchers)
- [more realistic user event simulation than fireEvent](https://testing-library.com/docs/ecosystem-user-event/)
- [various useful testing including mock helmet for seo](https://www.emgoto.com/gatsby-unit-testing/)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [mock components with jest](https://thoughtbot.com/blog/mocking-react-components-with-jest)
- [run just one test](https://stackoverflow.com/questions/28725955/how-do-i-test-a-single-file-using-jest)
- [Gatsby and Cypress](https://www.gatsbyjs.com/docs/how-to/testing/end-to-end-testing/)
- [Gatsby Remark Images](https://www.gatsbyjs.com/plugins/gatsby-remark-images/)

## Original Docs from Starter

<!-- AUTO-GENERATED-CONTENT:START (STARTER) -->
<p align="center">
  <a href="https://www.gatsbyjs.org">
    <img alt="Gatsby" src="https://www.gatsbyjs.org/monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  Gatsby's hello-world starter
</h1>

Kick off your project with this hello-world boilerplate. This starter ships with the main Gatsby configuration files you might need to get up and running blazing fast with the blazing fast app generator for React.

_Have another more specific idea? You may want to check out our vibrant collection of [official and community-created starters](https://www.gatsbyjs.org/docs/gatsby-starters/)._

## 🚀 Quick start

1.  **Create a Gatsby site.**

    Use the Gatsby CLI to create a new site, specifying the hello-world starter.

    ```bash
    # create a new Gatsby site using the hello-world starter
    gatsby new my-hello-world-starter https://github.com/gatsbyjs/gatsby-starter-hello-world
    ```

1.  **Start developing.**

    Navigate into your new site’s directory and start it up.

    ```bash
    cd my-hello-world-starter/
    gatsby develop -H 0.0.0.0
    ```

1.  **Open the source code and start editing!**

    Your site is now running at `http://localhost:8000`!

    _Note: You'll also see a second link: _`http://localhost:8000/___graphql`_. This is a tool you can use to experiment with querying your data. Learn more about using this tool in the [Gatsby tutorial](https://www.gatsbyjs.org/tutorial/part-five/#introducing-graphiql)._

    Open the `my-hello-world-starter` directory in your code editor of choice and edit `src/pages/index.js`. Save your changes and the browser will update in real time!

## 🧐 What's inside?

A quick look at the top-level files and directories you'll see in a Gatsby project.

    .
    ├── node_modules
    ├── src
    ├── .gitignore
    ├── .prettierrc
    ├── gatsby-browser.js
    ├── gatsby-config.js
    ├── gatsby-node.js
    ├── gatsby-ssr.js
    ├── LICENSE
    ├── package-lock.json
    ├── package.json
    └── README.md

1.  **`/node_modules`**: This directory contains all of the modules of code that your project depends on (npm packages) are automatically installed.

2.  **`/src`**: This directory will contain all of the code related to what you will see on the front-end of your site (what you see in the browser) such as your site header or a page template. `src` is a convention for “source code”.

3.  **`.gitignore`**: This file tells git which files it should not track / not maintain a version history for.

4.  **`.prettierrc`**: This is a configuration file for [Prettier](https://prettier.io/). Prettier is a tool to help keep the formatting of your code consistent.

5.  **`gatsby-browser.js`**: This file is where Gatsby expects to find any usage of the [Gatsby browser APIs](https://www.gatsbyjs.org/docs/browser-apis/) (if any). These allow customization/extension of default Gatsby settings affecting the browser.

6.  **`gatsby-config.js`**: This is the main configuration file for a Gatsby site. This is where you can specify information about your site (metadata) like the site title and description, which Gatsby plugins you’d like to include, etc. (Check out the [config docs](https://www.gatsbyjs.org/docs/gatsby-config/) for more detail).

7.  **`gatsby-node.js`**: This file is where Gatsby expects to find any usage of the [Gatsby Node APIs](https://www.gatsbyjs.org/docs/node-apis/) (if any). These allow customization/extension of default Gatsby settings affecting pieces of the site build process.

8.  **`gatsby-ssr.js`**: This file is where Gatsby expects to find any usage of the [Gatsby server-side rendering APIs](https://www.gatsbyjs.org/docs/ssr-apis/) (if any). These allow customization of default Gatsby settings affecting server-side rendering.

9.  **`LICENSE`**: Gatsby is licensed under the MIT license.

10. **`package-lock.json`** (See `package.json` below, first). This is an automatically generated file based on the exact versions of your npm dependencies that were installed for your project. **(You won’t change this file directly).**

11. **`package.json`**: A manifest file for Node.js projects, which includes things like metadata (the project’s name, author, etc). This manifest is how npm knows which packages to install for your project.

12. **`README.md`**: A text file containing useful reference information about your project.

## 🎓 Learning Gatsby

Looking for more guidance? Full documentation for Gatsby lives [on the website](https://www.gatsbyjs.org/). Here are some places to start:

- **For most developers, we recommend starting with our [in-depth tutorial for creating a site with Gatsby](https://www.gatsbyjs.org/tutorial/).** It starts with zero assumptions about your level of ability and walks through every step of the process.

- **To dive straight into code samples, head [to our documentation](https://www.gatsbyjs.org/docs/).** In particular, check out the _Guides_, _API Reference_, and _Advanced Tutorials_ sections in the sidebar.

## 💫 Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/gatsbyjs/gatsby-starter-hello-world)

<!-- AUTO-GENERATED-CONTENT:END -->
