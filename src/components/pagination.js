import React from "react"
import { Link } from "gatsby"
import * as styles from "./pagination.module.css"

const Pagination = (props) => (
  <div className={styles.container}>
    {!props.isFirst && (
      <div
        className={`${styles.prev} ${styles.pagination}`}
        data-testid="previous-enabled"
      >
        <Link to={props.prevPage} rel="prev">
          ← prev
        </Link>
      </div>
    )}
    {props.isFirst && (
      <div
        className={`${styles.prev} ${styles.pagination} ${styles.inactive}`}
        data-testid="previous-disabled"
      >
        ← prev
      </div>
    )}
    {!props.isLast && (
      <div
        className={`${styles.next} ${styles.pagination}`}
        data-testid="next-enabled"
      >
        <Link to={props.nextPage} rel="next">
          next →
        </Link>
      </div>
    )}
    {props.isLast && (
      <div
        className={`${styles.next} ${styles.pagination} ${styles.inactive}`}
        data-testid="next-disabled"
      >
        next →
      </div>
    )}
  </div>
)

export default Pagination