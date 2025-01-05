import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Learning from "./learning"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

const courseData = {
  allMarkdownRemark: {
    totalCount: 1,
    edges: [
      {
        node: {
          id: "aaa111",
          frontmatter: {
            category: "Linux",
            completed_date: "2023-03-31",
            description: "Course description blah blah",
            featuredImage: {
              childImageSharp: {
                gatsbyImageData: {
                  layout: "constrained",
                  backgroundColor: "#282838",
                  images: {
                    fallback: {
                      src: "/static/abc123/5a159/bash.jpg",
                      srcSet:
                        "/static/abc123/ba115/bash.jpg 63w,\n/static/abc123/1a003/bash.jpg 125w,\n/static/abc123/5a159/bash.jpg 250w,\n/static/abc123/d3119/bash.jpg 500w",
                      sizes: "(min-width: 250px) 250px, 100vw",
                    },
                    sources: [
                      {
                        srcSet:
                          "/static/abc123/a6e40/bash.webp 63w,\n/static/abc123/46142/bash.webp 125w,\n/static/abc123/2cd09/bash.webp 250w,\n/static/abc123/cd07d/bash.webp 500w",
                        type: "image/webp",
                        sizes: "(min-width: 250px) 250px, 100vw",
                      },
                    ],
                  },
                  width: 250,
                  height: 140,
                },
              },
            },
            instructor: "John Doe",
            notes: "https://github.com/danielabar/bash-zsh-syntax-pluralsight",
            platform: "Pluralsight",
            title: "Mastering Bash and Z Shell Scripting Syntax",
          },
        },
      },
    ],
  },
}

describe("Learning Page", () => {
  it("renders", () => {
    const container = render(<Learning data={courseData} />)
    expect(container).toMatchSnapshot()
    expect(screen.getByTestId("learning")).toBeInTheDocument()
  })
})
