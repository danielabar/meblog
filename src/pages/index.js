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
import ArticleListMini from "../components/article-list-mini"
import * as styles from "./index.module.css"

const Index = ({ data }) => (
  <Layout>
    <div className={styles.container}>
      <SEO title="Home" pathname="/" />
      <Intro />
      <div className={styles.articles}>
        <ArticleListMini articles={data.allMarkdownRemark.edges} title="Recent Posts"/>
        <ArticleListMini articles={data.allMarkdownRemark.edges} title="Popular Posts"/>
      </div>
    </div>
  </Layout>
)

export default Index

// TODO: Integrate csv data source for popular posts
// then make this have two data sections like `src/templates/post.js`
export const query = graphql`{
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
}`
