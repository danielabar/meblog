import React from "react"
import { Link } from "gatsby"
import * as styles from "./artifacts-list.module.css"

const ArtifactsList = ({ postSlug, artifacts }) => {
  if (!artifacts || artifacts.length === 0) {
    return null
  }

  return (
    <section
      id="visual-explainers"
      className={styles.container}
      data-testid="artifacts-list"
    >
      <h2 className={styles.header}>Visual Explainers</h2>
      <div className={styles.artifactsContainer}>
        {artifacts.map(artifact => (
          <Link
            key={artifact.slug}
            to={`${postSlug.replace(/\/$/, "")}/${artifact.slug}`}
            className={styles.artifactLink}
          >
            {artifact.title}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ArtifactsList
