/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"

import "@fontsource/figtree/300.css"
import "@fontsource/figtree/300-italic.css"
import "@fontsource/figtree/400.css"
import "@fontsource/figtree/400-italic.css"
import "@fontsource/figtree/500.css"
import "@fontsource/figtree/500-italic.css"
import "@fontsource/figtree/600.css"
import "@fontsource/figtree/600-italic.css"
import "@fontsource/figtree/700.css"
import "@fontsource/figtree/700-italic.css"
import "@fontsource/figtree/800.css"
import "@fontsource/figtree/800-italic.css"
import "@fontsource/figtree/900.css"
import "@fontsource/figtree/900-italic.css"

import SEO from "../components/SEO"
import Layout from "../components/layout"
import Intro from "../components/learning/intro"
import CourseList from "../components/learning/course-list"
import AllLink from "../components/all-link"
import * as styles from "./learning.module.css"

const Learning = props => {
  return (
    <Layout>
      <div className={styles.container} data-testid="learning">
        <SEO
          title="Learning"
          description="Unlock the power of online courses in software development, with curated insights to elevate your skills in a rapidly evolving field."
          pathname="/learning"
          image="/images/learning.png"
        />
        <Intro />
        <CourseList courses={props.data.allMarkdownRemark.edges} />
        <AllLink marginTop="30px" />
      </div>
    </Layout>
  )
}

export default Learning

export const query = graphql`
  {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/src/learning/" } }
      sort: { frontmatter: { completed_date: DESC } }
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
                gatsbyImageData(width: 250, aspectRatio: 1.78)
              }
            }
          }
        }
      }
    }
  }
`
