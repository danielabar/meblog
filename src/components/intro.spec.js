import React from "react"
import renderer from "react-test-renderer"

import Intro from "./intro"

describe("Intro", () => {
  it("renders correctly", () => {
    const testRenderer = renderer.create(<Intro />);
    expect(testRenderer.toJSON()).toMatchSnapshot()
  })
})