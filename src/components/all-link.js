import React from "react"
import { Link } from "gatsby"
import * as styles from "./all-link.module.css"

const AllLink = ({ marginTop }) => (
  <div data-testid="all-wrapper" style={{ marginTop: marginTop }}>
    <Link to="/blog" className={styles.allLink}>
      All Articles
    </Link>
  </div>
)

export default AllLink
