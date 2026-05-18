import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import YearRail from "./year-rail"

describe("YearRail", () => {
  const years = [
    { year: "2026", count: 10 },
    { year: "2025", count: 13 },
    { year: "2019", count: 1 },
  ]

  it("renders one link per year with the right href and count", () => {
    render(<YearRail years={years} />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute("href", "#y2026")
    expect(links[0]).toHaveTextContent("2026")
    expect(links[0]).toHaveTextContent("10")
    expect(links[2]).toHaveAttribute("href", "#y2019")
  })

  it("matches snapshot", () => {
    const { container } = render(<YearRail years={years} />)
    expect(container).toMatchSnapshot()
  })
})
