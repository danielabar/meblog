import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"

import Article from "./article"

describe("Article", () => {
  it("renders correctly", () => {
    const container = render(
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
    expect(container).toMatchSnapshot()
  })
})
