import React from "react"
import { render, screen } from "@testing-library/react"
import Header from "./header"

describe("Header", () => {
  const originalSearchEnabled = process.env.SEARCH_ENABLED

  afterEach(() => {
    if (originalSearchEnabled === undefined) {
      delete process.env.SEARCH_ENABLED
    } else {
      process.env.SEARCH_ENABLED = originalSearchEnabled
    }
  })

  it("renders the logo and primary nav links", () => {
    delete process.env.SEARCH_ENABLED

    const container = render(<Header />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Daniela Baron")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /blog/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /learning/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument()
  })

  it("hides the search input by default", () => {
    delete process.env.SEARCH_ENABLED

    render(<Header />)
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument()
  })

  it("renders the search input when SEARCH_ENABLED is 'true'", () => {
    process.env.SEARCH_ENABLED = "true"

    render(<Header />)
    expect(screen.getByTestId("search-input")).toBeInTheDocument()
  })
})
