import React from "react"
import * as styles from "./intro.module.css"

const Intro = () => (
  <section className={styles.container}>
    <p className={styles.para}>
      I'm a software engineer with over 20 years experience delivering software
      solutions with many languages and frameworks including Ruby on Rails,
      Node.js, React, Ember, Angular, Go, Python, and Java.
    </p>
    <p className={styles.para}>
      I have a passion for crafting high quality software and enhancing team
      effectiveness with detailed PR reviews, integrating linting tools,
      automated testing, CI/CD, and developing maintainable code for the long
      term. I lead by example, showing how these practices can be put into
      action and encouraging others to follow suit.
    </p>
    <p className={styles.para}>
      I also continue to hone my skills with ongoing education, and enjoy
      sharing my experiences through blogging and mentoring.
    </p>
  </section>
)

export default Intro
