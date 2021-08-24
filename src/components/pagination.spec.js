/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
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
  })

  it("renders middle page", () => {
    const container = render(
      <Pagination
        isFirst={false}
        prevPage={"/blog/3"}
        isLast={false}
        nextPage={"/blog/4"}
      />
    )
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("previous-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).not.toBeInTheDocument()
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
