import React from "react"
import { render, screen } from "@testing-library/react"
import Hero from "./hero"

describe("Hero", () => {
  it("renders correctly", () => {
    const container = render(<Hero />)
    expect(container).toMatchSnapshot()

    expect(
      screen.getByText(/Software that works, and writing about how it got that way\./i)
    ).toBeInTheDocument()
    expect(screen.getByText(/15\+ years of shipping/i)).toBeInTheDocument()
  })
})
