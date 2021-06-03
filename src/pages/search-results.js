import React, { useEffect, useState } from "react";
import { Link } from 'gatsby';
import { useLocation } from '@reach/router';
import queryString from 'query-string';
import { getSearchResults, toNodeArray } from '../services/search';
import ArticleList from "../components/article-list"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import styles from "./search-results.module.css"

const SearchResults = () => {
  const location = useLocation();
  const query = queryString.parse(location.search);
  const searchTerm = query.q
  const [list, setList] = useState([]);
  const [searching, setSearching] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setSearching(true)
      setList([])
      const searchResults = await getSearchResults(searchTerm);
      setList(searchResults);
      setSearching(false)
    }
    fetchData();
  }, [searchTerm]);

  function renderHelper() {
    if (list && list.length > 0) {
      return (
        <div className={styles.container}>
          <h2 className={styles.header}>Search Results For: <span className={styles.term}>{query.q}</span></h2>
          <ArticleList articles={toNodeArray(list)} />
        </div>
        )
      } else if (searching) {
        return (
          <div className={styles.container}>
            <h2 className={styles.header}>Searching...</h2>
          </div>
        )
      } else {
        return (
          <div className={styles.container}>
            <h2 className={styles.header}>No Results Found For: <span className={styles.term}>{query.q}</span></h2>
            <p className={styles.suggestion}>Try searching for <Link className={styles.suggest_link} to="/search-results?q=rails">Rails</Link></p>
          </div>
      )
    }
  }

  return (
    <Layout>
      <SEO title="Search Results" pathname="/search-results" />
      { renderHelper() }
      <AllLink marginTop="30px" />
    </Layout>
  )
}

export default SearchResults;
