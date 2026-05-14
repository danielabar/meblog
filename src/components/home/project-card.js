import React from "react"
import * as styles from "./project-card.module.css"

const ProjectCard = ({ name, url, description, langs, year }) => (
  <a
    className={styles.card}
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    data-testid="project-card"
  >
    <div className={styles.name}>
      <span className={styles.bullet} aria-hidden="true">·</span>
      <span>{name}</span>
    </div>
    <p className={styles.description}>{description}</p>
    <div className={styles.footer}>
      <span className={styles.langs}>{langs.join(" · ")}</span>
      <span className={styles.year}>{year}</span>
    </div>
  </a>
)

export default ProjectCard
