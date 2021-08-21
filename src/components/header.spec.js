import React from "react"
import renderer from "react-test-renderer"

import Header from "./header"
import NavMenu from "./nav-menu"

describe("Header", () => {
  it("renders correctly", () => {
    const testRenderer = renderer.create(<Header />)
    expect(testRenderer.toJSON()).toMatchSnapshot()

    const testInstance = testRenderer.root
    expect(testInstance.findByType(NavMenu)).toBeDefined()
  })
})
