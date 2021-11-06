import React from "react"
import { GatsbyImage } from "gatsby-plugin-image"
import * as styles from "./related-posts.module.css"

const RelatedPosts = props => (
  <section className={styles.container} data-testid="related-posts">
    <h2 className={styles.header}>Related:</h2>
    <div className={styles.postsContainer}>
      {props.related.edges.map(post => (
        <div key={post.node.id} className={styles.post}>
          <GatsbyImage
            image={
              post.node.frontmatter.featuredImage.childImageSharp
                .gatsbyImageData
            }
            className={styles.postImage}
            alt={post.node.frontmatter.title}
          />
          <p className={styles.postTitle}>{post.node.frontmatter.title}</p>
        </div>
      ))}
    </div>
  </section>
)

export default RelatedPosts
