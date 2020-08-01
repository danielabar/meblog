import React from "react"
import styles from "./footer.module.css"
import { FaTwitter, FaGithub, FaCodepen, FaLinkedinIn } from "react-icons/fa"

const Footer = () => {
  const iconColor =
    typeof window !== "undefined"
      ? window
          .getComputedStyle(document.documentElement)
          .getPropertyValue("--base-font-color")
      : ""

  return (
    <footer className={styles.container}>
      <hr className={styles.sep} />
      <p className={styles.copy}>All materials © Daniela Baron 2020</p>
      <div className={styles.social}>
        <a href="https://twitter.com/DanielaMBaron">
          <FaTwitter size="1.7rem" color={iconColor} />
        </a>
        <a href="https://github.com/danielabar">
          <FaGithub size="1.7rem" color={iconColor} />
        </a>
        <a href="https://codepen.io/danielabar">
          <FaCodepen size="1.7rem" color={iconColor} />
        </a>
        <a href="https://www.linkedin.com/in/danielabaron/">
          <FaLinkedinIn size="1.7rem" color={iconColor} />
        </a>
      </div>
    </footer>
  )
}

export default Footer
