function generateInsert(node) {
  console.log(`=== SEARCH HELPER PROCESSING: ${node.frontmatter.title}`)
  return `INSERT INTO documents(title, description, category, published_at, slug, body, created_at, updated_at, excerpt)
    VALUES('${replaceMany(node.frontmatter.title)}', '${replaceMany(
    node.frontmatter.description
  )}', '${node.frontmatter.category}', '${node.frontmatter.date}', '${
    node.fields.slug
  }', '${replaceMany(node.rawMarkdownBody)}', now(), now(), '${replaceMany(
    node.excerpt
  )}')
    ON CONFLICT (title)
    DO NOTHING;
  `
}

function replaceMany(str) {
  return str
    .replace(/(?:\r\n|\r|\n)/g, " ")
    .replace(/'/g, "")
    .replace(/"/g, "")
    .replace(/#/g, "")
    .replace(/`/g, "")
}

module.exports = {
  generateInsert,
}
