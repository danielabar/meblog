import React from "react"
import styles from "./article-list.module.css"
import Article from "./article"

export default props => (
  <section className={styles.container}>
    {props.articles.map(({ node }) => (
      <Article
        key={node.id}
        id={node.id}
        to={node.fields.slug}
        title={node.frontmatter.title}
        category={node.frontmatter.category}
        date={node.frontmatter.date}
        excerpt={node.excerpt}
      />
    ))}
  </section>
)
