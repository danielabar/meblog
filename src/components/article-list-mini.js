import React from "react"
import { Link } from "gatsby"
import * as styles from "./article-list-mini.module.css"

const ArticleListMini = props => (
  <section className={styles.container} data-testid="article-list-mini">
    {props.articles.map(({ node }) => (
      <Link to={node.slug} key={node.id} className={styles.card}>
        <div className={styles.meta}>{node.published_at}</div>
        <div className={styles.title}>{node.title}</div>
      </Link>
    ))}
  </section>
)

export default ArticleListMini
