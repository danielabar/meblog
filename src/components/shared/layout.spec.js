import React from "react"
import { render, screen } from "@testing-library/react"
import Layout from "./layout"

describe("Layout", () => {
  it("renders correctly with children", () => {
    const container = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByText("Test Content")).toBeInTheDocument()
    // Header should be present
    expect(screen.getByText("Daniela Baron")).toBeInTheDocument()
    // Footer should be present
    expect(screen.getByText(/© 2026 Daniela Baron/i)).toBeInTheDocument()
  })
})
