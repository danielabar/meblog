/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Layout from "./layout"

describe("Layout", () => {
  it("renders correctly", () => {
    const container = render(
      <Layout>
        <div data-testid="test-content">test content</div>
      </Layout>
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })
})
