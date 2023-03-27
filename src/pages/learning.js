/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
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
// TODO: Make a CourseList component
// import ArticleList from "../components/article-list"
import AllLink from "../components/all-link"
import * as styles from "./learning.module.css"

const Learning = props => {
  const courses = props.data.allMarkdownRemark.edges
  console.dir(courses)

  return (
    <Layout>
      <div className={styles.container}>
        <SEO title="Learning" pathname="/learning" />
        <Intro />
        {/* <ArticleList articles={data.allMarkdownRemark.edges} /> */}

        <ul>
        {courses.map(({ node }) => (
          <li key={node.id}>
            {node.frontmatter.title}
            <GatsbyImage
              image={node.frontmatter.featuredImage.childImageSharp.gatsbyImageData}
              alt="TBD"
            />
          </li>
        ))}
        </ul>
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
          completed_date(formatString: "MMMM YYYY")
          category
          notes
          featuredImage {
            childImageSharp {
              gatsbyImageData(width: 200, height: 150, layout: FIXED)
            }
          }
        }
      }
    }
  }
}`
