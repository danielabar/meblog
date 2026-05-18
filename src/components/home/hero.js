import React from "react"
import * as styles from "./hero.module.css"

const Hero = () => (
  <section className={styles.hero} data-testid="hero">
    <h1 className={styles.headline}>
      Software that works, and writing about how it got that way.
    </h1>
    <p className={styles.sub}>
      Senior engineer with 15+ years of shipping. I write about the craft,
      the trade-offs, and the parts of the job that don't fit on a résumé.
      New posts monthly; opinions formed slowly and held loosely.
    </p>
  </section>
)

export default Hero
