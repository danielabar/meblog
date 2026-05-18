import React from "react"
import { Link } from "gatsby"
import * as styles from "./header.module.css"

const Header = () => {
  return (
    <header className={styles.header} data-testid="header">
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.profile}>
            <img
              className={styles.profileImg}
              src={"/images/dbaron_profile.png"}
              alt="Daniela Baron Profile"
            />
          </div>
          <div className={styles.name}>Daniela Baron</div>
        </Link>

        <nav className={styles.nav}>
          <Link to="/blog">Blog</Link>
          <Link to="/learning">Learning</Link>
          <Link to="/about">About</Link>
          <a href="/rss.xml">RSS</a>
        </nav>
      </div>
    </header>
  )
}

export default Header
