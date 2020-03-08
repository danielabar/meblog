import React from "react"
import { Link } from "gatsby"
import styles from "./all-link.module.css"

export default ({ marginTop }) => (
  <div style={{ marginTop: marginTop }}>
    <Link to="/blog" className={styles.allLink}>
      All Articles
    </Link>
  </div>
)
