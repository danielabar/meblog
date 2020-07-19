import React from "react"
import { Link } from "gatsby"
import styles from "./pagination.module.css"

export default props => (
  <div className={styles.container}>
    {!props.isFirst && (
      <div className={`${styles.prev} ${styles.pagination}`}>
        <Link to={props.prevPage} rel="prev">
          ← prev
        </Link>
      </div>
    )}
    {props.isFirst && (
      <div className={`${styles.prev} ${styles.pagination} ${styles.inactive}`}>
        ← prev
      </div>
    )}
    {!props.isLast && (
      <div className={`${styles.next} ${styles.pagination}`}>
        <Link to={props.nextPage} rel="next">
          next →
        </Link>
      </div>
    )}
    {props.isLast && (
      <div className={`${styles.next} ${styles.pagination} ${styles.inactive}`}>
        next →
      </div>
    )}
  </div>
)
