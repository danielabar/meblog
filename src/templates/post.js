import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import styles from "./post.module.css"

// props.pageContext contains context from gatsby-node.js createPages
// props.data contains result from query object defined at bottom of this component - needed for featured image
export default props => {
  const featuredImgFluid =
    props.data.markdownRemark.frontmatter.featuredImage.childImageSharp.fluid
  const content = props.pageContext.content
  const title = props.pageContext.title
  const description = props.pageContext.description || props.pageContext.title
  const slug = props.pageContext.slug

  return (
    <Layout>
      <SEO
        title={title}
        pathname={slug}
        article={true}
        description={description}
      />
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <Img fluid={featuredImgFluid} className={styles.featureImage} />
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <AllLink marginTop="30px" />
    </Layout>
  )
}

// query results available to component in props.data
export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        description
        featuredImage {
          childImageSharp {
            fluid(maxWidth: 800) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      fields {
        slug
      }
    }
  }
`
