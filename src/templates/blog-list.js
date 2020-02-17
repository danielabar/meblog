import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ArticleList from "../components/article-list"

// TODO: Prev/Next links
export default class BlogList extends React.Component {
  render() {
    return (
      <Layout>
        <ArticleList
          articles={this.props.data.allMarkdownRemark.edges}
        ></ArticleList>
      </Layout>
    )
  }
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
`
