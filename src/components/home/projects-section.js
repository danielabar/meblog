import React from "react"
import SectionHead from "./section-head"
import ProjectCard from "./project-card"
import * as styles from "./projects-section.module.css"

const ProjectsSection = ({ projects }) => (
  <section className={styles.section} data-testid="projects-section">
    <SectionHead
      title="Side projects"
      linkText="all repos →"
      linkTo="https://github.com/danielabar"
      external
    />
    <div className={styles.grid}>
      {projects.slice(0, 6).map(p => (
        <ProjectCard key={p.name} {...p} />
      ))}
    </div>
  </section>
)

export default ProjectsSection
