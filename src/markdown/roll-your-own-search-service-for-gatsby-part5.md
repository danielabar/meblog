---
title: "Roll Your Own Search with Rails and Postgres: Search UI"
featuredImage: "../images/roll-search-5.jpg"
description: "Learn how to build search service using Rails and Postgres Full Text Search for a Gatsby blog."
date: "2021-07-08"
category: "Gatsby"
---

This is the fifth and final in a multi-part series of posts detailing how I built the search feature for this blog. This post will explain how to build a search UI with Gatsby, making use of the search service that we've built up throughout the earlier posts in this series.

In case you missed it:

* [Part 1: Search Introduction](../roll-your-own-search-service-for-gatsby-part1) covers the existing options for adding search to a Gatsby site, and why I decided not to use any of them, and instead build a custom search service.
* [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2) covers the design and population of the `documents` table that contains all the content to be searched.
* [Part 3: Search Engine](../roll-your-own-search-service-for-gatsby-part3) provides an introduction to Postgres Full Text Search, showing some examples of using it to write queries to search against a documents table.
* [Part 4: Search API](../roll-your-own-search-service-for-gatsby-part4) explains how to expose an HTTP based search API using Rails and PostgreSQL, and how to deploy it.

## API Refresher

A quick reminder of where [Part 4: Search API](../roll-your-own-search-service-for-gatsby-part4) left off, the search API can be executed with a `GET` to the `/search` endpoint and any given `q` parameter to specify the search term. For example:

```http
GET {{host}}/search?q=tdd
Accept: application/json
```

Returns:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "title": "TDD by Example",
    "description": "A practical example of using TDD to add a new feature to an existing project.",
    "category": "javascript",
    "published_at": "2021-01-02",
    "slug": "/blog/tdd-by-example/",
    "excerpt": "If youve been coding for any length of time, youve probably heard that you should test your code, and by that I mean writing automated…"
  },
  {
    "title": "TDD by Example: Fixing a Bug",
    "description": "A practical example of using TDD to fix a bug and do some refactoring on an existing project.",
    "category": "javascript",
    "published_at": "2021-05-16",
    "slug": "/blog/tdd-by-example-bugfix/",
    "excerpt": "This post will demonstrate an example of using TDD (test driven development) to fix a bug on an existing project. If youre not familiar…"
  },
  {
    "title": "Solving a Python Interview Question in Ruby",
    "description": "Learn how to model tuples in Ruby and solve a Python data science interview question in Ruby.",
    "category": "ruby",
    "published_at": "2021-03-01",
    "slug": "/blog/python-interview-question-in-ruby/",
    "excerpt": "A few months ago, I came across a tweet posing a technical interview question for a data science position using Python:  Lets set aside for…"
  }
]
```

This needs to be integrated with Gatsby. Even though it's a static site generator, it also ships with React and has full dynamic capabilities at run time. This means the pages/components can execute code like `await fetch('https://prod-host/search?q=tdd')...`, and use React hooks such as `useEffect` to load data from an endpoint (i.e. side effect) and `setState` to populate state such as a list of search results retrieved from the endpoint.

## Design

Before diving into the search components, the following diagram illustrates the search flow for an example user that wants to search for blog posts on "rails":

![search ui](../images/search-ui-2.png "search ui")

### Step 1

A new `search-input` component is added in the top navigation bar. The user can enter a search term into the input box, and hit <kbd>Enter</kbd> when ready to search.

### Step 2

The `search-input` will capture the value entered into the input box, and trigger navigation to the new search results page, passing along the `q` parameter which represents the search term.

It's important to ensure that the `q` parameter becomes part of the search results page url, i.e. `/search-results?q=rails`. This is to support a user wanting to bookmark the search results page for a particular search term or wanting to share the url.

### Step 3

The `search-results?q=rails` page will extract the search term value from the `q` parameter in the url (`rails` in this example). It will use this to execute a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) request against the Rails server search endpoint (see [Part 4: Search API](../roll-your-own-search-service-for-gatsby-part4) for more details about the server side).

The search results from the server get converted to a format expected by the existing `article-list` component, and passed in as props to that component. Then these results are rendered, including a "Read" link to the article whose `href` attribute is populated from the `slug` property of the search results.

## Search Input

Now let's take a closer look at each UI component, starting with the new `search-input`, which is added to the top navigation bar.

The input element has an `onKeyPress` event handler, which invokes a `search` function that checks if the <kbd>Enter</kbd> key has been pressed, and if so, navigates to the new `/search-results` page. This event handler has access to the current character code being entered via `event.charCode` and the complete value of the text entered in the input via `event.target.value`.

Notice that the argument to the `onKeyPress` attribute of the `<input>` element is a function, *not* the invocation of the function. Also notice that the entire text value is passed to the `/search-results` page with a template string `/search-results/?q=${text}`.

To navigate to a page programmatically, Gatsby provides the [navigate](https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-the-navigate-helper-function) helper function.

For the magnifying glass icon displayed in the search input, I'm using the [react-icons](https://github.com/react-icons/react-icons) library, specifically the `MdSearch` icon from Material Design. This project uses css modules for scoped styles.

```js
// src/components/search-input.js

import React from 'react';
import { navigate } from 'gatsby';
import { MdSearch } from "react-icons/md";
import styles from "./search-input.module.css"

const ENTER_KEY_CODE = 13;

const SearchInput = () => {
  function search (charCode, text) {
    if (charCode === ENTER_KEY_CODE) {
      navigate(`/search-results/?q=${text}`);
    }
  }

  return (
    <div className={styles.wrapper}>
      <MdSearch size="1.7rem" />
      <input type="text"
            className={styles.search}
            aria-label="Search"
            placeholder="Search, eg: Rails"
            onKeyPress={(event) => search(event.charCode, event.target.value)} />
    </div>
  )
}

export default SearchInput
```

## Search Results

In Gatsby terms, this is a "page" rather than a component because it's the target of the router, and it lives in the `pages` project directory. But technically, it's still a React component. This page does all the heavy lifting of search so it's a little more involved than the `search-input` component.

### Parse Query

The first challenge is to extract the `q` parameter from the url to this page, which represents the search term. For example, if this page gets called with `/search-results?q=rails`, then it needs to set a variable `searchTerm` to the value "rails".

Surprisingly, I found this wasn't possible via the [reach-router](https://github.com/reach/router) alone. Gatsby's router is basically a wrapper around `reach-router`. I had to bring in the [query-string](https://github.com/sindresorhus/query-string) library to parse the query portion of the url.

Here is just the first snippet of the component to parse `searchTerm` out of the url using the `useLocation` hook provided by the `reach-router` and the `parse` method of the `query-string` library. Note that `location.search` refers to the `search` property of the `location` object returned by the `useLocation()` hook, not to be confused with the actual search term in the url. The `search` property of the `location` object refers to any portion of the url string after and including the `?`.

```js
// src/pages/search-results.js

import React from "react";
import { useLocation } from '@reach/router';
import queryString from 'query-string';
import Layout from "../components/layout"

// Example: Called with `/search-results?q=rails
const SearchResults = () => {
  const location = useLocation();
  const query = queryString.parse(location.search);
  const searchTerm = query.q
  // location.search = "?q=rails"
  // query = {q: "rails"}
  // searchTerm = "rails"

  return (
    <Layout>
      TBD...
    </Layout>
  )
}

export default SearchResults;
```

### Fetch Results

The next step is to fetch search results from the server for the `searchTerm` that was parsed out of the url.