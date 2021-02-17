import React from "react"
import { Link } from "gatsby"
import styles from "./nav-menu.module.css"

const NavMenu = () => {
  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/blog" activeClassName={styles.active}>
            Blog
          </Link>
        </li>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/about" activeClassName={styles.active}>
            About
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default NavMenu
