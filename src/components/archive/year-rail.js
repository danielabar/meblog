import React from "react"
import * as styles from "./year-rail.module.css"

const YearRail = ({ years }) => (
  <aside
    className={styles.rail}
    aria-label="Jump to year"
    data-testid="year-rail"
  >
    <div className={styles.label}>jump to</div>
    {years.map(({ year, count }) => (
      <a key={year} href={`#y${year}`} className={styles.link}>
        <span>{year}</span>
        <span className={styles.count}>{count}</span>
      </a>
    ))}
  </aside>
)

export default YearRail
