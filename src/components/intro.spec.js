/**
 * @jest-environment jsdom
 */

import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"

import Intro from "./intro"

describe("Intro", () => {
  it("renders correctly", () => {
    const container = render(<Intro />)
    expect(container).toMatchSnapshot()
  })
})
