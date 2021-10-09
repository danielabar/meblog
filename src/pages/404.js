import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import * as styles from "./404.module.css"

export default () => (
  <Layout>
    <SEO title="404" pathname="/404" />
    <div className={styles.container}>
      <div className={styles.main}>404</div>
      <div className={styles.submain}>Ooops!!</div>
      <div className={styles.message}>
        That page doesn't exist or is unavailable
      </div>
    </div>
    <AllLink marginTop="30px" />
  </Layout>
)
