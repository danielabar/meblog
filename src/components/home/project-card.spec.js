import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ProjectCard from "./project-card"

describe("ProjectCard", () => {
  it("renders name, description, lang(s), and year inside an external link", () => {
    render(
      <ProjectCard
        name="meal_composer"
        url="https://github.com/danielabar/meal_composer"
        description="Rails app that generates meal plans."
        langs={["Ruby"]}
        year={2025}
      />
    )

    expect(screen.getByText("meal_composer")).toBeInTheDocument()
    expect(screen.getByText("Rails app that generates meal plans.")).toBeInTheDocument()
    expect(screen.getByText("Ruby")).toBeInTheDocument()
    expect(screen.getByText("2025")).toBeInTheDocument()

    const link = screen.getByTestId("project-card")
    expect(link.tagName.toLowerCase()).toBe("a")
    expect(link).toHaveAttribute("href", "https://github.com/danielabar/meal_composer")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("joins multiple langs with a dot separator", () => {
    render(
      <ProjectCard
        name="multi"
        url="https://example.com/x"
        description="x"
        langs={["JS", "TS"]}
        year={2024}
      />
    )

    expect(screen.getByText("JS · TS")).toBeInTheDocument()
  })
})
