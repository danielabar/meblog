import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"

import Course from "./course"

describe("Course", () => {
  const featImg = {
    childImageSharp: {
      gatsbyImageData: {
        layout: "constrained",
        backgroundColor: "#282838",
        images: {
            fallback: {
              src: "/static/abc123/5a159/js.jpg",
              srcSet: "/static/abc123/ba115/js.jpg 63w,\n/static/abc123/1a003/js.jpg 125w,\n/static/abc123/5a159/js.jpg 250w,\n/static/abc123/d3119/js.jpg 500w",
              sizes: "(min-width: 250px) 250px, 100vw"
            },
            sources: [
              {
                srcSet: "/static/abc123/a6e40/js.webp 63w,\n/static/abc123/46142/js.webp 125w,\n/static/abc123/2cd09/js.webp 250w,\n/static/abc123/cd07d/js.webp 500w",
                type: "image/webp",
                sizes: "(min-width: 250px) 250px, 100vw"
              }
            ]
        },
        width: 250,
        height: 140
      }
    }
  }

  it("renders correctly", () => {
    const container = render(
      <Course
        key="123abc"
        id="123abc"
        title="The JavaScript Course"
        platform="Pluralsight"
        instructor="John Doe"
        description="Course description blah blah"
        completed_date="2022-01-30"
        category="javascript"
        notes="https://github.com/danielabar/some_course_notes"
        featuredImage={featImg}
      />
    )
    expect(container).toMatchSnapshot()
  })

  it("generates link to course notes", () => {
    render(
      <Course
        key="123abc"
        id="123abc"
        title="The JavaScript Course"
        platform="Pluralsight"
        instructor="John Doe"
        description="Course description blah blah"
        completed_date="2022-01-30"
        category="javascript"
        notes="https://github.com/danielabar/some_course_notes"
        featuredImage={featImg}
      />
    )

    const notesLink = document.querySelector("[data-testid='course-notes-link']")

    expect(notesLink.getAttribute("href")).toEqual("https://github.com/danielabar/some_course_notes")
    expect(notesLink.getAttribute("rel")).toEqual("noopener noreferrer")
  })
})
