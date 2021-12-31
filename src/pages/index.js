/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import "@fontsource/bai-jamjuree/200.css"
import "@fontsource/bai-jamjuree/300.css"
import "@fontsource/bai-jamjuree/400.css"
import "@fontsource/bai-jamjuree/400-italic.css"
import "@fontsource/bai-jamjuree/500.css"
import "@fontsource/bai-jamjuree/600.css"
import "@fontsource/bai-jamjuree/700.css"
// TODO: Also need italic font for quote sections in posts
import SEO from "../components/SEO"
import Layout from "../components/layout"
import Intro from "../components/intro"
import ArticleList from "../components/article-list"
import AllLink from "../components/all-link"
import * as styles from "./index.module.css"

const Index = ({ data }) => (
  <Layout>
    <div className={styles.container}>
      <SEO title="Home" pathname="/" />
      <Intro />
      <ArticleList articles={data.allMarkdownRemark.edges} />
      <AllLink marginTop="30px" />
    </div>
  </Layout>
)

export default Index

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
