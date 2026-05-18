# Useful Queries

## Filter Posts by Category

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
      frontmatter: { category: { eq: "rails" } }
    }
    sort: {frontmatter: {date: DESC}}
  ) {
    totalCount
    edges {
      node {
        id
        frontmatter {
          title
          date(formatString: "MMMM YYYY")
          category
        }
      }
    }
  }
}
```

## Distinct Categories

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
    }
  ) {
    distinct(field: { frontmatter: { category: SELECT } })
  }
}
```

## Table of Contents

```graphql
{
  allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/src/markdown/reimagining-technical-interviews/" } }) {
    edges {
      node {
        frontmatter {
          title
        }
        tableOfContents
      }
    }
  }
}
```

## Popular Posts

Given that csv transformer has been installed and configured.

```graphql
{
  allPopularCsv {
    edges {
      node {
        title
        published_at
        slug
      }
    }
  }
}
```

Example output:

```json
{
  "data": {
    "allPopularCsv": {
      "edges": [
        {
          "node": {
            "title": "Homebrew Postgresql Service not Starting Resolved",
            "published_at": "October 1, 2022",
            "slug": "/blog/homebrew-postgresql-service-not-starting-resolved/"
          }
        },
        {
          "node": {
            "title": "Nomad Tips and Tricks",
            "published_at": "January 2, 2022",
            "slug": "/blog/nomad-tips-and-tricks/"
          }
        },
        {
          "node": {
            "title": "Efficient Database Queries in Rails: A Practical Approach",
            "published_at": "March 1, 2024",
            "slug": "/blog/rails-query-perf/"
          }
        }
      ]
    }
  },
  "extensions": {}
}
```

## Combining CSV and Markdown Data

```graphql
{
  allMarkdownRemark(
    limit: 3,
    filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    sort: {frontmatter: {date: DESC}}
  ) {
    totalCount
    edges {
      node {
        id
        frontmatter {
          title
          date(formatString: "MMMM D, YYYY")
          category
        }
        fields {
          slug
        }
      }
    }
  }
  popular: allPopularCsv {
    edges {
      node {
        title
        published_at
        slug
      }
    }
  }
}
```

Example output:

```json
{
  "data": {
    "allMarkdownRemark": {
      "totalCount": 72,
      "edges": [
        {
          "node": {
            "id": "bab18397-b88e-522b-ad62-c1c44108eae5",
            "frontmatter": {
              "title": "Optimized Model Auditing with PaperTrail",
              "date": "April 1, 2024",
              "category": "rails"
            },
            "fields": {
              "slug": "/blog/model-audit-paper-trail/"
            }
          }
        },
        {
          "node": {
            "id": "93bf9500-74d7-5ba6-b811-7b13c0ebe80d",
            "frontmatter": {
              "title": "Efficient Database Queries in Rails: A Practical Approach",
              "date": "March 1, 2024",
              "category": "rails"
            },
            "fields": {
              "slug": "/blog/rails-query-perf/"
            }
          }
        },
        {
          "node": {
            "id": "b36f4a2d-fe79-5be5-98e2-32a1b30bddab",
            "frontmatter": {
              "title": "The Development Iceberg: Unseen Efforts That Extend Project Schedules",
              "date": "February 1, 2024",
              "category": "productivity"
            },
            "fields": {
              "slug": "/blog/development-iceberg/"
            }
          }
        }
      ]
    },
    "popular": {
      "edges": [
        {
          "node": {
            "title": "Homebrew Postgresql Service not Starting Resolved",
            "published_at": "October 1, 2022",
            "slug": "/blog/homebrew-postgresql-service-not-starting-resolved/"
          }
        },
        {
          "node": {
            "title": "Nomad Tips and Tricks",
            "published_at": "January 2, 2022",
            "slug": "/blog/nomad-tips-and-tricks/"
          }
        },
        {
          "node": {
            "title": "Efficient Database Queries in Rails: A Practical Approach",
            "published_at": "March 1, 2024",
            "slug": "/blog/rails-query-perf/"
          }
        }
      ]
    }
  },
  "extensions": {}
}
```

## Content for Sharing

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
    }
    sort: {frontmatter: {date: DESC}}
  ) {
    edges {
      node {
        frontmatter {
          title
          description
          category
          date(formatString: "YYYY-MM-DD")
        }
      }
    }
  }
}
```

## Popular Posts via @link Join (Homepage)

The homepage query for popular posts uses a schema customization in `gatsby-node.js` to add a `post` field directly on `PopularCsv` that resolves to the matching `MarkdownRemark` node. This avoids fetching both datasets separately and matching slugs in JavaScript.

**Setup in `gatsby-node.js`:**

```js
exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type PopularCsv implements Node {
      title: String!
      published_at: String
      slug: String!
      post: MarkdownRemark @link(by: "fields.slug", from: "slug")
    }
  `)
}
```

`@link(by: "fields.slug", from: "slug")` tells Gatsby: for each `PopularCsv` node, find the `MarkdownRemark` node whose `fields.slug` matches this row's `slug` column, and expose it as `post`.

**Query:**

The `post` field accepts the same subfields as any `MarkdownRemark` node, so you can share a fragment between recent and popular sections:

```graphql
{
  fragment PostCardFields on MarkdownRemark {
    fields { slug }
    excerpt(pruneLength: 160)
    frontmatter {
      title
      date(formatString: "YYYY-MM-DD")
      category
      featuredImage {
        childImageSharp {
          gatsbyImageData(width: 360, aspectRatio: 1.45, placeholder: BLURRED)
        }
      }
    }
  }

  recent: allMarkdownRemark(
    sort: { frontmatter: { date: DESC } }
    filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    limit: 3
  ) {
    nodes { ...PostCardFields }
  }

  popular: allPopularCsv(limit: 3) {
    nodes {
      slug
      post { ...PostCardFields }
    }
  }
}
```

If a slug in `popular.csv` has no matching post (e.g. a post was deleted), `post` comes back `null` and should be filtered out in the component.

The CSV order is preserved, so the analytics ranking is not disturbed by the join.

## Sort By Multiple Fields

Eg: Short posts, most recently published.

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
    }
    sort: [
      { timeToRead: ASC },
      { frontmatter: { date: DESC } }
    ]
  ) {
    edges {
      node {
        frontmatter {
          title
          category
          date(formatString: "YYYY-MM-DD")
        }
        timeToRead
      }
    }
  }
}
```

## Where Not In

For example, to exclude certain categories

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
      frontmatter: { category: { nin: ["personal finance", "podcasts"] } }
    }
    sort: [
      { timeToRead: ASC },
      { frontmatter: { date: DESC } }
    ]
  ) {
    edges {
      node {
        timeToRead
        frontmatter {
          title
          category
          date(formatString: "YYYY-MM-DD")
        }
        fields {
          slug
        }
      }
    }
  }
}
```

## Short Posts

For example, less than 5 minutes reading time

```graphql
{
  allMarkdownRemark(
    filter: {
      fileAbsolutePath: { regex: "/src/markdown/" }
      frontmatter: { category: { nin: ["personal finance", "podcasts", "just for fun"] } }
      timeToRead: { lte: 4 }
    }
    sort: [
      { timeToRead: ASC },
      { frontmatter: { date: DESC } }
    ]
  ) {
    totalCount
    edges {
      node {
        timeToRead
        frontmatter {
          title
          category
          date(formatString: "YYYY-MM-DD")
        }
        fields {
          slug
        }
      }
    }
  }
}
```
