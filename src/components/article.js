import React from "react"
import { Link } from "gatsby"
import styles from "./article.module.css"

export default props => (
  <article className={styles.container}>
    <div className={styles.subheader}>
      <div className={styles.date}>{props.date}</div>
      <div className={styles.category}>{props.category}</div>
    </div>
    <Link to={props.to} className={styles.title}>
      {props.title}
    </Link>
    <div className={styles.excerpt}>{props.excerpt}</div>
    <Link to={props.to} className={styles.read}>
      Read
    </Link>
  </article>
)
