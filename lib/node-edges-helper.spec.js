import simplifyMarkdownEdges from "./node-edges-helper"

describe("simplifyMarkdownEdges", () => {
  it("returns simplified markdown edges", () => {
    const markdownEdges = [
      {
        node: {
          id: "1",
          frontmatter: {
            title: "Title 1",
            date: "2024-04-10",
          },
          fields: {
            slug: "/slug-1",
          },
        },
      },
      {
        node: {
          id: "2",
          frontmatter: {
            title: "Title 2",
            date: "2024-04-09",
          },
          fields: {
            slug: "/slug-2",
          },
        },
      },
    ]

    const simplifiedEdges = simplifyMarkdownEdges(markdownEdges)

    expect(simplifiedEdges).toEqual([
      {
        node: {
          id: "1",
          title: "Title 1",
          published_at: "2024-04-10",
          slug: "/slug-1",
        },
      },
      {
        node: {
          id: "2",
          title: "Title 2",
          published_at: "2024-04-09",
          slug: "/slug-2",
        },
      },
    ])
  })
})
