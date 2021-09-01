/**
 * @jest-environment jsdom
 */

import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import Footer from "./footer"

describe("Footer", () => {
  it("renders correctly", () => {
    const container = render(<Footer />)
    expect(container).toMatchSnapshot()
  })
})
