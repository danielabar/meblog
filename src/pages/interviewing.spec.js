import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Interviewing from "./interviewing"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

const mockData = {
  markdownRemark: {
    html: "<p>Test content</p>",
    tableOfContents:
      '<ul><li><a href="#professional-work">Professional Work</a></li></ul>',
  },
}

describe("Interviewing Page", () => {
  it("renders with layout and page content", () => {
    const container = render(<Interviewing data={mockData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(screen.getByText("On Technical Assessments")).toBeInTheDocument()
    expect(
      screen.getByText("A letter to recruiters & hiring managers")
    ).toBeInTheDocument()
  })
})
