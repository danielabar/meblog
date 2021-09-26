import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import NavMenuResponsive from "./nav-menu-responsive"

describe("NavMenuResponsive", () => {
  it("renders closed by default", () => {
    const container = render(<NavMenuResponsive />)
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("nav-menu-responsive-menu")).toHaveTextContent(
      "menu"
    )
    expect(
      screen.queryByTestId("nav-menu-responsive-close")
    ).not.toBeInTheDocument()
  })

  it("opens", () => {
    const container = render(<NavMenuResponsive />)
    fireEvent.click(screen.getByTestId("nav-menu-responsive-menu"))
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("nav-menu-responsive-close")).toHaveTextContent(
      "close"
    )
    expect(
      screen.queryByTestId("nav-menu-responsive-menu")
    ).not.toBeInTheDocument()
  })

  it("closes after being opened", () => {
    render(<NavMenuResponsive />)
    fireEvent.click(screen.getByTestId("nav-menu-responsive-menu"))
    fireEvent.click(screen.getByTestId("nav-menu-responsive-close"))

    expect(screen.getByTestId("nav-menu-responsive-menu")).toHaveTextContent(
      "menu"
    )
    expect(
      screen.queryByTestId("nav-menu-responsive-close")
    ).not.toBeInTheDocument()
  })
})
