import React from "react"
import { Link } from "gatsby"
import * as styles from "./article-list-mini.module.css"

const ArticleList = props => (
  <section className={styles.container} data-testid="article-list-mini">
    <h2 className={styles.header}>{props.title}</h2>
    {props.articles.map(({ node }) => (
      <Link to={node.fields.slug} key={node.id}>
        <div className={styles.article}>
          <span className={styles.articleTitle}>{node.frontmatter.title}</span>
          <div className={styles.articleDate}>{node.frontmatter.date}</div>
        </div>
      </Link>
    ))}
  </section>
)

export default ArticleList
