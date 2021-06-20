---
title: "Roll Your Own Search Service with Rails and Postgres: Introduction"
featuredImage: "../images/roll-your-own-luigi-pozzoli-iIS1SIO5_aY-unsplash.jpg"
description: "Learn how to build search service using Rails and Postgres Full Text Search for a Gatsby blog."
date: "2021-07-04"
category: "web development"
---

This is the first in a multi-part series of posts detailing how I built the search feature for this blog.

This blog is built with [Gatsby](https://www.gatsbyjs.com/), which is a React and GraphQL powered static site generator. Gatsby also makes React available at run time to support dynamic content. This blog is primarily static. The posts are written in markdown files. A build step runs a GraphQL query to retrieve the markdown content and metadata (such as title, description, featured image, etc.) and converts this content to HTML templates which are built with React.

After some time, as the number of posts on this site grew, I realized it would be useful to add a search feature. Search by definition is dynamic - there's no way to anticipate every possible search string users may type in and build a static pages for each possible set of search results. So this would have to be a dynamic feature.

I started my research by looking up the Gatsby docs on how to [add search](https://www.gatsbyjs.com/docs/how-to/adding-common-features/adding-search/) to a static site. At the time of this writing, there were three options available. After some analysis, I decided none of them were optimal. Briefly, here are the options and my concerns:

**1. Client-side search:** With this approach, a library or gatsby plugin is used that generates a search index that is intended to be shipped as part of the Gatsby static site.  Then some client side components are added to search this index at run time. My main concern with this approach is the increase in the bundle size delivered to each user, whether they want to use search or not. Many users may land on one of these posts from a web search, just quickly want to read that specific article and never execute any searches. It doesn't make sense to slow down the loading time and force extra data on all users. And even if some users do end up executing a search, it will most likely be for just a small fraction of the entire site index, so it still doesn't make sense that their browser needs to download the entire search index.

**2. Server API - Algolia:** Algolia is a commercial search service (i.e. paid, although there may be a limited use free tier). In this case some Algolia will host the search index and provide the search API. The Gatsby site makes search requests to the Algolia server, retrieves results, then renders them in client side components. My concern with this approach was additional costs, and additional dependency on another company.

**3. Server API - ElasticSearch/Solr:** A similar idea to Algolia, except ElasticSearch and Solr are available either as commercial (i.e. paid) services, or, since they're open source, can be self hosted on any cloud provider such as AWS, DigitalOcean etc. On the commercial side, my concern was the same as Algolia. On the open source side, my concern was the additional time commitment of standing up a server, installing the software, and securing/maintaining it.

## Decision

After giving this some more thought, had a breakthrough idea. I already run a Rails server for some custom analytics on this blog. It uses a PostgreSQL database and is hosted on Heroku. PostgreSQL has a [Full Text Search](https://www.postgresql.org/docs/13/textsearch.html) feature. There's also a [pg_search](https://github.com/Casecommons/pg_search) gem that makes it relatively easy to integrate the database full text search feature with Rails. The developers of this gem have also written a fantastic [blog post](https://pganalyze.com/blog/full-text-search-ruby-rails-postgres) explaining the basics of PostgreSQL full text search and how to use the gem in a Rails project.

This seemed like a reasonable approach as I'm already paying for a basic Heroku plan, and determined that would suffice for adding search. This would mean no additional costs, and not adding yet another company to depend on. Why the concern about depending on other companies? I've been burned by this in the past if the company changes their terms, increases prices, or goes out of business.

But even after deciding to go with PostgreSQL full text search, Rails, and the `pg-search` gem, there were still more problems to solve. Such as generating the search index from the blog markdown content, building out a search API, and building the client side search components. These will all be explained in follow-up posts.

Next up, see [Part 2: Search Index](../search-index)