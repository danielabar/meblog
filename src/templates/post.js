/* eslint-disable react/jsx-pascal-case */
import React from "react"
import { graphql } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image";
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import * as styles from "./post.module.css"
import "@fontsource/fira-code"

// props.data contains result from query object defined at bottom of this component - needed for featured image
const Post = (props) => {
  const markdown = props.data.markdownRemark
  const publishedDate = markdown.frontmatter.date
  const featuredImgFluid =
    markdown.frontmatter.featuredImage.childImageSharp.gatsbyImageData
  const imageSrc = featuredImgFluid.images.fallback.src
  const content = markdown.html
  const title = markdown.frontmatter.title
  const description = markdown.frontmatter.description || title
  const slug = markdown.fields.slug

  return (
    <Layout>
      <SEO
        title={title}
        pathname={slug}
        article={true}
        description={description}
        image={imageSrc}
      />
      <div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.published}>Published {publishedDate}</div>
        <GatsbyImage image={featuredImgFluid} className={styles.featureImage} alt={description}/>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <AllLink marginTop="60px" />
    </Layout>
  );
}

export default Post

// query results available to component in props.data
export const query = graphql`query ($slug: String!) {
  markdownRemark(fields: {slug: {eq: $slug}}) {
    html
    frontmatter {
      title
      date(formatString: "DD MMM YYYY")
      description
      featuredImage {
        childImageSharp {
          gatsbyImageData(width: 800, layout: CONSTRAINED)
        }
      }
    }
    fields {
      slug
    }
  }
}
`
