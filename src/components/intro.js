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
      Passionate about building high-quality software and enhancing team
      effectiveness, I employ detailed PR reviews, integrate linting tools,
      conduct automated testing, and implement CI/CD, all with a focus on developing maintainable code
      for the long term. Leading by example, I demonstrate how these practices
      can be implemented and inspire others to follow suit.
    </p>
    <p className={styles.para}>
      Continuously sharpening my skills through ongoing education, and
      contributing to the community through blogging and developing open source projects are also important
      aspects of my professional journey.
    </p>
  </section>
)

export default Intro
