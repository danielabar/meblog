import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ArtifactsList from "./artifacts-list"

describe("ArtifactsList", () => {
  it("Renders a link per artifact under the post slug", () => {
    render(
      <ArtifactsList
        postSlug="/blog/what-i-want-for-my-birthday"
        artifacts={[
          { slug: "metabolic-theory-eli5", title: "Cancer's Power Plants" },
        ]}
      />
    )
    const link = screen.getByRole("link", { name: "Cancer's Power Plants" })
    expect(link).toHaveAttribute(
      "href",
      "/blog/what-i-want-for-my-birthday/metabolic-theory-eli5"
    )
  })

  it("Renders with an id for anchor linking", () => {
    render(
      <ArtifactsList
        postSlug="/blog/what-i-want-for-my-birthday"
        artifacts={[
          { slug: "metabolic-theory-eli5", title: "Cancer's Power Plants" },
        ]}
      />
    )
    expect(screen.getByTestId("artifacts-list")).toHaveAttribute(
      "id",
      "visual-explainers"
    )
  })

  it("Renders nothing when there are no artifacts", () => {
    render(<ArtifactsList postSlug="/blog/some-post" artifacts={[]} />)
    expect(screen.queryByTestId("artifacts-list")).not.toBeInTheDocument()
  })

  it("Renders nothing when artifacts is undefined", () => {
    render(<ArtifactsList postSlug="/blog/some-post" />)
    expect(screen.queryByTestId("artifacts-list")).not.toBeInTheDocument()
  })
})
