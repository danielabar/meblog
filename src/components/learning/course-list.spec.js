import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import CourseList from "./course-list"

describe("CourseList", () => {
  it("renders correctly", () => {
    const testData = [
      {
        node: {
          id: "aaa111",
          frontmatter: {
            title: "First Course",
            instructor: "Jane Smith",
            platform: "Pluralsight",
            description: "First course description.",
            completed_date: "2023-01-30",
            category: "linux",
            notes: "https://github.com/danielabar/first-course-notes",
            featuredImage: {
              childImageSharp: {
                gatsbyImageData: {
                  layout: "constrained",
                  backgroundColor: "#282838",
                  images: {
                    fallback: {
                      src:
                        "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/5a159/first.jpg",
                      srcSet:
                        "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/ba115/first.jpg 63w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/1a003/first.jpg 125w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/5a159/first.jpg 250w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/d3119/first.jpg 500w",
                      sizes: "(min-width: 250px) 250px, 100vw",
                    },
                    sources: [
                      {
                        srcSet:
                          "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/a6e40/first.webp 63w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/46142/first.webp 125w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/2cd09/first.webp 250w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/cd07d/first.webp 500w",
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
          },
        },
      },
      {
        node: {
          id: "bbb222",
          frontmatter: {
            title: "Second Course",
            instructor: "John Doe",
            platform: "Pluralsight",
            description: "Second course description.",
            completed_date: "2023-02-15",
            category: "linux",
            notes: "https://github.com/danielabar/second-course-notes",
            featuredImage: {
              childImageSharp: {
                gatsbyImageData: {
                  layout: "constrained",
                  backgroundColor: "#282838",
                  images: {
                    fallback: {
                      src:
                        "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/5a159/second.jpg",
                      srcSet:
                        "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/ba115/second.jpg 63w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/1a003/second.jpg 125w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/5a159/second.jpg 250w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/d3119/second.jpg 500w",
                      sizes: "(min-width: 250px) 250px, 100vw",
                    },
                    sources: [
                      {
                        srcSet:
                          "/static/cbe2b0c79bd67130cd7e09f0c59bb65b/a6e40/second.webp 63w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/46142/second.webp 125w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/2cd09/second.webp 250w,\n/static/cbe2b0c79bd67130cd7e09f0c59bb65b/cd07d/first.webp 500w",
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
          },
        },
      },
    ]

    const container = render(<CourseList courses={testData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByText("First Course")).toBeInTheDocument()
    expect(screen.getByText("Second Course")).toBeInTheDocument()
  })
})
