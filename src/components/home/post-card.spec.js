import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("gatsby-plugin-image", () => ({
  GatsbyImage: ({ image, alt }) => (
    <img
      data-testid="gatsby-image"
      data-image={JSON.stringify(image)}
      alt={alt}
    />
  ),
  getImage: img =>
    img && img.childImageSharp ? img.childImageSharp.gatsbyImageData : null,
}))

import PostCard from "./post-card"

const fixturePost = ({
  description,
  excerpt = "Fallback excerpt copy.",
} = {}) => ({
  fields: { slug: "/blog/foo/" },
  excerpt,
  frontmatter: {
    title: "The Code-Adjacent Power of AI",
    date: "April 18, 2026",
    category: "productivity",
    description,
    featuredImage: {
      childImageSharp: {
        gatsbyImageData: { layout: "constrained", width: 280, height: 280 },
      },
    },
  },
})

describe("PostCard", () => {
  it("renders title, date, category, and description", () => {
    const post = fixturePost({ description: "The real description." })
    render(<PostCard post={post} />)

    expect(
      screen.getByText("The Code-Adjacent Power of AI")
    ).toBeInTheDocument()
    expect(screen.getByText("April 18, 2026")).toBeInTheDocument()
    expect(screen.getByText("productivity")).toBeInTheDocument()
    expect(screen.getByText("The real description.")).toBeInTheDocument()
  })

  it("falls back to excerpt when description is missing", () => {
    const post = fixturePost({ excerpt: "Fallback excerpt copy." })
    render(<PostCard post={post} />)

    expect(screen.getByText("Fallback excerpt copy.")).toBeInTheDocument()
  })

  it("renders a link to the post slug", () => {
    const post = fixturePost({ description: "x" })
    render(<PostCard post={post} />)

    const link = screen.getByTestId("post-card")
    expect(link.tagName.toLowerCase()).toBe("a")
    expect(link).toHaveAttribute("href", "/blog/foo/")
  })

  it("renders a GatsbyImage when featuredImage is present", () => {
    const post = fixturePost({ description: "x" })
    render(<PostCard post={post} />)

    expect(screen.getByTestId("gatsby-image")).toBeInTheDocument()
  })

  it("matches snapshot", () => {
    const post = fixturePost({ description: "Snap me." })
    const { container } = render(<PostCard post={post} />)
    expect(container).toMatchSnapshot()
  })
})
