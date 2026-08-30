const unified = require("unified")
const remarkParse = require("remark-parse")
const artifactEmbed = require("./index")

const parseMarkdown = markdown =>
  unified().use(remarkParse).parse(markdown)

const fakeReporter = () => ({ panicOnBuild: jest.fn() })

describe("gatsby-remark-artifact-embed", () => {
  const markdownNode = {
    frontmatter: {
      title: "What I Want for My Birthday",
      artifacts: [
        {
          slug: "metabolic-theory-eli5",
          title: "The Metabolic Theory of Cancer",
          file: "metabolic-theory-eli5.html",
        },
      ],
    },
    fields: {
      slug: "/blog/what-i-want-for-my-birthday/",
    },
  }

  it("replaces a matching artifact marker with a link card", () => {
    const markdownAST = parseMarkdown(
      "Some paragraph.\n\n<!-- artifact: metabolic-theory-eli5 -->\n\nMore text."
    )
    const reporter = fakeReporter()

    artifactEmbed({ markdownAST, markdownNode, reporter })

    const htmlNode = markdownAST.children.find(node => node.type === "html")
    expect(htmlNode.value).toContain(
      'href="/blog/what-i-want-for-my-birthday/metabolic-theory-eli5"'
    )
    expect(htmlNode.value).toContain("The Metabolic Theory of Cancer")
    expect(reporter.panicOnBuild).not.toHaveBeenCalled()
  })

  it("leaves unrelated html nodes untouched", () => {
    const markdownAST = parseMarkdown(
      '<aside class="markdown-aside">Not an artifact marker.</aside>'
    )
    const reporter = fakeReporter()

    artifactEmbed({ markdownAST, markdownNode, reporter })

    const htmlNode = markdownAST.children.find(node => node.type === "html")
    expect(htmlNode.value).toBe(
      '<aside class="markdown-aside">Not an artifact marker.</aside>'
    )
    expect(reporter.panicOnBuild).not.toHaveBeenCalled()
  })

  it("panics on build for an unknown artifact slug", () => {
    const markdownAST = parseMarkdown("<!-- artifact: does-not-exist -->")
    const reporter = fakeReporter()

    artifactEmbed({ markdownAST, markdownNode, reporter })

    expect(reporter.panicOnBuild).toHaveBeenCalledWith(
      expect.stringContaining('Unknown artifact slug "does-not-exist"')
    )

    const htmlNode = markdownAST.children.find(node => node.type === "html")
    expect(htmlNode.value).toBe("<!-- artifact: does-not-exist -->")
  })
})
