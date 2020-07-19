import React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"

export default () => (
  <header className={styles.container}>
    <Link to="/">
      <div className={styles.logo}>
        <div className={styles.profileWrapper}>
          <img
            className={styles.profileImg}
            src={"/images/profile.png"}
            alt="Profile"
          />
        </div>
        <div className={styles.title}>Daniela Baron</div>
      </div>
    </Link>

    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <Link to="/blog">
          <li>Blog</li>
        </Link>
        <li>About</li>
      </ul>
    </nav>
  </header>
)
