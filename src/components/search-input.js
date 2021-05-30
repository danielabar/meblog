import React from 'react';
import { navigate } from 'gatsby';
import { MdSearch } from "react-icons/md";
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
    if (text.length >= 3) {
      navigate(`/search-results/?q=${text}`);
    }
  }, 300);

  return (
    <div className={styles.wrapper}>
      <MdSearch size="1.7rem" />
      <input type="text"
            className={styles.search}
            aria-label="Search"
            placeholder="Search, eg: Rails"
            onChange={(e) => search(e.target.value)} />
    </div>
  )
}

export default SearchInput