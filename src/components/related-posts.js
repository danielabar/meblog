import React from 'react'
import * as styles from "./related-posts.module.css"

const RelatedPosts = (props) => (
  <section className={styles.container} data-testid="related-posts">
    {props.related.edges.map( (post) => (
      <div id={post.node.id} key={post.node.id}>{post.node.frontmatter.title}</div>
    ))}
  </section>
)

export default RelatedPosts