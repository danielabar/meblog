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

const homeData = {
  allMarkdownRemark: {
    edges: [
      {
        node: {
          id: "aaa111",
          fields: {
            slug: "/blog/some-slug",
          },
          frontmatter: {
            category: "Rails",
            date: "July 1, 2021",
            title: "First Title",
          },
        },
      },
      {
        node: {
          id: "bbb222",
          fields: {
            slug: "/blog/some-other-slug",
          },
          frontmatter: {
            category: "Docker",
            date: "August 1, 2021",
            title: "Second Title",
          },
        },
      },
    ],
  },
  popular: {
    edges: [
      {
        node: {
          id: "ccc333",
          title: "Very Popular Title",
          published_at: "January 2, 2022",
          slug: "/blog/very-popular/",
        },
      },
      {
        node: {
          id: "ddd444",
          title: "Also Popular Title",
          published_at: "February 3, 2022",
          slug: "/blog/also-popular/",
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

    const articleLists = screen.queryAllByTestId("article-list-mini")
    expect(articleLists.length).toBe(2)
    expect(screen.getByTestId("footer")).toBeInTheDocument()

    expect(screen.getByText("Recent Posts")).toBeInTheDocument()
    expect(screen.getByText("Popular Posts")).toBeInTheDocument()
  })
})
