---
title: "Get started with Gatsby and Unit Testing"
featuredImage: "../images/gatsby-unit-test-nina-mercado-5Y8NrzPya-w-unsplash.jpg"
description: "Learn how to add unit tests to a Gatsby site with Jest and react-testing-library."
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

## Simple Snapshot Test

Now that all the testing libraries are installed and configured, it's time to write a simple test. The footer component on my blog simply renders out social links and the copyright:

```js
// src/components/footer.js
import React from "react"
import styles from "./footer.module.css"
import { FaTwitter, FaGithub, FaCodepen, FaLinkedinIn } from "react-icons/fa"

const Footer = () => {
  return (
    <footer className={styles.container} data-testid="footer">
      <p className={styles.copy}>All materials © Daniela Baron 2021</p>
      <div className={styles.social}>
        <a href="https://twitter.com/DanielaMBaron"><FaTwitter /></a>
        <a href="https://github.com/danielabar"><FaGithub /></a>
        <a href="https://codepen.io/danielabar"><FaCodepen /></a>
        <a href="https://www.linkedin.com/in/danielabaron/"><FaLinkedinIn /></a>
      </div>
    </footer>
  )
}
export default Footer
```

Since there's no logic or interactivity in this component, the unit test for it will simply render it using the `render` function from react testing library, then verify against the snapshot using jest's `toMatchSnapshot` function:

```js
// src/components/footer.spec.js
import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import Footer from "./footer"

describe("Footer", () => {
  it("renders correctly", () => {
    const container = render(<Footer />)
    expect(container).toMatchSnapshot()
  })
})

```

See the Jest docs to learn more about [snapshot testing](https://jestjs.io/docs/snapshot-testing).

## Run Tests

The command to run tests in a terminal is simply `jest`, however, since the jest library is installed in the `node_modules` of the project, you would have to run it specifying the full path from your project root: `node_modules/bin/jest`. That's a little tedious to type out each time.  A better way is to add a `test` entry in the `scripts` section of the project's `package.json` file. When running npm scripts, npm will search the projects' local `node_modules` directory for the binary, saving you the trouble of having to specify the full path:

```json
// package.json
{
  "scripts": {
    "test": "jest"
  }
}
```

Now you can run the tests with `npm test`.

## Component with Props

Let's move on to a slightly more complex component that accepts some props. In the example below, the `AllLink` component accepts a `marginTop` prop to control how much space is styled right above it. This component gets rendered in various places throughout my blog and the spacing can vary:

### Temp Outline

- slightly more complex - alllink, passed in prop to control margintop, use datatestid to verify
- component with children props - Layout - test with arbitrary content in between header and footer
- more complicated: mock dependency on custom hook - header component uses customer useViewport hook to determine whether to render regular nav or responsive nav
- user interaction: entering text (search-input.spec.js) - watch out: don't use key events from `@testing-library/react` as they don't fully mimic real browser behaviour, instead use `type` method from `"@testing-library/user-event"`. Also notice special control character `{enter}`, see https://testing-library.com/docs/ecosystem-user-event/#special-characters for all of them
- SEO - component that generates meta tags using `react-helmet` for social sharing, static query is mocked. Meta tags not query-able on screen object from react testing library so instead will use `Helmet.peek`
- business logic: pagination component - given props of prev/next page and is first/last - verify prev/next links enabled/disabled accordingly.
- template to list paginated lists of articles - blog-list.spec.js, verify pagination links are pointing to correct pages
- Optional wrap test commands with Makefile - test and exit, test watch, test with coverage, test clean (clean jest cache). Convenient if you work on multiple projects in different languages/tech stacks. Rather than having to remember various build commands, make is universally available on *nix systems so it can be consistent, eg: every project can have a `make test` command.
- Run tests on CI - probably getting too long here - link to next post if this is enough content to generate another post?