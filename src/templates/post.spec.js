import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Post from "./post"

jest.mock("../components/SEO", () => {
  return {
    __esModule: true,
    default: () => {
      return <div></div>
    },
  }
})

describe("Post", () => {
  it("Renders in layout", () => {
    const postData = {
      markdownRemark: {
        fields: {
          slug: "/blog/some-slug",
        },
        frontmatter: {
          date: "14 Aug 2021",
          description: "This is a description",
          title: "This is the title",
          featuredImage: {
            childImageSharp: {
              "gatsbyImageData": {
                "layout": "constrained",
                "backgroundColor": "#080808",
                "images": {
                  "fallback": {
                    "src": "/static/41cac534f5048f26531ee516516637b1/d0b9c/python-interview-question.jpg",
                    "srcSet": "/static/41cac534f5048f26531ee516516637b1/90ed1/python-interview-question.jpg 200w,\n/static/41cac534f5048f26531ee516516637b1/2070e/python-interview-question.jpg 400w,\n/static/41cac534f5048f26531ee516516637b1/d0b9c/python-interview-question.jpg 800w",
                    "sizes": "(min-width: 800px) 800px, 100vw"
                  },
                  "sources": [
                    {
                      "srcSet": "/static/41cac534f5048f26531ee516516637b1/b5535/python-interview-question.webp 200w,\n/static/41cac534f5048f26531ee516516637b1/f5c71/python-interview-question.webp 400w,\n/static/41cac534f5048f26531ee516516637b1/0d27e/python-interview-question.webp 800w",
                      "type": "image/webp",
                      "sizes": "(min-width: 800px) 800px, 100vw"
                    }
                  ]
                },
                "width": 800,
                "height": 600
              }
            },
          },
        },
        html:
          "<p>Here is the first paragraph</p><h2>Sub Heading</h2><p>And another paragraph</p>",
      },
    }
    const container = render(<Post data={postData} />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })
})
