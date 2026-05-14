import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("gatsby-plugin-image", () => ({
  GatsbyImage: ({ alt }) => <img data-testid="gatsby-image" alt={alt} />,
  getImage: img => (img && img.childImageSharp ? img.childImageSharp.gatsbyImageData : null),
}))

import PostsSection from "./posts-section"

const fixturePost = (id, title) => ({
  fields: { slug: `/blog/${id}/` },
  excerpt: "exc",
  frontmatter: {
    title,
    date: "April 18, 2026",
    category: "rails",
    description: "desc",
    featuredImage: {
      childImageSharp: { gatsbyImageData: { layout: "constrained" } },
    },
  },
})

describe("PostsSection", () => {
  it("renders the section head and one card per post", () => {
    const posts = [
      fixturePost("a", "Post A"),
      fixturePost("b", "Post B"),
      fixturePost("c", "Post C"),
    ]

    render(
      <PostsSection
        title="Recent"
        linkText="all writing →"
        linkTo="/blog"
        posts={posts}
      />
    )

    expect(screen.getByRole("heading", { level: 2, name: "Recent" })).toBeInTheDocument()
    expect(screen.getByText("all writing →")).toBeInTheDocument()
    expect(screen.getAllByTestId("post-card")).toHaveLength(3)
    expect(screen.getByText("Post A")).toBeInTheDocument()
    expect(screen.getByText("Post C")).toBeInTheDocument()
  })
})
