import React from "react"
import { render, screen } from "@testing-library/react"
import Footer from "./footer"

describe("Footer", () => {
  it("renders correctly", () => {
    const container = render(<Footer />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText(/© 2026 Daniela Baron/i)).toBeInTheDocument()
    expect(screen.getByText(/Writing software that works, scales, and remains clear to the next engineer/i)).toBeInTheDocument()
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument()
    expect(screen.getByLabelText("GitHub")).toBeInTheDocument()
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument()
  })
})
