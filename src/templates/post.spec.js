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
              fluid: {
                aspectRatio: 1.5,
                base64:
                  "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCAANABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEAv/EABQBAQAAAAAAAAAAAAAAAAAAAAL/2gAMAwEAAhADEAAAAbLMIDWWDH//xAAZEAEAAwEBAAAAAAAAAAAAAAACAQMRAAT/2gAIAQEAAQUCpsaSickW9kCvzrTvf//EABcRAQADAAAAAAAAAAAAAAAAAAECEBL/2gAIAQMBAT8BBY6r/8QAFhEBAQEAAAAAAAAAAAAAAAAAARBB/9oACAECAQE/ARyf/8QAGRAAAgMBAAAAAAAAAAAAAAAAASEAEBFh/9oACAEBAAY/Am4qOQ8Nf//EABoQAQADAQEBAAAAAAAAAAAAAAEAESFBMWH/2gAIAQEAAT8hpQR3PIinUa418GNExwsHc//aAAwDAQACAAMAAAAQ29//xAAXEQADAQAAAAAAAAAAAAAAAAAAAREx/9oACAEDAQE/EGjMKz//xAAXEQEBAQEAAAAAAAAAAAAAAAABACFB/9oACAECAQE/EEEfbL//xAAbEAEAAwEAAwAAAAAAAAAAAAABABEhMUFRcf/aAAgBAQABPxAYh+A+WMOmHaonHkABgQjqKXXdzsT9cBX2Rjif/9k=",
                sizes: "(max-width: 800px) 100vw, 800px",
                src:
                  "/static/69f6b56407e655dd690ba4b363161733/14b42/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg",
                srcSet:
                  "/static/69f6b56407e655dd690ba4b363161733/f836f/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg 200w, /static/69f6b56407e655dd690ba4b363161733/2244e/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg 400w, /static/69f6b56407e655dd690ba4b363161733/14b42/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg 800w, /static/69f6b56407e655dd690ba4b363161733/a7715/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg 1000w",
              },
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
