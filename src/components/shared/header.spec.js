import React from "react"
import { render, screen } from "@testing-library/react"
import Header from "./header"

describe("Header", () => {
  it("renders correctly", () => {
    const container = render(<Header />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Daniela Baron")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /blog/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /learning/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument()
  })
})
