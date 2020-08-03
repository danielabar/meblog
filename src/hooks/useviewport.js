import React from "react"

const useViewport = () => {
  const windowObj =
    typeof window !== "undefined"
      ? window
      : { innerWidth: 960, addEventListener: () => "" }
  const [width, setWidth] = React.useState(windowObj.innerWidth)

  React.useEffect(() => {
    const handleWindowResize = () => setWidth(windowObj.innerWidth)
    windowObj.addEventListener("resize", handleWindowResize)
    return () => windowObj.removeEventListener("resize", handleWindowResize)
  }, [windowObj])

  // Return the width so we can use it in our components
  return { width }
}

export default useViewport
