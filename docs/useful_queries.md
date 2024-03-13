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
