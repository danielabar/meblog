import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import styles from "./post.module.css"

// props.pageContext object contains context from gatsby-node.js createPages
export default props => {
  const content = props.pageContext.content
  const title = props.pageContext.title
  const description = props.pageContext.description || props.pageContext.title
  const slug = props.pageContext.slug

  return (
    <Layout>
      <SEO
        title={title}
        pathname={slug}
        article={true}
        description={description}
      />
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <AllLink marginTop="30px" />
    </Layout>
  )
}
