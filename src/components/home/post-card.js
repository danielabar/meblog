import React from "react"
import { Link } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import * as styles from "./post-card.module.css"

const PostCard = ({ post }) => {
  const image = getImage(post.frontmatter.featuredImage)
  return (
    <Link
      to={post.fields.slug}
      className={styles.card}
      data-testid="post-card"
    >
      <div className={styles.image}>
        {image && <GatsbyImage image={image} alt="" />}
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.date}>{post.frontmatter.date}</span>
          <span className={styles.dot} aria-hidden="true">·</span>
          <span className={styles.tag}>{post.frontmatter.category}</span>
        </div>
        <h3 className={styles.title}>{post.frontmatter.title}</h3>
        <p className={styles.excerpt}>
          {post.frontmatter.description || post.excerpt}
        </p>
      </div>
    </Link>
  )
}

export default PostCard
