import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Index from "./index"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

// TODO: Revisit after have csv data source integrated for popular posts
const homeData = {
  allMarkdownRemark: {
    edges: [
      {
        node: {
          id: "aaa111",
          excerpt: "excerpt for first article",
          fields: {
            slug: "/blog/some-slug",
          },
          frontmatter: {
            category: "Rails",
            date: "July 2021",
            title: "First Title",
          },
        },
      },
      {
        node: {
          id: "bbb222",
          excerpt: "excerpt for second article",
          fields: {
            slug: "/blog/some-other-slug",
          },
          frontmatter: {
            category: "Docker",
            date: "August 2021",
            title: "Second Title",
          },
        },
      },
    ],
  },
}

describe("Home Page", () => {
  it("renders with layout, article list, and all-link", () => {
    const container = render(<Index data={homeData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()

    const articleLists = screen.queryAllByTestId("article-list-mini");
    expect(articleLists.length).toBe(2);
    expect(screen.getByTestId("footer")).toBeInTheDocument()

    expect(screen.getByText("Recent Posts")).toBeInTheDocument()
    expect(screen.getByText("Popular Posts")).toBeInTheDocument()
  })
})
