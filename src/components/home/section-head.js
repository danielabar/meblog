import React from "react"
import { Link } from "gatsby"
import * as styles from "./section-head.module.css"

const SectionHead = ({ title, linkText, linkTo, external = false }) => (
  <div className={styles.head} data-testid="section-head">
    <h2 className={styles.title}>{title}</h2>
    {external ? (
      <a
        href={linkTo}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkText}
      </a>
    ) : (
      <Link to={linkTo} className={styles.link}>
        {linkText}
      </Link>
    )}
  </div>
)

export default SectionHead
