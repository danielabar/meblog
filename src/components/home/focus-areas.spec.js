import React from "react"
import { render, screen } from "@testing-library/react"
import FocusAreas from "./focus-areas"

describe("FocusAreas", () => {
  it("renders correctly", () => {
    const container = render(<FocusAreas />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Areas of Focus")).toBeInTheDocument()
    expect(screen.getByText("Full-Stack Development")).toBeInTheDocument()
    expect(screen.getByText("Team Effectiveness")).toBeInTheDocument()
    expect(screen.getByText("AI-Assisted Development")).toBeInTheDocument()
  })
})
