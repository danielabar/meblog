import React from "react"
import { navigate } from "gatsby"
import { MdSearch } from "react-icons/md"
import styles from "./search-input.module.css"

const ENTER_KEY_CODE = 13

const SearchInput = () => {
  // function debounce(func, duration) {
  //   let timeout
  //   return function (...args) {
  //     const effect = () => {
  //       timeout = null
  //       return func.apply(this, args)
  //     }
  //     clearTimeout(timeout)
  //     timeout = setTimeout(effect, duration)
  //   }
  // }

  // const search = debounce((charCode, text) => {
  //   if (charCode === ENTER_KEY_CODE) {
  //     navigate(`/search-results/?q=${text}`);
  //   }
  // }, 300);

  function search(charCode, text) {
    if (charCode === ENTER_KEY_CODE) {
      navigate(`/search-results/?q=${text}`)
    }
  }

  return (
    <div className={styles.wrapper}>
      <MdSearch size="1.7rem" />
      <input
        type="text"
        className={styles.search}
        aria-label="Search"
        placeholder="Search, eg: Rails"
        onKeyPress={event => search(event.charCode, event.target.value)}
      />
    </div>
  )
}

export default SearchInput
