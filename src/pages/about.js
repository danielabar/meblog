import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import styles from "./about.module.css"

export default () => (
  <Layout>
    <SEO title="About" pathname="/about" />
    <div className={styles.container}>
      <p>
        Hi there, thanks for finding my blog. I'm a fullstack software engineer
        with over 15 years experience delivering consumer facing and large scale
        enterprise applications. Well versed in database, server and client side
        technologies. Experienced in Agile methodologies including Scrum and XP.
        Strong focus on test driven development, refactoring, automated testing
        and continuous integration. Passionate about ongoing education to learn
        new technologies, tools and languages.
      </p>
      <p className={styles.para}>
        I mostly blog abut programming related topics but occasionally write
        about other topics such as personal finance, and health and fitness.
      </p>
    </div>
  </Layout>
)
