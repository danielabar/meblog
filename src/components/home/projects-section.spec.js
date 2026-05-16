import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import ProjectsSection from "./projects-section"

const fixtureProject = (name, year = 2025) => ({
  name,
  url: `https://github.com/danielabar/${name}`,
  description: `A description of ${name}.`,
  langs: ["Ruby"],
  year,
})

describe("ProjectsSection", () => {
  it("renders the section head and one card per project", () => {
    const projects = [
      fixtureProject("a"),
      fixtureProject("b"),
      fixtureProject("c"),
      fixtureProject("d"),
      fixtureProject("e"),
      fixtureProject("f"),
    ]

    render(<ProjectsSection projects={projects} />)

    expect(screen.getByRole("heading", { level: 2, name: "Side projects" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "all repos →" })).toBeInTheDocument()
    expect(screen.getAllByTestId("project-card")).toHaveLength(6)
  })

  it("caps render to 6 projects even when more are passed", () => {
    const projects = Array.from({ length: 9 }, (_, i) => fixtureProject(`p${i}`))

    render(<ProjectsSection projects={projects} />)

    expect(screen.getAllByTestId("project-card")).toHaveLength(6)
  })
})
