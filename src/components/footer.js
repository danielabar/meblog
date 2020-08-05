import React from "react"
import styles from "./footer.module.css"
import { FaTwitter, FaGithub, FaCodepen, FaLinkedinIn } from "react-icons/fa"

const Footer = () => {
  return (
    <footer className={styles.container}>
      <hr className={styles.sep} />
      <p className={styles.copy}>All materials © Daniela Baron 2020</p>
      <div className={styles.social}>
        <a
          href="https://twitter.com/DanielaMBaron"
          className={styles.footerIcon}
        >
          <FaTwitter size="1.7rem" />
        </a>
        <a href="https://github.com/danielabar" className={styles.footerIcon}>
          <FaGithub size="1.7rem" />
        </a>
        <a href="https://codepen.io/danielabar" className={styles.footerIcon}>
          <FaCodepen size="1.7rem" />
        </a>
        <a
          href="https://www.linkedin.com/in/danielabaron/"
          className={styles.footerIcon}
        >
          <FaLinkedinIn size="1.7rem" />
        </a>
      </div>
    </footer>
  )
}

export default Footer
