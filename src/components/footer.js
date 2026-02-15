/**
 * Legacy Footer Component
 *
 * Original footer design used across most of the site.
 * A modern redesign is available in src/components/shared/footer.js
 * (currently used only on homepage).
 *
 * This component will remain in use on non-homepage pages until
 * the modern design is adopted site-wide.
 */
import React from "react"
import * as styles from "./footer.module.css"
import { FaTwitter, FaGithub, FaLinkedinIn } from "react-icons/fa"
import { SiLinktree } from "react-icons/si"

const Footer = () => {
  return (
    <footer className={styles.container} data-testid="footer">
      <hr className={styles.sep} />
      <p className={styles.copy}>All materials © Daniela Baron 2026</p>
      <div className={styles.social}>
        <a
          href="https://twitter.com/DanielaMBaron"
          className={styles.footerIcon}
        >
          <FaTwitter />
        </a>
        <a href="https://github.com/danielabar" className={styles.footerIcon}>
          <FaGithub />
        </a>
        <a href="https://linktr.ee/danielabaron" className={styles.footerIcon}>
          <SiLinktree />
        </a>
        <a
          href="https://www.linkedin.com/in/danielabaron/"
          className={styles.footerIcon}
        >
          <FaLinkedinIn />
        </a>
      </div>
    </footer>
  )
}

export default Footer
