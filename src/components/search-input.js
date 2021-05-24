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
    if (text.length > 3) {
      fetchSearchResults(text)
    }
  }, 300);

  // when get results, navigate programmatically to new page /search
  // see this example: https://codesandbox.io/embed/github/jlengstorf/egghead-gatsby-link/tree/master/?module=%2Fsrc%2Fpages%2Fsign-up.js
  // also see nice search input UI: https://egghead.io/lessons/gatsby-navigate-to-a-new-page-programmatically-in-gatsby
  async function fetchSearchResults(query) {
    const response = await fetch(`${process.env.SEARCH_URL}?q=${query}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      const json = await response.json();
      console.dir(json);
    }
  }

  return (
    <input type="text"
           className={styles.search}
           aria-label="Search"
           placeholder="Search, eg: Rails"
           onChange={(e) => search(e.target.value)} />
  )
}

export default SearchInput