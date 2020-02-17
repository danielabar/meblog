import React from "react"
import { Link } from "gatsby"
import styles from "./pagination.module.css"

export default props => (
  <div className={styles.container}>
    {!props.isFirst && (
      <div className={styles.prev}>
        <Link to={props.prevPage} rel="prev">
          ← Previous Page
        </Link>
      </div>
    )}
    {!props.isLast && (
      <div className={styles.next}>
        <Link to={props.nextPage} rel="next">
          Next Page →
        </Link>
      </div>
    )}
  </div>
)
