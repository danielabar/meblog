import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ArtifactsBadge from "./artifacts-badge"

describe("ArtifactsBadge", () => {
  it("Renders singular label and anchor link for one artifact", () => {
    render(<ArtifactsBadge artifacts={[{ slug: "x", title: "X" }]} />)
    const link = screen.getByRole("link", {
      name: /Visual explainer available/,
    })
    expect(link).toHaveAttribute("href", "#visual-explainers")
  })

  it("Renders plural label for multiple artifacts", () => {
    render(
      <ArtifactsBadge
        artifacts={[
          { slug: "x", title: "X" },
          { slug: "y", title: "Y" },
        ]}
      />
    )
    expect(
      screen.getByRole("link", { name: /2 visual explainers available/ })
    ).toBeInTheDocument()
  })

  it("Renders nothing when there are no artifacts", () => {
    render(<ArtifactsBadge artifacts={[]} />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("Renders nothing when artifacts is undefined", () => {
    render(<ArtifactsBadge />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
