import React from "react"
import * as styles from "./article-list-mini.module.css"

const ArticleList = props => (
  <section className={styles.container} data-testid="article-list-mini">
    <h2 className={styles.header}>{props.title}</h2>
    {props.articles.map(({ node }) => (
      <div className="article-mini">
        <h3>{node.frontmatter.title}</h3>
      </div>
    ))}
  </section>
)

export default ArticleList
