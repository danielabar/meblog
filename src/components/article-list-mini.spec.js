import React from "react"
import { render, screen } from "@testing-library/react"
import ArticleListMini from "./article-list-mini"

describe("ArticleListMini", () => {
  const articles = [
    {
      node: {
        id: "1",
        title: "Article 1",
        published_at: "2024-04-10",
        slug: "/article-1",
      },
    },
    {
      node: {
        id: "2",
        title: "Article 2",
        published_at: "2024-04-09",
        slug: "/article-2",
      },
    },
  ]

  it("renders correctly", () => {
    const container = render(
      <ArticleListMini articles={articles} title="Recent Posts" />
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Recent Posts")).toBeInTheDocument()

    const articleTitles = screen.getAllByRole("link", { name: /article/i })
    expect(articleTitles.length).toBe(2)

    expect(screen.getByText("Article 1")).toBeInTheDocument()
    expect(screen.getByText("Article 2")).toBeInTheDocument()
  })
})
