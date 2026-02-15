/**
 * Modern Footer Component
 *
 * Part of 2026 homepage redesign. Features modern design with:
 * - Clean layout with copyright and tagline
 * - Social media links with hover effects
 * - DM Sans typography
 *
 * Currently used only on homepage. May be adopted site-wide in future
 * redesigns to replace legacy src/components/footer.js.
 */
import React from "react"
import { FaTwitter, FaGithub, FaLinkedinIn } from "react-icons/fa"
import { SiLinktree } from "react-icons/si"
import * as styles from "./footer.module.css"

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.copyright}>© 2026 Daniela Baron</div>
          <div className={styles.tagline}>
            Building software that compounds in value
          </div>
        </div>

        <div className={styles.social}>
          <a href="https://twitter.com/DanielaMBaron" aria-label="Twitter">
            <FaTwitter />
          </a>
          <a href="https://github.com/danielabar" aria-label="GitHub">
            <FaGithub />
          </a>
          <a href="https://linktr.ee/danielabaron" aria-label="Linktree">
            <SiLinktree />
          </a>
          <a
            href="https://www.linkedin.com/in/danielabaron/"
            aria-label="LinkedIn"
          >
            <FaLinkedinIn />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
