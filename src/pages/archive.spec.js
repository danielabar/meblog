import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("../components/SEO", () => ({
  __esModule: true,
  default: () => <div />,
}))

import Archive from "./archive"

const postNode = (slug, title, date, category = "rails") => ({
  fields: { slug: `/blog/${slug}/` },
  frontmatter: { title, date, category },
})

const data = {
  allMarkdownRemark: {
    nodes: [
      postNode("recent-1", "Recent One", "2026-05-02"),
      postNode("recent-2", "Recent Two", "2026-01-10", "productivity"),
      postNode("older-1", "Older One", "2024-08-04"),
      postNode("oldest", "Oldest", "2019-12-15", "terminal"),
    ],
  },
}

describe("Archive page", () => {
  it("renders page shell with title, meta, header, footer", () => {
    const { container } = render(<Archive data={data} />)
    expect(container).toMatchSnapshot()
    expect(screen.getByRole("heading", { level: 1, name: "Archive" })).toBeInTheDocument()
    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })

  it("renders one row per post", () => {
    render(<Archive data={data} />)
    expect(screen.getByText("Recent One")).toBeInTheDocument()
    expect(screen.getByText("Oldest")).toBeInTheDocument()
  })

  it("groups posts by year, newest first", () => {
    render(<Archive data={data} />)
    const sections = screen.getAllByTestId("year-group")
    expect(sections.map(s => s.id)).toEqual(["y2026", "y2024", "y2019"])
  })

  it("derives meta line from posts", () => {
    render(<Archive data={data} />)
    expect(screen.getByText(/4 posts · 2019 → 2026/)).toBeInTheDocument()
  })

  it("renders each post as a row inside its year section", () => {
    render(<Archive data={data} />)
    const rows = screen.getAllByTestId("archive-row")
    expect(rows).toHaveLength(4)
    expect(rows[0]).toHaveTextContent("Recent One")
    expect(rows[0]).toHaveTextContent("2026-05-02")
    expect(rows[0]).toHaveTextContent("rails")
  })
})
