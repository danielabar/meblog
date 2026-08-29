import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Artifact from "./artifact"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => <div></div>,
  }
})

describe("Artifact", () => {
  it("Renders in layout with back link, credit, and iframe", () => {
    const pageContext = {
      slug: "/blog/what-i-want-for-my-birthday/metabolic-theory-eli5",
      title: "Cancer's Power Plants: The Metabolic Theory, Explained Simply",
      file: "metabolic-theory-eli5.html",
      creditText: "eli5 skill",
      creditUrl:
        "https://github.com/anthropics/claude-plugins-community/tree/main/eli5",
      postSlug: "/blog/what-i-want-for-my-birthday",
      postTitle: "What I Want for My Birthday",
    }
    const container = render(<Artifact pageContext={pageContext} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(
      screen.getByText(/Back to What I Want for My Birthday/)
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "eli5 skill" })).toHaveAttribute(
      "href",
      pageContext.creditUrl
    )
    const iframe = screen.getByTitle(pageContext.title)
    expect(iframe).toHaveAttribute(
      "src",
      "/artifacts/metabolic-theory-eli5.html"
    )
  })
})
