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
