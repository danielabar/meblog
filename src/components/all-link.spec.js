import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import AllLink from "./all-link"

describe("AllLink", () => {
  it("renders correctly", () => {
    const container = render(<AllLink marginTop="30px" />)
    expect(container).toMatchSnapshot()

    const div = screen.getByTestId("all-wrapper")
    expect(div).toHaveStyle("marginTop: 30px")
  })
})
