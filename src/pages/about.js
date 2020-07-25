import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import styles from "./about.module.css"

export default () => (
  <Layout>
    <SEO title="About" pathname="/about" />
    <div className={styles.container}>About me TBD...</div>
  </Layout>
)
