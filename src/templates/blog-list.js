import React from "react"
import { graphql } from "gatsby"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import ArticleList from "../components/article-list"
import Pagination from "../components/pagination"

export default class BlogList extends React.Component {
  render() {
    const { currentPage, numPages } = this.props.pageContext
    const seoPath = `/blog/${currentPage}`
    const isFirst = currentPage === 1
    const isLast = currentPage === numPages
    const prevPage =
      currentPage - 1 === 1 ? "/blog" : `/blog/${(currentPage - 1).toString()}`
    const nextPage = `/blog/${(currentPage + 1).toString()}`

    return (
      <Layout>
        <SEO title="Blog" pathname={seoPath} />
        <ArticleList
          articles={this.props.data.allMarkdownRemark.edges}
        ></ArticleList>
        <Pagination
          isFirst={isFirst}
          prevPage={prevPage}
          isLast={isLast}
          nextPage={nextPage}
        />
      </Layout>
    )
  }
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          id
          fields {
            slug
          }
          frontmatter {
            title
            date(formatString: "MMMM YYYY")
            category
          }
          excerpt
        }
      }
    }
  }
`
