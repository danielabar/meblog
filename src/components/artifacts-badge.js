import React from "react"
import * as styles from "./artifacts-badge.module.css"

const ArtifactsBadge = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) {
    return null
  }

  const label =
    artifacts.length === 1
      ? "Visual explainer available"
      : `${artifacts.length} visual explainers available`

  return (
    <a href="#visual-explainers" className={styles.badge}>
      {label} &darr;
    </a>
  )
}

export default ArtifactsBadge
