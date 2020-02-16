import React from "react"
import styles from "./article.module.css"

export default props => (
  <article className={styles.container}>
    {console.log(props)}
    <h1>{props.title}</h1>
    <div className={styles.articleDate}>{props.date}</div>
    <div className={styles.excerot}>{props.excerpt}</div>
  </article>
)
