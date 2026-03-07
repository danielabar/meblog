/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import * as styles from "./interviewing.module.css"

const Interviewing = ({ data }) => {
  const markdown = data.markdownRemark
  const toc = markdown.tableOfContents

  return (
    <Layout>
      <SEO
        title="On Technical Assessments"
        description="A letter to recruiters and hiring managers about live coding and technical assessments."
        pathname="/interviewing"
        noindex={true}
      />
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLabel}>On this page</div>
          <div
            className={styles.tocList}
            dangerouslySetInnerHTML={{ __html: toc }}
          />
        </aside>
        <div className={styles.mainColumn}>
          <header className={styles.pageHeader}>
            <span className={styles.pageLabel}>
              A letter to recruiters &amp; hiring managers
            </span>
            <h1 className={styles.pageTitle}>On Technical Assessments</h1>
          </header>
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: markdown.html }}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Interviewing

export const query = graphql`
  query {
    markdownRemark(fileAbsolutePath: { regex: "/src/content/interviewing/" }) {
      html
      tableOfContents
    }
  }
`
