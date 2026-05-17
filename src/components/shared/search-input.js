import React from "react"
import { navigate } from "gatsby"
import { MdSearch } from "react-icons/md"
import * as styles from "./search-input.module.css"

const ENTER_KEY = "Enter"

const SearchInput = () => {
  function search(eventKey, text) {
    if (eventKey === ENTER_KEY) {
      navigate(`/search-results/?q=${text}`)
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        className={styles.search}
        data-testid="search-input"
        aria-label="Search"
        placeholder="Search, eg. Rails"
        onKeyPress={event => search(event.key, event.target.value)}
      />
      <MdSearch className={styles.icon} size="15" />
    </div>
  )
}

export default SearchInput
