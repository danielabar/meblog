import React from "react"
import renderer from "react-test-renderer"

import Article from "./article"

describe("Article", () => {
  it("renders correctly", () => {
    const testRenderer = renderer.create(
      <Article
        key="123abc"
        id="123abc"
        to="/blog/some-article"
        title="Some Article"
        category="Rails"
        date="August 2021"
        excerpt="First sentence of the article blah blah blah..."
      />
    )
    expect(testRenderer.toJSON()).toMatchSnapshot()
  })
})
