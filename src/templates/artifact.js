import React from "react"
import { Link } from "gatsby"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import * as styles from "./artifact.module.css"

const Artifact = ({ pageContext }) => {
  const {
    title,
    file,
    creditText,
    creditUrl,
    postSlug,
    postTitle,
  } = pageContext

  return (
    <Layout>
      <SEO title={title} pathname={pageContext.slug} noindex={true} />
      <div className={styles.container}>
        <Link to={postSlug} className={styles.backLink}>
          &larr; Back to {postTitle}
        </Link>
        {creditText && creditUrl && (
          <div className={styles.credit}>
            Generated with{" "}
            <a href={creditUrl} className={styles.creditLink}>
              {creditText}
            </a>
          </div>
        )}
        <iframe
          src={`/artifacts/${file}`}
          title={title}
          className={styles.frame}
        />
      </div>
    </Layout>
  )
}

export default Artifact
