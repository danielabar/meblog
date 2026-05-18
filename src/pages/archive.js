import React from "react"
import { graphql } from "gatsby"

import SEO from "../components/SEO"
import Layout from "../components/shared/layout"
import * as styles from "./archive.module.css"

const Archive = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout>
      <SEO title="Archive" pathname="/archive" />
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Archive</h1>
          <p className={styles.meta}>{posts.length} posts · 2019 → 2026</p>
        </header>
        <ul className={styles.flatList}>
          {posts.map(p => (
            <li key={p.fields.slug}>
              <a href={p.fields.slug}>
                <span>{p.frontmatter.date}</span>{" "}
                <span>{p.frontmatter.title}</span>{" "}
                <span>{p.frontmatter.category}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}

export default Archive

export const archiveQuery = graphql`
  {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "YYYY-MM-DD")
          category
        }
      }
    }
  }
`
