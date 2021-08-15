import React from "react"
import renderer from "react-test-renderer"

import Header from "./header"

describe("Header", () => {
  it("renders correctly", () => {
    const tree = renderer
      .create(<Header />)
      .toJSON()
    expect(tree).toMatchSnapshot()

    // const root = tree.root
    // expect(root.findByType(NavMenu)).toBe('bar');
  })
})