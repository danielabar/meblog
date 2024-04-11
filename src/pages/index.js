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
// TODO: Also need italic font for quote sections in posts
import SEO from "../components/SEO"
import Layout from "../components/layout"
import Intro from "../components/intro"
import ArticleListMini from "../components/article-list-mini"
import * as styles from "./index.module.css"

// TODO: Could this be be in /lib for easier testing?
const simplifyMarkdownEdges = markdownEdges => {
  return markdownEdges.map(edge => ({
    node: {
      id: edge.node.id,
      title: edge.node.frontmatter.title,
      published_at: edge.node.frontmatter.date,
      slug: edge.node.fields.slug
    }
  }));
};

const Index = props => {
  const flattenedMarkdownEdges = simplifyMarkdownEdges(props.data.allMarkdownRemark.edges)

  return (
    <Layout>
      <div className={styles.container}>
        <SEO title="Home" pathname="/" />
        <Intro />
        <div className={styles.articles}>
          <ArticleListMini
            articles={flattenedMarkdownEdges}
            title="Recent Posts"
          />
          <ArticleListMini
            articles={props.data.popular.edges}
            title="Popular Posts"
          />
        </div>
      </div>
    </Layout>
  )
}

export default Index

export const query = graphql`{
  allMarkdownRemark(
    limit: 3,
    filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
    sort: {frontmatter: {date: DESC}}
  ) {
    totalCount
    edges {
      node {
        id
        frontmatter {
          title
          date(formatString: "MMMM D, YYYY")
          category
        }
        fields {
          slug
        }
      }
    }
  }
  popular: allPopularCsv {
    edges {
      node {
        id
        title
        published_at
        slug
      }
    }
  }
}`
