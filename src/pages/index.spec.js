import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("../components/SEO", () => ({
  __esModule: true,
  default: () => <div />,
}))

jest.mock("gatsby-plugin-image", () => ({
  GatsbyImage: ({ alt }) => <img data-testid="gatsby-image" alt={alt} />,
  getImage: img => (img && img.childImageSharp ? img.childImageSharp.gatsbyImageData : null),
}))

import Index from "./index"

const postNode = (id, title, category = "Rails") => ({
  fields: { slug: `/blog/${id}/` },
  excerpt: "exc",
  frontmatter: {
    title,
    date: "April 18, 2026",
    category,
    description: `${title} description.`,
    featuredImage: {
      childImageSharp: { gatsbyImageData: { layout: "constrained" } },
    },
  },
})

const projectNode = (name, order) => ({
  frontmatter: {
    name,
    url: `https://github.com/danielabar/${name}`,
    description: `${name} desc.`,
    langs: ["Ruby"],
    year: 2025,
    order,
  },
})

const homeData = {
  recent: {
    nodes: [
      postNode("first", "First Title"),
      postNode("second", "Second Title", "Docker"),
      postNode("third", "Third Title", "Postgres"),
    ],
  },
  popular: {
    nodes: [
      { slug: "/blog/very-popular/", post: postNode("very-popular", "Very Popular Title") },
      { slug: "/blog/also-popular/", post: postNode("also-popular", "Also Popular Title") },
      { slug: "/blog/missing/", post: null },
    ],
  },
  projects: {
    nodes: [
      projectNode("proj-a", 1),
      projectNode("proj-b", 2),
    ],
  },
}

describe("Home Page", () => {
  it("renders hero, recent, popular, and projects sections", () => {
    const container = render(<Index data={homeData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
    expect(screen.getByTestId("hero")).toBeInTheDocument()

    expect(screen.getByRole("heading", { level: 2, name: "Recent" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Popular" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Side projects" })).toBeInTheDocument()
  })

  it("filters out popular entries whose post link is null", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {})

    render(<Index data={homeData} />)

    const popularSection = screen.getByRole("heading", { name: "Popular" }).closest("section")
    expect(popularSection).not.toBeNull()
    const popularCards = popularSection.querySelectorAll("[data-testid='post-card']")
    expect(popularCards).toHaveLength(2)

    console.warn.mockRestore()
  })
})
