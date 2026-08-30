import "@fontsource/bai-jamjuree/300.css"
import "@fontsource/bai-jamjuree/400.css"
import "@fontsource/bai-jamjuree/400-italic.css"
import "@fontsource/bai-jamjuree/500.css"
import "@fontsource/bai-jamjuree/600.css"
import "@fontsource/bai-jamjuree/700.css"

import "./src/styles/reset.css"
import "./src/styles/global.css"
import "./src/styles/markdown.css"
import "./src/styles/rails_log.css"
import "./src/styles/course-categories.css"

export const shouldUpdateScroll = ({
  routerProps: { location },
  prevRouterProps,
}) => {
  const isNewPage =
    !prevRouterProps ||
    location.pathname !== prevRouterProps.location.pathname

  if (!isNewPage) {
    return true
  }

  const html = document.documentElement
  html.style.scrollBehavior = "auto"
  // Force a synchronous style/layout flush so "auto" is committed before
  // scrollTo runs below — otherwise the browser can still apply the
  // stylesheet's scroll-behavior: smooth to this call, turning the jump
  // into an animation that can get interrupted mid-travel.
  // eslint-disable-next-line no-unused-expressions
  html.offsetHeight
  window.scrollTo(0, 0)

  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    html.style.scrollBehavior = ""
  })

  return false
}
