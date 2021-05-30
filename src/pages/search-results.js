import React, { useEffect, useState } from "react"
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

  // TODO: Style h2 header
  // TODO: Handle empty state (list of search results is empty array)
  // TODO: What if searchTerm is null/undefined
  // TODO: Add search-input component to mobile nav
  // TODO: Search UI, example https://egghead.io/lessons/gatsby-navigate-to-a-new-page-programmatically-in-gatsby
  // TODO: Add SEARCH_ENABLED env var
  useEffect(() => {
    async function fetchData() {
      const searchResults = await getSearchResults(searchTerm);
      setList(searchResults);
    }
    fetchData();
  }, [searchTerm]);

  return (
    <Layout>
      <SEO title="Search Results" pathname="/search-results" />
      <div className={styles.container}>
        <h2 className={styles.header}>Search Results For: <span className={styles.term}>{query.q}</span></h2>
        <ArticleList articles={toNodeArray(list)} />
      </div>
      <AllLink marginTop="30px" />
    </Layout>
  )
}

export default SearchResults;
