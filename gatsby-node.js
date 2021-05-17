const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require("path")
const fs = require('fs');

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
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
          edges {
            node {
              frontmatter {
                title
                description
              }
              fields {
                slug
              }
              html,
              rawMarkdownBody
            }
          }
        }
      }
    `).then(result => {
      // build individual blog pages
      result.data.allMarkdownRemark.edges.forEach(({ node }) => {
        createPage({
          path: node.fields.slug,
          component: path.resolve("./src/templates/post.js"),
          context: {
            slug: node.fields.slug,
            content: node.html,
            title: node.frontmatter.title,
            description: node.frontmatter.description,
          },
        })
        // generate search insert statements for pg
        forInsert = node.rawMarkdownBody.replace(/(?:\r\n|\r|\n)/g, ' ');
        fs.appendFileSync('search.sql', forInsert + '\n\n', 'utf8');
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

// Web worker support: https://dev.to/evanwinter/using-web-workers-in-a-gatsby-project-3ca8
exports.onCreateWebpackConfig = ({ actions: { replaceWebpackConfig }, getConfig }) => {
  const config = getConfig()

  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'workerize-loader' }
  })

  config.output.globalObject = 'this'

  replaceWebpackConfig(config)
}