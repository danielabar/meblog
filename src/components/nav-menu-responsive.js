import React, { useState } from "react"
import { Link } from "gatsby"
import { MdMenu, MdClose } from "react-icons/md"
import * as styles from "./nav-menu-responsive.module.css"

const NavMenuResponsive = () => {
  const [open, setOpen] = useState(false)

  function closeIfActive(evt) {
    const linkClasses = Array.from(evt.target.classList)
    if (linkClasses.some(str => str.includes("active"))) {
      setOpen(false)
    }
  }

  function navHelper() {
    if (open) {
      return (
        <nav className={styles.navOpen}>
          <button
            className={`${styles.menuButton} ${styles.menuButtonClose}`}
            data-testid="nav-menu-responsive-close"
            onClick={e => {
              setOpen(false)
            }}
          >
            <MdClose size="1.7rem" />
            <br />
            close
          </button>
          <ul className={styles.navList}>
            <li></li>
            <li className={`${styles.headerItem} ${styles.navItem}`}>
              <Link
                to="/"
                onClick={closeIfActive}
                className={styles.navLink}
                activeClassName={styles.active}
              >
                Home
              </Link>
            </li>
            <li className={`${styles.headerItem} ${styles.navItem}`}>
              <Link
                to="/blog"
                onClick={closeIfActive}
                className={styles.navLink}
                activeClassName={styles.active}
              >
                Blog
              </Link>
            </li>
            <li className={`${styles.headerItem} ${styles.navItem}`}>
              <Link
                to="/about"
                onClick={closeIfActive}
                className={styles.navLink}
                activeClassName={styles.active}
              >
                About
              </Link>
            </li>
          </ul>
        </nav>
      )
    }
    return (
      <nav className={styles.nav} data-testid="nav-menu-responsive">
        <ul className={styles.navList}>
          <li>
            <button
              className={styles.menuButton}
              data-testid="nav-menu-responsive-menu"
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
