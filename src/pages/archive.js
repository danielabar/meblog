import React from "react"
import { graphql } from "gatsby"

import SEO from "../components/SEO"
import Layout from "../components/shared/layout"
import YearRail from "../components/archive/year-rail"
import * as styles from "./archive.module.css"

const groupByYear = posts => {
  const groups = new Map()
  for (const p of posts) {
    const year = p.frontmatter.date.slice(0, 4)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(p)
  }
  return Array.from(groups.entries()).map(([year, items]) => ({ year, items }))
}

const Archive = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const groups = groupByYear(posts)
  const newestYear = groups[0]?.year
  const oldestYear = groups[groups.length - 1]?.year
  const years = groups.map(g => ({ year: g.year, count: g.items.length }))

  return (
    <Layout>
      <SEO title="Archive" pathname="/archive" />
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Archive</h1>
          <p className={styles.meta}>
            {posts.length} posts · {oldestYear} → {newestYear}
          </p>
        </header>
        <div className={styles.layout}>
          <div className={styles.content}>
            {groups.map(({ year, items }) => (
              <section
                key={year}
                id={`y${year}`}
                className={styles.yearGroup}
                data-testid="year-group"
              >
                <h2 className={styles.yearH}>{year}</h2>
                <div className={styles.yearRows}>
                  {items.map(p => (
                    <a
                      key={p.fields.slug}
                      href={p.fields.slug}
                      className={styles.row}
                      data-testid="archive-row"
                    >
                      <span className={styles.date}>{p.frontmatter.date}</span>
                      <span className={styles.rowTitle}>{p.frontmatter.title}</span>
                      <span className={styles.cat}>{p.frontmatter.category}</span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <YearRail years={years} />
        </div>
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
