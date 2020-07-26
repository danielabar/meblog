import React from "react"
import { Link } from "gatsby"
import styles from "./footer.module.css"
import { FaTwitter, FaGithub, FaCodepen, FaLinkedinIn } from "react-icons/fa"

const Footer = () => {
  const iconColor = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--base-font-color")

  return (
    <footer className={styles.container}>
      <hr className={styles.sep} />
      <p className={styles.copy}>All materials © Daniela Baron 2020</p>
      <div className={styles.social}>
        <Link to="https://twitter.com/DanielaMBaron">
          <FaTwitter size="1.7rem" color={iconColor} />
        </Link>
        <Link to="https://github.com/danielabar">
          <FaGithub size="1.7rem" color={iconColor} />
        </Link>
        <Link to="https://codepen.io/danielabar">
          <FaCodepen size="1.7rem" color={iconColor} />
        </Link>
        <Link to="https://www.linkedin.com/in/danielabaron/">
          <FaLinkedinIn size="1.7rem" color={iconColor} />
        </Link>
      </div>
    </footer>
  )
}

export default Footer
