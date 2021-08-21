import React from "react"
import renderer from "react-test-renderer"

import ArticleList from "./article-list"

describe("AllLink", () => {
  it("renders correctly", () => {
    const testData = [
      {
        node: {
          id: "123abc",
          fields: {
            slug: "/blog/some-article-1",
          },
          frontmatter: {
            title: "Some Article 1",
            category: "Rails",
            date: "August 2021",
          },
          excerpt: "First sentence of article 1 blah blah blah...",
        },
      },
      {
        node: {
          id: "456def",
          fields: {
            slug: "/blog/some-article-2",
          },
          frontmatter: {
            title: "Some Article 2",
            category: "Docker",
            date: "September 2021",
          },
          excerpt: "First sentence of article 2 blah blah blah...",
        },
      },
    ]

    const testRenderer = renderer.create(<ArticleList articles={testData} />)
    expect(testRenderer.toJSON()).toMatchSnapshot()
  })
})
