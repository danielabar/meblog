/**
 * @jest-environment jsdom
 */

import dotenv from "dotenv"
dotenv.config({ path: `.env.test` })
import fs from "fs"

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import NavMenu from "./nav-menu"

describe("NavMenu", () => {
  it("renders search input when SEARCH_ENABLED env var is true", () => {
    const container = render(<NavMenu />)
    expect(container).toMatchSnapshot()

    expect(screen.queryByTestId("search-input")).toBeInTheDocument()
  })

  it("does not render search input when SEARCH_ENABLED env var is false", () => {
    const envConfig = dotenv.parse(fs.readFileSync(".env.search_disabled"))
    for (const k in envConfig) {
      process.env[k] = envConfig[k]
    }

    render(<NavMenu />)
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument()
  })
})
