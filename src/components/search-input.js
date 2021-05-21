import React from 'react';
import styles from "./search-input.module.css"

const SearchInput = () => {

  function debounce(func, duration) {
    let timeout
    return function (...args) {
      const effect = () => {
        timeout = null
        return func.apply(this, args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(effect, duration)
    }
  }

  const search = debounce((text) => {
    console.log(text)
    // TODO: If have at least 3 characters, fetch(`process.env.SEARCH_URL?q=${text}`)
    // when get results, navigate programmatically to new page /search
    // see this example: https://codesandbox.io/embed/github/jlengstorf/egghead-gatsby-link/tree/master/?module=%2Fsrc%2Fpages%2Fsign-up.js
    // also see nice search input UI: https://egghead.io/lessons/gatsby-navigate-to-a-new-page-programmatically-in-gatsby
  }, 300);

  return (
    <input type="text"
           className={styles.search}
           aria-label="Search"
           placeholder="Search, eg: Rails"
           onChange={(e) => search(e.target.value)} />
  )
}

export default SearchInput