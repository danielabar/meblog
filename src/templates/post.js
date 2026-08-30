/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import RelatedPosts from "../components/related-posts"
import * as styles from "./post.module.css"
import "@fontsource/fira-code"

// props.data contains result from query object defined at bottom of this component - needed for featured image
const Post = props => {
  const markdown = props.data.markdownRemark
  const publishedDate = markdown.frontmatter.date
  const featuredImgFluid =
    markdown.frontmatter.featuredImage.childImageSharp.gatsbyImageData
  const imageSrc = featuredImgFluid.images.fallback.src
  const content = markdown.html
  const toc = markdown.tableOfContents
  const timeToRead = markdown.timeToRead
  const title = markdown.frontmatter.title
  const description = markdown.frontmatter.description || title
  const slug = markdown.fields.slug
  const related = props.data.relatedP

  return (
    <Layout>
      <SEO
        title={title}
        pathname={slug}
        article={true}
        description={description}
        image={imageSrc}
      />
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <main className={styles.main}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.published}>
              Published {publishedDate} &middot; {timeToRead} min read
            </div>
            <GatsbyImage
              image={featuredImgFluid}
              className={styles.featureImage}
              alt={description}
            />
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </main>
          <div className={styles.toc}>
            <div
              className={styles.toclist}
              dangerouslySetInnerHTML={{ __html: toc }}
            />
          </div>
        </div>
        <RelatedPosts related={related} />
        <AllLink marginTop="60px" />
      </div>
    </Layout>
  )
}

export default Post

// https://github.com/sititou70/gatsby-remark-related-posts-example/blob/master/src/templates/blog-post.js
// https://github.com/gatsbyjs/gatsby/issues/8166
// https://www.gatsbyjs.com/docs/graphql-reference/#filter
// query results available to component in props.data
export const query = graphql`
  query($slug: String!, $relatedPosts: [String!]!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      tableOfContents
      frontmatter {
        title
        date(formatString: "DD MMM YYYY")
        description
        featuredImage {
          childImageSharp {
            gatsbyImageData(width: 900, layout: CONSTRAINED)
          }
        }
      }
      fields {
        slug
      }
    }
    relatedP: allMarkdownRemark(
      filter: { frontmatter: { title: { in: $relatedPosts } } }
    ) {
      edges {
        node {
          id
          frontmatter {
            title
            featuredImage {
              childImageSharp {
                gatsbyImageData(width: 300, height: 170, layout: FIXED)
              }
            }
          }
          fields {
            slug
          }
        }
      }
    }
  }
`
