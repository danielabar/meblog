import React from "react"
import { Link } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import * as styles from "./related-posts.module.css"

const RelatedPosts = props => (
  <section className={styles.container} data-testid="related-posts">
    <h2 className={styles.header}>You may also like...</h2>
    <div className={styles.postsContainer}>
      {props.related.edges.map(post => (
        <Link
          key={post.node.id}
          to={post.node.fields.slug}
          className={styles.postLink}
        >
          <div>
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
        </Link>
      ))}
    </div>
  </section>
)

export default RelatedPosts
