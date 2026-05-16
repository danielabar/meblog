import React from "react"
import { graphql } from "gatsby"

import "@fontsource/figtree/400.css"
import "@fontsource/figtree/500.css"
import "@fontsource/figtree/600.css"
import "@fontsource/figtree/700.css"
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/500.css"
import "@fontsource/jetbrains-mono/600.css"

import SEO from "../components/SEO"
import Layout from "../components/shared/layout"
import Hero from "../components/home/hero"
import PostsSection from "../components/home/posts-section"
import * as styles from "./index.module.css"

const Index = ({ data }) => {
  const recent = data.recent.nodes
  const popular = data.popular.nodes
    .filter(n => {
      if (!n.post) {
        // eslint-disable-next-line no-console
        console.warn(`[home] popular.csv slug has no matching post: ${n.slug}`)
        return false
      }
      return true
    })
    .map(n => n.post)

  return (
    <Layout>
      <SEO title="Home" pathname="/" />
      <div className={styles.page}>
        <Hero />
        <div className={styles.twoCol}>
          <PostsSection
            title="Recent"
            linkText="all writing →"
            linkTo="/blog"
            posts={recent}
          />
          <PostsSection
            title="Popular"
            linkText="archive →"
            linkTo="/blog"
            posts={popular}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Index

export const query = graphql`
  fragment PostCardFields on MarkdownRemark {
    fields {
      slug
    }
    excerpt(pruneLength: 160)
    frontmatter {
      title
      date(formatString: "MMMM D, YYYY")
      category
      description
      featuredImage {
        childImageSharp {
          gatsbyImageData(width: 360, aspectRatio: 1.45, placeholder: BLURRED)
        }
      }
    }
  }
  {
    recent: allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
      limit: 3
    ) {
      nodes {
        ...PostCardFields
      }
    }
    popular: allPopularCsv(limit: 3) {
      nodes {
        slug
        post {
          ...PostCardFields
        }
      }
    }
  }
`
