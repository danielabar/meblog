const visit = require("unist-util-visit")

const MARKER = /^<!--\s*artifact:\s*(\S+)\s*-->$/

const cardHtml = (postSlug, artifact) => `<a href="${postSlug}/${artifact.slug}" class="markdown-artifact-card">
  <svg class="markdown-artifact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 21h8M12 18v3" />
  </svg>
  <span class="markdown-artifact-body">
    <span>${artifact.title}</span>
    <span class="markdown-artifact-subtitle">Simplified visual explainer</span>
  </span>
  <span class="markdown-artifact-arrow" aria-hidden="true">&rarr;</span>
</a>`

module.exports = ({ markdownAST, markdownNode, reporter }) => {
  const artifacts = markdownNode.frontmatter.artifacts || []
  const postSlug = markdownNode.fields.slug.replace(/\/$/, "")

  visit(markdownAST, "html", node => {
    const match = MARKER.exec(node.value.trim())
    if (!match) {
      return
    }

    const slug = match[1]
    const artifact = artifacts.find(a => a.slug === slug)

    if (!artifact) {
      reporter.panicOnBuild(
        `Unknown artifact slug "${slug}" referenced in "${markdownNode.frontmatter.title}" (${markdownNode.fields.slug}). Add it to that post's frontmatter "artifacts" list, or fix the typo.`
      )
      return
    }

    node.value = cardHtml(postSlug, artifact)
  })

  return markdownAST
}
