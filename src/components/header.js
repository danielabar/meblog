import React from "react"
import { Link } from "gatsby"
import useViewport from "../hooks/useviewport"
import * as styles from "./header.module.css"
import NavMenuResponsive from "./nav-menu-responsive"
import NavMenu from "./nav-menu"

const Header = () => {
  const { width } = useViewport()
  const breakpoint = 640

  function menuHelper() {
    return width < breakpoint ? <NavMenuResponsive /> : <NavMenu />
  }

  return (
    <header className={styles.container} data-testid="header">
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

      {menuHelper()}
    </header>
  )
}

export default Header
