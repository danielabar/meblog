import React from "react"
import renderer from "react-test-renderer"

import AllLink from "./all-link"
import { Link } from "gatsby"

describe("AllLink", () => {
  it("renders correctly", () => {
    const testRenderer = renderer.create(<AllLink marginTop="30px"/>);
    expect(testRenderer.toJSON()).toMatchSnapshot()

    const testInstance = testRenderer.root;
    expect(testInstance.findByType(Link)).toBeDefined();
  })
})