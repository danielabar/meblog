import React from "react"
import * as styles from "./article-list-mini.module.css"

const ArticleList = props => (
  <section className={styles.container} data-testid="article-list-mini">
    <h2 className={styles.header}>{props.title}</h2>
    {props.articles.map(({ node }) => (
      <div className={styles.article}>
        <h3 className={styles.articleTitle}>{node.frontmatter.title}</h3>
        <div className={styles.articleDate}>{node.frontmatter.date}</div>
      </div>
    ))}
  </section>
)

export default ArticleList
