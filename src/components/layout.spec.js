import React from "react"
import renderer from "react-test-renderer"

import Layout from "./layout"

describe("Layout", () => {
  it("renders correctly", () => {
    const testRenderer = renderer.create(
      <Layout>
        <div className="data-test-1">test content</div>
      </Layout>
    )
    expect(testRenderer.toJSON()).toMatchSnapshot()

    const testInstance = testRenderer.root
    expect(
      testInstance.findByProps({ className: "data-test-1" }).children
    ).toEqual(["test content"])
  })
})
