import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Intro from "./intro"

describe("Learning Intro", () => {
  it("renders correctly", () => {
    const container = render(<Intro />)
    expect(container).toMatchSnapshot()
    expect(screen.queryByTestId("learning-intro")).toBeInTheDocument()
  })
})
