import React from "react"
import { render, screen } from "@testing-library/react"
import Hero from "./hero"

describe("Hero", () => {
  it("renders correctly", () => {
    const container = render(<Hero />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("15+")).toBeInTheDocument()
    expect(screen.getByText("Years Building Software")).toBeInTheDocument()
    expect(screen.getByText(/Rails, PostgreSQL, and full-stack development/i)).toBeInTheDocument()
  })
})
