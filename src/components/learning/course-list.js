import React from "react"
import * as styles from "./course-list.module.css"
import Course from "./course"

const CourseList = props => (
  <section className={styles.container} data-testid="course-list">
    {props.courses.map(({ node }) => (
      <Course
        key={node.id}
        id={node.id}
        title={node.frontmatter.title}
        platform={node.frontmatter.platform}
        instructor={node.frontmatter.instructor}
        description={node.frontmatter.description}
        completed_date={node.frontmatter.completed_date}
        category={node.frontmatter.category}
        notes={node.frontmatter.notes}
        featuredImage={node.frontmatter.featuredImage}
      />
    ))}
  </section>
)

export default CourseList
