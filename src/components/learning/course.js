import React from "react"
import { GatsbyImage } from "gatsby-plugin-image"
import { FaRegCalendar, FaExternalLinkAlt } from "react-icons/fa"
import * as styles from "./course.module.css"

const Course = props => {
  return (
    <div className={styles.container}>

      <div className={styles.imgwrapper}>
        <GatsbyImage className={styles.image} image={props.featuredImage.childImageSharp.gatsbyImageData} alt={props.title} />
      </div>

      <div className={`${styles.categoryWrapper} ${props.category}`}>
        <div className={styles.categoryContent}>
          <span className={styles.point}>&bull;</span> {props.category}
        </div>
      </div>

      <div className={styles.title}>{props.title}</div>

      <div className={styles.myInfo}>
        <div className={styles.iconWithText}>
          <FaRegCalendar className={styles.icon} />
          <span className={styles.iconText}>{props.completed_date}</span>
        </div>
        <div className={styles.iconWithText}>
          <FaExternalLinkAlt className={styles.icon} />
          <a className={styles.iconLink} href={props.notes} data-testid="course-notes-link" target="_blank" rel="noopener noreferrer">View Notes</a>
        </div>
      </div>
    </div>
  )
}

export default Course
