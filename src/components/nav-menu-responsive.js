import React, { useState } from "react"
import { Link } from "gatsby"
import { MdMenu, MdClose } from "react-icons/md"
import styles from "./nav-menu-responsive.module.css"

const NavMenuResponsive = () => {
  const [open, setOpen] = useState(false)

  function navHelper() {
    if (open) {
      return (
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <button
                className={styles.menuButton}
                onClick={e => {
                  setOpen(false)
                }}
              >
                <MdClose size="1.7rem" />
                <br />
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
          <li>
            <button
              className={styles.menuButton}
              onClick={e => {
                setOpen(true)
              }}
            >
              <MdMenu size="1.7rem" />
              <br />
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
