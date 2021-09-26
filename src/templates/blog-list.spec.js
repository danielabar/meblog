import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import BlogList from "./blog-list"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

const listData = {
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

describe("Blog List", () => {
  it("Renders in layout with pagination set to second page", () => {
    const pageContext = {
      limit: 5,
      skip: 5,
      numPages: 8,
      currentPage: 2,
    }

    const container = render(
      <BlogList data={listData} pageContext={pageContext} />
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()

    expect(
      document
        .querySelector("[data-testid='previous-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog")
    expect(
      document
        .querySelector("[data-testid='next-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/3")
  })

  it("Renders in layout with pagination set to third page", () => {
    const pageContext = {
      limit: 5,
      skip: 5,
      numPages: 8,
      currentPage: 3,
    }

    const container = render(
      <BlogList data={listData} pageContext={pageContext} />
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()

    expect(
      document
        .querySelector("[data-testid='previous-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/2")
    expect(
      document
        .querySelector("[data-testid='next-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/4")
  })
})
