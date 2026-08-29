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
      <p className={styles.eyebrow}>Visual Explainers</p>
      <div className={styles.artifactsContainer}>
        {artifacts.map(artifact => (
          <Link
            key={artifact.slug}
            to={`${postSlug.replace(/\/$/, "")}/${artifact.slug}`}
            className={styles.artifactLink}
          >
            <svg
              className={styles.artifactIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M8 21h8M12 18v3" />
            </svg>
            {artifact.title}
            <span className={styles.artifactArrow} aria-hidden="true">
              &rarr;
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ArtifactsList
