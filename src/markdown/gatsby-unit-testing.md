---
title: "Get started with Gatsby and Unit Testing"
featuredImage: "../images/add-language-pankaj-patel-fvMeP4ml4bU-unsplash.jpg"
description: "Description TBD..."
date: "2021-09-26"
category: "gatsby"
---

This post will demonstrate how to add unit tests to a Gatsby project using Jest and react-testing-library. Gatsby is a static site generator powered by React and GraphQL so the libraries to test it are pretty much the same as you would use testing any React project.

## Why?

But before getting into the mechanics of how to do this, first you may be wondering - why should I add unit tests to my Gatsby site? To answer this, let's start with a common use case for a Gatsby site - a personal or company blog. In my case, I started with the Hello World Gatsby starter project, then started writing some posts in markdown. Over time I gradually added more features including pagination, SEO, typography with self-hosted google fonts, responsive nav menu for desktop vs mobile layouts, custom analytics, and search.

Even for a simple blog site without all these features, it's still valuable to add some basic unit tests to snapshot all the page layouts and components. A complete explanation of snapshot testing is beyond the scope of this article, but [here](TBD) is a great reference.

Then if your blog does have additional features, especially those requiring user interaction such as search, it will be even more valuable to add unit testing to verify the user's interactions with these components. Finally Gatsby can be used for more than just blogging and any site will benefit from at least some basic snapshot tests, and some more complex tests for interactive components or components that have more logic in them than simply rendering a layout.

## Initial Setup

Start by going over the Gatsby [unit testing](https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/) docs, which explain how to get setup for unit testing including installing the necessary libraries from npm, configuring jest and babel, and setting up some useful mocks.

However, rather than installing `react-test-renderer` as shown in the Gatsby docs, I recommend installing [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). This is because `react-test-renderer` will only render a component and then you can verify the expected output, but does not support interactivity like clicking a button or entering text into an input box. React Testing Library on the other hand, will provide a lot more flexibility. Specifically, instead of `react-test-renderer`, install these additional libraries:

```
npm i @testing-library/jest-dom testing-library/react testing-library/user-event --save-dev
```

## First Test

Now that all the testing libraries are installed and configured, it's time to write a simple test.