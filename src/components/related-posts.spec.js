import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"

import RelatedPosts from "./related-posts"

describe("RelatedPosts", () => {
  it("Renders a card for each post", () => {
    const related = {
      edges: [
        {
          node: {
            id: "nodeid1",
            fields: {
              slug: "/blog/related-post-1/",
            },
            frontmatter: {
              title: "Related Post 1",
              featuredImage: {
                childImageSharp: {
                  gatsbyImageData: {
                    BackgroundColor: "#d8c8d8",
                    height: 600,
                    images: {
                      fallback: {
                        src:
                          "/static/41cac534f5048f26531ee516516637b1/d0b9c/prelated-post-1-image.jpg",
                        srcSet:
                          "/static/41cac534f5048f26531ee516516637b1/90ed1/prelated-post-1-image.jpg 200w,\n/static/41cac534f5048f26531ee516516637b1/2070e/prelated-post-1-image.jpg 400w,\n/static/41cac534f5048f26531ee516516637b1/d0b9c/prelated-post-1-image.jpg 800w",
                        sizes: "(min-width: 800px) 800px, 100vw",
                      },
                      sources: [
                        {
                          srcSet:
                            "/static/41cac534f5048f26531ee516516637b1/b5535/prelated-post-1-image.webp 200w,\n/static/41cac534f5048f26531ee516516637b1/f5c71/prelated-post-1-image.webp 400w,\n/static/41cac534f5048f26531ee516516637b1/0d27e/prelated-post-1-image.webp 800w",
                          type: "image/webp",
                          sizes: "(min-width: 800px) 800px, 100vw",
                        },
                      ],
                    },
                    layout: "constrained",
                    width: 800,
                  },
                },
              },
            },
          },
        },
        {
          node: {
            id: "nodeid2",
            fields: {
              slug: "/blog/related-post-2/",
            },
            frontmatter: {
              title: "Related Post 2",
              featuredImage: {
                childImageSharp: {
                  gatsbyImageData: {
                    BackgroundColor: "#d8c8d8",
                    height: 600,
                    images: {
                      fallback: {
                        src:
                          "/static/41cac534f5048f26531ee516516637b1/d0b9c/prelated-post-2-image.jpg",
                        srcSet:
                          "/static/41cac534f5048f26531ee516516637b1/90ed1/prelated-post-2-image.jpg 200w,\n/static/41cac534f5048f26531ee516516637b1/2070e/prelated-post-2-image.jpg 400w,\n/static/41cac534f5048f26531ee516516637b1/d0b9c/prelated-post-2-image.jpg 800w",
                        sizes: "(min-width: 800px) 800px, 100vw",
                      },
                      sources: [
                        {
                          srcSet:
                            "/static/41cac534f5048f26531ee516516637b1/b5535/prelated-post-2-image.webp 200w,\n/static/41cac534f5048f26531ee516516637b1/f5c71/prelated-post-2-image.webp 400w,\n/static/41cac534f5048f26531ee516516637b1/0d27e/prelated-post-2-image.webp 800w",
                          type: "image/webp",
                          sizes: "(min-width: 800px) 800px, 100vw",
                        },
                      ],
                    },
                    layout: "constrained",
                    width: 800,
                  },
                },
              },
            },
          },
        },
      ],
    }
    const container = render(<RelatedPosts related={related} />)
    expect(container).toMatchSnapshot()
  })
})
