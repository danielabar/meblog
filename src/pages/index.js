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
            linkTo="/archive"
            posts={popular}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Index

// Homepage data: 3 most recent posts + 3 analytics-driven "popular" posts.
//
// `recent` is a straight allMarkdownRemark query scoped to src/markdown/
// (the regex filter keeps /src/projects/ and /src/learning/ out).
//
// `popular` is the non-obvious one. The source of truth for which posts are
// "popular" is src/csv/popular.csv, which is generated out-of-band by a SQL
// query against the hello-visitor analytics database (top 3 by visit count
// over the last 6 months, excluding the 3 most-recently-published posts so
// "Popular" and "Recent" don't overlap). The query lives in the separate
// meblog_projects/popular_support repo; the CSV gets dropped into this repo.
//
// To join those slugs back to post data, rather than parsing the CSV in JS
// and re-querying by slug, we lean on a schema customization in
// gatsby-node.js that adds a `post: MarkdownRemark @link(by: "fields.slug", from: "slug")`
// field to the PopularCsv type. That lets us hop straight from a CSV row to
// its MarkdownRemark node inside one GraphQL query and reuse the same
// PostCardFields fragment for both sections. CSV order is preserved, so the
// analytics ranking survives. Any slug in the CSV with no matching post
// comes back as `post: null` and is filtered out (with a warning) in the
// component.
export const query = graphql`
  fragment PostCardFields on MarkdownRemark {
    fields {
      slug
    }
    excerpt(pruneLength: 160)
    frontmatter {
      title
      date(formatString: "YYYY-MM-DD")
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
