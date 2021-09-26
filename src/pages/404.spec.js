import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Four04 from "./404"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

describe("404 Page", () => {
  it("renders with layout and all-link", () => {
    const container = render(<Four04 />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(screen.getByTestId("all-wrapper")).toBeInTheDocument()
  })
})
