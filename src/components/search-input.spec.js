import React from "react"
import { navigate } from "gatsby"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import SearchInput from "./search-input"

describe("SearchInput", () => {
  it("renders", () => {
    const container = render(<SearchInput />)
    expect(container).toMatchSnapshot()
  })

  it("navigates to search results on Enter key press", async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    const inputEl = screen.getByTestId("search-input")
    user.clear(inputEl)
    await user.keyboard("Rails{enter}")

    expect(navigate).toHaveBeenCalledWith("/search-results/?q=Rails")
  })

  it("navigates to search results on Enter key press for a different term", async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    const inputEl = screen.getByTestId("search-input")
    user.clear(inputEl)
    await user.keyboard("docker{enter}")

    expect(navigate).toHaveBeenCalledWith("/search-results/?q=docker")
  })
})
