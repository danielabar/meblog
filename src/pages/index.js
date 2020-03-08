import React from "react"
import { graphql } from "gatsby"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import Intro from "../components/intro"
import ArticleList from "../components/article-list"
import AllLink from "../components/all-link"

export default ({ data }) => (
  <Layout>
    <SEO title="Home" pathname="/" />
    <Intro />
    <ArticleList articles={data.allMarkdownRemark.edges} />
    <AllLink marginTop="30px" />
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
            date(formatString: "MMMM YYYY")
            category
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
