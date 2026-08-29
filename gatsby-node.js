const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require("path")
const fs = require("fs")
const searchHelper = require("./lib/search-helper")

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type PopularCsv implements Node {
      title: String!
      published_at: String
      slug: String!
      post: MarkdownRemark @link(by: "fields.slug", from: "slug")
    }

    type MarkdownRemarkFrontmatterArtifact {
      slug: String!
      title: String!
      file: String!
      creditText: String
      creditUrl: String
    }

    type MarkdownRemarkFrontmatter {
      artifacts: [MarkdownRemarkFrontmatterArtifact]
    }
  `)
}

// Add slug to each post
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    const slugValue = `/blog${slug}`
    createNodeField({
      node,
      name: `slug`,
      value: slugValue,
    })
  }
}

// Create post pages programmatically, exposing markdown to page template via `context`
exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  return new Promise(resolve => {
    graphql(`
      {
        allMarkdownRemark(
          filter: { fileAbsolutePath: { regex: "/src/markdown/" } }
          sort: { frontmatter: { date: DESC } }
        ) {
          edges {
            node {
              frontmatter {
                title
                category
                date(formatString: "YYYY-MM-DD")
                description
                related
                artifacts {
                  slug
                  title
                  file
                  creditText
                  creditUrl
                }
              }
              fields {
                slug
              }
              excerpt
              html
              rawMarkdownBody
            }
          }
        }
      }
    `).then(result => {
      // wipe out old search file
      if (fs.existsSync("search.sql")) {
        fs.unlinkSync("search.sql")
      }

      // context fields available as query parameters in page templates
      result.data.allMarkdownRemark.edges.forEach(({ node }) => {
        // build individual blog pages
        createPage({
          path: node.fields.slug,
          component: path.resolve("./src/templates/post.js"),
          context: {
            slug: node.fields.slug,
            relatedPosts: node.frontmatter.related,
          },
        })

        // build artifact pages owned by this post
        const artifacts = node.frontmatter.artifacts || []
        const postSlugTrimmed = node.fields.slug.replace(/\/$/, "")
        artifacts.forEach(artifact => {
          const staticFilePath = path.join("static", "artifacts", artifact.file)
          if (!fs.existsSync(staticFilePath)) {
            throw new Error(
              `Artifact file not found: ${staticFilePath} (referenced from ${node.fields.slug})`
            )
          }
          createPage({
            path: `${postSlugTrimmed}/${artifact.slug}`,
            component: path.resolve("./src/templates/artifact.js"),
            context: {
              slug: `${postSlugTrimmed}/${artifact.slug}`,
              title: artifact.title,
              file: artifact.file,
              creditText: artifact.creditText,
              creditUrl: artifact.creditUrl,
              postSlug: node.fields.slug,
              postTitle: node.frontmatter.title,
            },
          })
        })

        // generate search insert statements for postgres full text search service
        insertStatement = searchHelper.generateInsert(node)
        fs.appendFileSync("search.sql", insertStatement + "\n", "utf8")
      })
      // build blog-list pages (aka pagination)
      const posts = result.data.allMarkdownRemark.edges
      const postsPerPage = 5
      const numPages = Math.ceil(posts.length / postsPerPage)
      Array.from({ length: numPages }).forEach((_, i) => {
        createPage({
          path: i === 0 ? `/blog` : `/blog/${i + 1}`,
          component: path.resolve("./src/templates/blog-list.js"),
          context: {
            limit: postsPerPage,
            skip: i * postsPerPage,
            numPages,
            currentPage: i + 1,
          },
        })
      })
      resolve()
    })
  })
}
