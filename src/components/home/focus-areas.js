import React from "react"
import * as styles from "./focus-areas.module.css"

const FocusAreas = () => {
  const areas = [
    {
      title: "Full-Stack Development",
      description:
        "Building complete solutions from database architecture to user interfaces",
    },
    {
      title: "Team Effectiveness",
      description:
        "Developer experience, CI/CD, documentation, and workflows that compound value",
    },
    {
      title: "AI-Assisted Development",
      description:
        "Using AI as a force multiplier for engineering rigor and productivity",
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>Areas of Focus</div>
      <div className={styles.grid}>
        {areas.map((area, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.title}>{area.title}</div>
            <div className={styles.description}>{area.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FocusAreas
