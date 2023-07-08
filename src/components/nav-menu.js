import React from "react"
import { Link } from "gatsby"
import * as styles from "./nav-menu.module.css"
import SearchInput from "./search-input"

const NavMenu = () => {
  function renderSearchInput() {
    if (process.env.SEARCH_ENABLED === "true") {
      return (
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <SearchInput />
        </li>
      )
    }
  }
  return (
    <nav data-testid="nav-menu">
      <ul className={styles.navList}>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/blog" activeClassName={styles.active}>
            Blog
          </Link>
        </li>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/learning" activeClassName={styles.active}>
            Learning
          </Link>
        </li>
        <li className={`${styles.headerItem} ${styles.navItem}`}>
          <Link to="/about" activeClassName={styles.active}>
            About
          </Link>
        </li>
        {renderSearchInput()}
      </ul>
    </nav>
  )
}

export default NavMenu
