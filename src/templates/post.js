import React from "react"
import Layout from "../components/layout"
import styles from "./post.module.css"

// props.pageContext object contains context from gatsby-node.js createPages
export default props => {
  const content = props.pageContext.content
  const title = props.pageContext.title

  return (
    <Layout>
      <div className={styles.container}>
        <h1>{title}</h1>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </Layout>
  )
}
