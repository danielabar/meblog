import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Pagination from "./pagination"

describe("Pagination", () => {
  it("renders first page", () => {
    const container = render(
      <Pagination
        isFirst={true}
        prevPage={"/blog/0"}
        isLast={false}
        nextPage={"/blog/2"}
      />
    )
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("previous-enabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).not.toBeInTheDocument()

    expect(
      document
        .querySelector("[data-testid='next-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/2")
  })

  it("renders middle page", () => {
    const container = render(
      <Pagination
        isFirst={false}
        prevPage={"/blog/3"}
        isLast={false}
        nextPage={"/blog/5"}
      />
    )
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("previous-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).not.toBeInTheDocument()

    expect(
      document
        .querySelector("[data-testid='previous-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/3")
    expect(
      document
        .querySelector("[data-testid='next-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/5")
  })

  it("renders last page", () => {
    const container = render(
      <Pagination
        isFirst={false}
        prevPage={"/blog/7"}
        isLast={true}
        nextPage={"/blog/9"}
      />
    )
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("previous-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).toBeInTheDocument()

    expect(
      document
        .querySelector("[data-testid='previous-enabled'] a")
        .getAttribute("href")
    ).toEqual("/blog/7")
  })

  it("renders a single page", () => {
    const container = render(
      <Pagination
        isFirst={true}
        prevPage={"/blog/0"}
        isLast={true}
        nextPage={"/blog/2"}
      />
    )
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("previous-enabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).toBeInTheDocument()
  })
})
