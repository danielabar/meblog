/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import useViewport from "../hooks/useviewport"
import Header from "./header"

let mockWidth = 1024
jest.mock("../hooks/useviewport", () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: mockWidth })),
}))

describe("Header", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders nav menu for wide widths", () => {
    mockWidth = 900
    const container = render(<Header />)

    expect(container).toMatchSnapshot()
    expect(screen.getByTestId("nav-menu")).toBeInTheDocument
    expect(useViewport).toHaveBeenCalled();
  })

  it("renders nav menu responsive for narrow widths", () => {
    mockWidth = 400
    const container = render(<Header />)

    expect(container).toMatchSnapshot()
    expect(screen.getByTestId("nav-menu-responsive")).toBeInTheDocument
    expect(useViewport).toHaveBeenCalled();
  })
})
