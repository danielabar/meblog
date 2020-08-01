import React, { useState } from "react"
import { Link } from "gatsby"
import styles from "./nav-menu-responsive.module.css"

const NavMenuResponsive = () => {
  const [open, setOpen] = useState(false)

  function navHelper() {
    if (open) {
      return (
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.menuButton}>
              <button
                onClick={e => {
                  setOpen(false)
                }}
              >
                close
              </button>
            </li>
            <li className={`${styles.headerItem} ${styles.navItem}`}>
              <Link to="/blog">Blog</Link>
            </li>
            <li className={`${styles.headerItem} ${styles.navItem}`}>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </nav>
      )
    }
    return (
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.menuButton}>
            <button
              onClick={e => {
                setOpen(true)
              }}
            >
              menu
            </button>
          </li>
        </ul>
      </nav>
    )
  }

  return navHelper()
}

export default NavMenuResponsive
