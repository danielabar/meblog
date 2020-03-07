import React from "react"
import { Link } from "gatsby"
import { graphql } from "gatsby"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import Intro from "../components/intro"
import ArticleList from "../components/article-list"
import styles from "./index.module.css"

export default ({ data }) => (
  <Layout>
    <SEO title="Home" pathname="/" />
    <Intro />
    <ArticleList articles={data.allMarkdownRemark.edges} />
    <div className={styles.all}>
      <Link to="/blog">See all posts</Link>
    </div>
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
