import React from "react"
import SectionHead from "./section-head"
import PostCard from "./post-card"
import * as styles from "./posts-section.module.css"

const PostsSection = ({ title, linkText, linkTo, posts }) => (
  <section className={styles.section} data-testid="posts-section">
    <SectionHead title={title} linkText={linkText} linkTo={linkTo} />
    <div className={styles.cards}>
      {posts.map(post => (
        <PostCard key={post.fields.slug} post={post} />
      ))}
    </div>
  </section>
)

export default PostsSection
