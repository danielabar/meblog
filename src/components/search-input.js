import React from 'react';
import styles from "./search-input.module.css"
import { navigate } from 'gatsby';

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
      navigate(`/search-results/?q=${text}`);
    }
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