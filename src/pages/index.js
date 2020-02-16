import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Intro from "../components/intro"
import ArticleList from "../components/article-list"

export default ({ data }) => (
  <Layout>
    <Intro />
    <ArticleList articles={data.allMarkdownRemark.edges} />
  </Layout>
)

export const query = graphql`
  {
    allMarkdownRemark(
      limit: 5
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "YYYY MMMM DD")
          }
          excerpt
          html
          fields {
            slug
          }
        }
      }
    }
  }
`
