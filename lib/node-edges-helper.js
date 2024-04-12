const simplifyMarkdownEdges = markdownEdges => {
  return markdownEdges.map(edge => ({
    node: {
      id: edge.node.id,
      title: edge.node.frontmatter.title,
      published_at: edge.node.frontmatter.date,
      slug: edge.node.fields.slug,
    },
  }))
}

export default simplifyMarkdownEdges
