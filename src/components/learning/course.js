import React from "react"
import { GatsbyImage } from "gatsby-plugin-image"
import * as styles from "./course.module.css"

const Course = props => {
  console.dir(props.title)
  console.dir(props)

  return (
    <div className={styles.container}>
      <div className={styles.imgwrapper}>
        <GatsbyImage className={styles.image} image={props.featuredImage.childImageSharp.gatsbyImageData} alt={props.title} />
      </div>
      <div className={`${styles.categoryWrapper} ${props.category}`}>{props.category}</div>
      <div className={styles.title}>{props.title}</div>
      <div className={styles.platformInfo}>
        <div className={styles.instructor}>{props.instructor}</div>
        <div className={styles.platform}>{props.platform}</div>
      </div>
    </div>
  )
}

export default Course
