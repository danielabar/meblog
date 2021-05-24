import React, { useEffect, useState } from "react"
import { useLocation } from '@reach/router';
import queryString from 'query-string';
import { getSearchResults } from '../services/search';
import SEO from "../components/SEO"
import Layout from "../components/layout"
import AllLink from "../components/all-link"
import styles from "./search-results.module.css"

const SearchResults = () => {
  const location = useLocation();
  const query = queryString.parse(location.search);
  const searchTerm = query.q
  const [list, setList] = useState([]);

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
        <h2>Search Results for {query.q}</h2>
        <ul>
          {list.map(item => <li key={item.title}>{item.title}</li>)}
        </ul>
      </div>
      <AllLink marginTop="30px" />
    </Layout>
  )
}

export default SearchResults;
