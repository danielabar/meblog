function generateInsert(node) {
  return `INSERT INTO documents(title, description, category, published_at, slug, body, created_at, updated_at)
    VALUES('${replaceMany(node.frontmatter.title)}', '${replaceMany(node.frontmatter.description)}', '${node.frontmatter.category}', '${node.frontmatter.date}', '${node.fields.slug}', '${replaceMany(node.rawMarkdownBody)}', now(), now());
  `
}

function replaceMany(body) {
  return body
    .replace(/(?:\r\n|\r|\n)/g, ' ')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/#/g, '')
    .replace(/`/g, '');
}

module.exports = {
  generateInsert,
}