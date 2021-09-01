/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

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

    const container = render(<ArticleList articles={testData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Some Article 1")).toBeInTheDocument()
    expect(screen.getByText("Some Article 2")).toBeInTheDocument()
  })
})
