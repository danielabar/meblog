/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import "@fontsource/dm-sans/400.css"
import "@fontsource/dm-sans/500.css"
import "@fontsource/dm-sans/600.css"
import "@fontsource/dm-sans/700.css"
import SEO from "../components/SEO"
import Layout from "../components/shared/layout"
import Hero from "../components/home/hero"
import FocusAreas from "../components/home/focus-areas"
import ArticleListMini from "../components/article-list-mini"
import simplifyMarkdownEdges from "../../lib/node-edges-helper"
import * as styles from "./index.module.css"

const Index = props => {
  const flattenedMarkdownEdges = simplifyMarkdownEdges(
    props.data.allMarkdownRemark.edges
  )

  return (
    <Layout>
      <SEO title="Home" pathname="/" />
      <div className={styles.container}>
        <Hero />
        <FocusAreas />

        <div className={styles.section}>
          <div className={styles.label}>Approach</div>
          <div className={styles.text}>
            I make teams more effective. Whether it's implementing full-text
            search architecture, upgrading legacy systems, or transforming
            developer experience through better documentation and CI/CD — I
            focus on work that compounds in value over time.
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Recent Writing</div>
          <ArticleListMini articles={flattenedMarkdownEdges} />
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Popular Archives</div>
          <ArticleListMini articles={props.data.popular.edges} />
        </div>
      </div>
    </Layout>
  )
}

export default Index

export const query = graphql`
  {
    allMarkdownRemark(
      limit: 3
      filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
      sort: { frontmatter: { date: DESC } }
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
    popular: allPopularCsv(limit: 2) {
      edges {
        node {
          id
          title
          published_at
          slug
        }
      }
    }
  }
`
