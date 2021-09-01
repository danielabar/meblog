/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import About from "./about"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

describe("About Page", () => {
  it("renders with layout and all-link", () => {
    const container = render(<About />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(screen.getByTestId("all-wrapper")).toBeInTheDocument()
  })
})
