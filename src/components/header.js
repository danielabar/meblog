import React from "react"
import styles from "./header.module.css"

export default () => (
  <header className={styles.container}>
    <div className={styles.logo}>
      <div className={styles.profile}>Img TBD</div>
      <div className={styles.title}>Daniela Baron</div>
    </div>
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li>Blog</li>
        <li>Projects</li>
        <li>Courses</li>
        <li>About</li>
      </ul>
    </nav>
  </header>
)
