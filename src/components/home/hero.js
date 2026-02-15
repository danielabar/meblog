import React from "react"
import * as styles from "./hero.module.css"

const Hero = () => {
  return (
    <div className={styles.hero}>
      <div className={styles.metricDisplay}>
        <div className={styles.metricVisual}>
          <div className={styles.metricBars}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        </div>
        <div>
          <div className={styles.metricNumber}>15+</div>
          <div className={styles.metricLabel}>Years Building Software</div>
        </div>
      </div>

      <div className={styles.heroText}>
        I'm a senior software engineer with extensive experience delivering
        solutions that scale. I specialize in{" "}
        <strong>Rails, PostgreSQL, and full-stack development</strong> —
        turning complex technical challenges into working software that real
        people use.
      </div>
    </div>
  )
}

export default Hero
