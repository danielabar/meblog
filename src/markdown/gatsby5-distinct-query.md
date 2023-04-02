---
title: "Distinct GraphQL Query with Gatsby 5"
featuredImage: "../images/gatsby5-distinct-greyson-joralemon-9IBqihqhuHc-unsplash.jpg"
description: "Learn the syntax for writing a distinct query in GraphQL when using Gatsby 5."
date: "2023-05-01"
category: "gatsby"
related:
  - "Get started with Gatsby and Unit Testing"
  - "Add Related Posts Feature to a Gatsby Blog"
  - "Add a Language to gatsby-remark-vscode"
---

If you're building a website or web application with Gatsby, you might come across a situation where you need to perform a distinct query. This is a query that only returns unique results, eliminating any duplicates. This post will show how to do a distinct query in Gatsby 5 (which is the latest version at the time of this writing) using GraphQL.

<aside class="markdown-aside">
This post assumes that the reader has some basic knowledge of building websites with Gatsby, including familiarity with GraphQL queries. If you're new to Gatsby, or need a refresher on GraphQL, there are plenty of resources available to help you get up to speed. The official <a class="markdown-link" href="https://www.gatsbyjs.com/docs/">documentation</a> is a great place to start. Pluralsight also has some <a class="markdown-link" href="https://www.pluralsight.com/paths/building-static-sites-with-gatsbyjs">courses</a>, although at the time of this writing, they're mostly for an older version.
</aside>

## Example

A common use case for Gatsby is to generate a static site where the content for the pages comes from markdown files. The [gatsby-transformer-remark](https://www.npmjs.com/package/gatsby-transformer-remark) plugin transforms markdown files into HTML and creates nodes for them in Gatsby's GraphQL data layer. For example, given a `src` directory in a Gatsby project that looks like this (suppose this is for a fitness site):

```
src
├── components
│   ├── footer.js
│   ├── header.js
│   ├── layout.js
├── markdown
│   ├── advanced-lifting-techniques.md
│   ├── cardio-basics.md
│   ├── strength-training-tips-for-beginners.md
│   ├── yoga-for-flexibility.md
│   ├── ...
├── pages
│   ├── about.js
│   ├── index.js
└── templates
    ├── post.js
```

Here are some example markdown files with title, description, publish date, and category in the frontmatter, and a sample body content:

```markdown
---
title: "Advanced Lifting Techniques"
description: "Learn some advanced techniques to take your lifting to the next level."
date: "2023-01-15"
category: "strength"
---
If you've been lifting weights for a while and want to take your workout to the next level,
you'll need to start incorporating some advanced techniques...
```

```markdown
---
title: "Cardio Basics"
description: "Get back to the basics with a beginner's guide to cardio workouts."
date: "2023-03-22"
category: "cardio"
---
If you're new to working out or just looking to get back into shape,
cardio is a great place to start...
```

```markdown
---
title: "Strength Training Tips for Beginners"
description: "Get started with strength training and build a foundation for a healthier life."
date: "2023-07-16"
category: "strength"
---
Strength training is an effective way to build muscle,
increase bone density, and improve overall health...
```

```markdown
---
title: "Yoga for Flexibility"
description: "Improve your flexibility and reduce stress with this beginner's guide to yoga."
date: "2023-09-02"
category: "yoga"
---
Yoga is a good way to improve flexibility, reduce stress,
and promote overall wellness...
```

Now you'd like to get a list of all the categories, perhaps to generate a list of category tags that readers could click on to view articles for that category.

## Solution

Here is the GraphQL query to get a list of distinct categories. The key here is to use the `distinct` *aggregation resolver*, and within that, specify the field to extract unique values for. The nesting of `category` within `frontmatter` matches how the nodes are structured when using the [gatsby-transformer-remark](https://www.npmjs.com/package/gatsby-transformer-remark) plugin. The `SELECT` after specifying the `category` field seems a little odd, more on this later:

```graphql
{
  allMarkdownRemark {
    distinct(field: { frontmatter: { category: SELECT} })
  }
}
```

<aside class="markdown-aside">
An aggregation resolver is a type of resolver function that aggregates data from multiple sources into a single field on a GraphQL node. In addition to the distinct aggregation, Gatsby also supports group, min, max, and sum. I couldn't find documentation about these built-in resolvers but here's a <a class="markdown-link" href="https://github.com/gatsbyjs/gatsby/pull/30789">PR</a> where some of them got introduced. It's also possible to create your own <a class="markdown-link" href="https://www.gatsbyjs.com/docs/reference/graphql-data-layer/schema-customization/#createresolvers-api">custom resolvers</a>.
</aside>

Using the `distinct` resolver will produce output like this:

```json
{
  "data": {
    "allMarkdownRemark": {
      "distinct": [
        "strength",
        "cardio",
        "yoga"
      ]
    }
  },
  "extensions": {}
}
```

To have the categories sorted alphabetically in ascending order, pass in the `sort` option to the query field `allMarkdownRemark`. Use `DESC` instead of `ASC` for reverse alphabetic order:

```graphql
{
  allMarkdownRemark(
    sort: {frontmatter: {category: ASC}}
  ) {
    distinct(field: { frontmatter: { category: SELECT} })
  }
}
```

If the markdown files are located in different directories such as `/src/markdown/fitness` and `/src/markdown/health` and you only want the distinct categories for the `fitness` articles, pass the `filter` option to the query field. Within that, specify the field that should be filtered on, in this case, `fileAbsolutePath`. Then use the `regex` filter operator to limit the results to only markdown files that are located in a certain directory:

```graphql
{
  allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/markdown/fitness/" } }
    sort: {frontmatter: {category: ASC}}
  ) {
    distinct(field: { frontmatter: { category: SELECT} })
  }
}
```

For more filter options and how they can be combined, see the [Gatsby GraphQL](https://www.gatsbyjs.com/docs/graphql-reference/#filter) docs.

## TODO
* Improve structure of example para
* Explain technique to find it as it wasn't in official docs https://www.gatsbyjs.com/docs/graphql-reference/ (had to search source, tests, git commit, github issue)
* Conclusion para
