import React from "react"
import { Link } from "gatsby"
import styles from "./article.module.css"

export default props => (
  <article className={styles.container}>
    <div className={styles.date}>{props.date}</div>
    <Link to={props.to} className={styles.title}>
      {props.title}
    </Link>
    <div className={styles.excerot}>{props.excerpt}</div>
    <Link to={props.to} className={styles.read}>
      Read
    </Link>
  </article>
)
