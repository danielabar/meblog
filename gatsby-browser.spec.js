import { shouldUpdateScroll } from "./gatsby-browser"

describe("shouldUpdateScroll", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn()
    document.documentElement.style.scrollBehavior = ""
  })

  it("scrolls to top instantly on a real route change", () => {
    const result = shouldUpdateScroll({
      routerProps: { location: { pathname: "/blog/post/artifact" } },
      prevRouterProps: { location: { pathname: "/blog/post" } },
    })

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.documentElement.style.scrollBehavior).toBe("auto")
    expect(result).toBe(false)
  })

  it("restores smooth scroll-behavior after the jump", async () => {
    shouldUpdateScroll({
      routerProps: { location: { pathname: "/blog/post/artifact" } },
      prevRouterProps: { location: { pathname: "/blog/post" } },
    })

    await new Promise(resolve => requestAnimationFrame(resolve))

    expect(document.documentElement.style.scrollBehavior).toBe("")
  })

  it("does nothing and defers to default (smooth) scroll on same-page hash navigation", () => {
    const result = shouldUpdateScroll({
      routerProps: {
        location: { pathname: "/blog/post", hash: "#visual-explainers" },
      },
      prevRouterProps: {
        location: { pathname: "/blog/post", hash: "" },
      },
    })

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it("treats the very first page load (no prevRouterProps) as a new page", () => {
    const result = shouldUpdateScroll({
      routerProps: { location: { pathname: "/blog/post" } },
      prevRouterProps: undefined,
    })

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(result).toBe(false)
  })
})
