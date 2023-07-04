import React from "react"
import * as styles from "./intro.module.css"

const Intro = () => (
  <section className={styles.container}>
    Welcome to the Learning section. In a world where change is the only constant, it's crucial to keep learning and expanding our knowledge. This is especially true in software development, where new languages, tools, libraries, and frameworks are always emerging. Here, I've gathered a collection of online courses that I've taken and compiled detailed notes on, so you can learn from my experiences and take your skills to the next level. Also check out my article on how to <a className="markdown-link"href="https://danielabaron.me/blog/learning-from-screencasts/">get the most out of online courses</a>, and start your learning journey today!
  </section>
)

export default Intro
