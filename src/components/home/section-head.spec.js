import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import SectionHead from "./section-head"

describe("SectionHead", () => {
  it("renders the title as an h2 and an internal Link", () => {
    render(
      <SectionHead title="Recent" linkText="all writing →" linkTo="/blog" />
    )

    const heading = screen.getByRole("heading", { level: 2, name: "Recent" })
    expect(heading).toBeInTheDocument()

    const link = screen.getByRole("link", { name: "all writing →" })
    expect(link).toHaveAttribute("href", "/blog")
    expect(link).not.toHaveAttribute("target")
  })

  it("renders an external anchor when external prop is set", () => {
    render(
      <SectionHead
        title="Side projects"
        linkText="all repos →"
        linkTo="https://github.com/danielabar"
        external
      />
    )

    const link = screen.getByRole("link", { name: "all repos →" })
    expect(link).toHaveAttribute("href", "https://github.com/danielabar")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})
