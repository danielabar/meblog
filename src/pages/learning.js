/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import "@fontsource/bai-jamjuree/200.css"
import "@fontsource/bai-jamjuree/300.css"
import "@fontsource/bai-jamjuree/400.css"
import "@fontsource/bai-jamjuree/400-italic.css"
import "@fontsource/bai-jamjuree/500.css"
import "@fontsource/bai-jamjuree/600.css"
import "@fontsource/bai-jamjuree/700.css"
import SEO from "../components/SEO"
import Layout from "../components/layout"
// TODO: Make a learning intro
import Intro from "../components/intro"
import CourseList from "../components/learning/course-list"
import AllLink from "../components/all-link"
import * as styles from "./learning.module.css"

const Learning = props => {
  return (
    <Layout>
      <div className={styles.container}>
        <SEO title="Learning" pathname="/learning" />
        <Intro />
        <CourseList courses={props.data.allMarkdownRemark.edges} />
        <AllLink marginTop="30px" />
      </div>
    </Layout>
  )
}

export default Learning

export const query = graphql`{
  allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/learning/" } }
    sort: {frontmatter: {completed_date: DESC}}
  ) {
    totalCount
    edges {
      node {
        id
        frontmatter {
          title
          instructor
          platform
          description
          completed_date(formatString: "YYYY-MM-DD")
          category
          notes
          featuredImage {
            childImageSharp {
              gatsbyImageData(width: 250, aspectRatio: 1.67)
            }
          }
        }
      }
    }
  }
}`
