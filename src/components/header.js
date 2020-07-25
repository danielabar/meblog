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
        <div className={`${styles.headerItem} ${styles.title}`}>
          Daniela Baron
        </div>
      </div>
    </Link>

    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/blog">Blog</Link>
        </li>
        <li className={`${styles.headerItem} ${styles.navItem}`}>About</li>
      </ul>
    </nav>
  </header>
)
