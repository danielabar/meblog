---
title: "Roll Your Own Search Service with Rails and Postgres"
featuredImage: "../images/roll-your-own-luigi-pozzoli-iIS1SIO5_aY-unsplash.jpg"
description: "Learn how to roll your own search service using Rails and Postgres Full Text Search for a Gatsby blog."
date: "2021-07-04"
category: "web development"
---

This is the first in a multi-part series of posts detailing how I built the search feature for this blog.

This blog is built with [Gatsby](https://www.gatsbyjs.com/), which is a React and GraphQL powered static site generator. However, it also ships with React so you can build dynamic pages as well. This blog is primarily static, with all the content written in markdown files, and a build step that runs a graphql query to retrieve all the markdown content, and converts each to an html page with a pre-defined layout.

After some time, as the number of posts on this site grew, I realized it would be useful to add a search feature. First thing I looked up the Gatsby docs on how to [add search](https://www.gatsbyjs.com/docs/how-to/adding-common-features/adding-search/) to a Gatsby site.