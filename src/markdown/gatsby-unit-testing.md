---
title: "Get started with Gatsby and Unit Testing"
featuredImage: "../images/gatsby-unit-test-nina-mercado-5Y8NrzPya-w-unsplash.jpg"
description: "Learn how to add unit tests to a Gatsby site with Jest and react-testing-library."
date: "2021-09-26"
category: "gatsby"
---

This post will demonstrate how to add unit tests to a Gatsby project using Jest and react-testing-library. Gatsby is a static site generator powered by React and GraphQL so the libraries to test it are similar to those used for testing any React project.

## Why?

But before getting into the mechanics of how to do this, first you may be wondering - why should I add unit tests to my Gatsby site? To answer this, let's start with a common use case for a Gatsby site - a personal or company blog. In my case, I started with the [Hello World Gatsby starter project](https://github.com/gatsbyjs/gatsby-starter-hello-world), then started writing some posts in markdown. Over time I gradually added more features including pagination, SEO, typography with self-hosted google fonts, responsive nav menu for desktop vs mobile layouts, custom analytics, and search.

Even for a simple blog site without all these features, it's still valuable to add some basic unit tests to snapshot all the page layouts and components. A complete explanation of snapshot testing is beyond the scope of this article, but [here](TBD) is a great reference.

Then if your blog does have additional features, especially those requiring user interaction such as search, it will be even more valuable to add unit testing to verify the user's interactions with these components. Finally Gatsby can be used for more than just blogging and any site will benefit from at least some basic snapshot tests, and some more complex tests for interactive components or components that have more logic in them than simply rendering a layout.

## Initial Setup

Start by following the Gatsby [unit testing](https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/) docs, which explain how to get setup for unit testing including installing the necessary libraries from npm, configuring jest and babel, and setting up some useful mocks.

However, rather than installing `react-test-renderer` as shown in the Gatsby docs, I recommend installing [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). This is because `react-test-renderer` will only render a component and then you can verify the expected output, but does not support interactivity like clicking a button or entering text into an input box. React Testing Library on the other hand, will provide a lot more flexibility with interaction and querying the DOM.

Specifically, instead of `react-test-renderer`, install these additional libraries:

```
npm i @testing-library/jest-dom testing-library/react testing-library/user-event --save-dev
```

One additional step is to set the jest test environment to `jsdom`. By default, its set to `node` and any tests that attempt to query the DOM will fail without this change:

```js
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  // rest of the config from following Gatsby instructions...
}
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

Let's move on to a slightly more complex component that accepts some props. In the example below, the `AllLink` component accepts a `marginTop` prop to control how much space is styled right above it. This component gets rendered in various places throughout my blog and the spacing can vary. Notice the `data-testid` attribute on the outer element, this will be used later by the test.

```js
// src/components/all-link.js
import React from "react"
import { Link } from "gatsby"
import styles from "./all-link.module.css"

export default ({ marginTop }) => (
  <div data-testid="all-wrapper" style={{ marginTop: marginTop }}>
    <Link to="/blog" className={styles.allLink}>
      All Articles
    </Link>
  </div>
)
```

The test uses the `render` function from react testing library to render the component, this time with the `marginTop` prop and compares to a snapshot. To verify that the `marginTop` prop value was correctly applied as the style, the `screen.getByTestId` function from react testing library is used. This function accepts a string value such as `"all-wrapper"` and returns the DOM node in the component that has this value set as its `data-testid` attribute. Finally, jest-dom's [toHaveStyle](https://github.com/testing-library/jest-dom#tohavestyle) matcher is used to verify that the DOM node has a `marginTop` style of `30px`, which is what was provided when the test rendered the `AllLink` component:

```js
// src/components/all-link.spec.js
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import AllLink from "./all-link"

describe("AllLink", () => {
  it("renders correctly", () => {
    const container = render(<AllLink marginTop="30px" />)
    expect(container).toMatchSnapshot()

    const div = screen.getByTestId("all-wrapper")
    expect(div).toHaveStyle("marginTop: 30px")
  })
})
```

## Component with Children

In a typical Gatsby site, there will most likely be a `<Layout>` component used by every page to get a consistent look and feel. My `<Layout>` component simply renders the `<Header>` and `<Footer>` components, and then renders the page content in between these using the `children` prop:

```js
// src/components/layout.js
import React from "react"
import styles from "./layout.module.css"
import Header from "./header.js"
import Footer from "./footer.js"

export default ({ children }) => (
  <div className={styles.container}>
    <Header />
      <div className={styles.content}>{children}</div>
    <Footer />
  </div>
)
```

The Layout component test renders the component with some simple content using a `data-testid` attribute to verify it was rendered. Note that the `<Header>` and `<Footer>` components are wrapped in DOM nodes with `data-testid` attributes of `header` and `footer` respectively. This makes them easy to find in the `Layout` component test to verify it did indeed render the Header and Footer components. The easiest way to verify that an element got rendered is to use jest-dom's [toBeInTheDocument](https://github.com/testing-library/jest-dom#tobeinthedocument) matcher:

```js
// src/components/layout.spec.js
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Layout from "./layout"

describe("Layout", () => {
  it("renders correctly", () => {
    const container = render(
      <Layout>
        <div data-testid="test-content">test content</div>
      </Layout>
    )
    expect(container).toMatchSnapshot()

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })
})
```

## Mocking Dependencies

The `<Header>` component makes use of a custom `useViewport` hook to change the navigation menu layout between responsive design (viewport width < 640px) and regular (viewport width >= 640px). The `useViewport` hook returns the current width of the viewport:

```js
// src/components/header.js
import React from "react"
import { Link } from "gatsby"
import useViewport from "../hooks/useviewport"
import styles from "./header.module.css"
import NavMenuResponsive from "./nav-menu-responsive"
import NavMenu from "./nav-menu"

const Header = () => {
  const { width } = useViewport()
  const breakpoint = 640

  // Use result of useViewport hook to determine which navigation component to render
  function menuHelper() {
    return width < breakpoint ? <NavMenuResponsive /> : <NavMenu />
  }

  return (
    <header className={styles.container} data-testid="header">
      <Link to="/">
        <div className={styles.logo}>
          <div className={styles.profileWrapper}>
            <img className={styles.profileImg} src={"/images/profile.png"} alt="Profile" />
          </div>
          <div className={`${styles.headerItem} ${styles.title}`}>
            Daniela Baron
          </div>
        </div>
      </Link>

      {menuHelper()}
    </header>
  )
}

export default Header
```

To test the `<Header>` component, the `useViewport` hook will need to be mocked out because it depends on the `window` object which isn't present when unit tests are running (Jest tests run via Node.js, not in a browser).

Since the hook is imported from a module, the test will use the `jest.mock(...)` function to mock out the entire module. Furthermore, a mock function that returns a width is specified as the return result from the `default` export. Then each test can modify the returned width value and verify the correct version of the navigation menu gets rendered, as well as verifying that the `useViewport` hook was called.

```js
// src/components/header.spec.js
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import useViewport from "../hooks/useviewport"
import Header from "./header"

let mockWidth = 1024
jest.mock("../hooks/useviewport", () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: mockWidth })),
}))

describe("Header", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders nav menu for wide widths", () => {
    mockWidth = 900
    const container = render(<Header />)

    expect(container).toMatchSnapshot()
    expect(screen.getByTestId("nav-menu")).toBeInTheDocument
    expect(useViewport).toHaveBeenCalled();
  })

  it("renders nav menu responsive for narrow widths", () => {
    mockWidth = 400
    const container = render(<Header />)

    expect(container).toMatchSnapshot()
    expect(screen.getByTestId("nav-menu-responsive")).toBeInTheDocument
    expect(useViewport).toHaveBeenCalled();
  })
})
```

I found Jest mocking not quite as intuitive as RSpec mocking, learn more about it [here](https://jestjs.io/docs/mock-functions).

## User Interaction

The `<SearchInput>` component renders an input text box where user can type in a search term. When they hit <kbd>Enter</kbd>, the UI will navigate to the search results for that page at url `/search-results/?q=searchTermUserTypedIn`:

```js
// src/components/search-input.js
import React from "react"
import { navigate } from "gatsby"
import { MdSearch } from "react-icons/md"
import styles from "./search-input.module.css"

const ENTER_KEY = "Enter"

const SearchInput = () => {
  function search(eventKey, text) {
    if (eventKey === ENTER_KEY) {
      navigate(`/search-results/?q=${text}`)
    }
  }

  return (
    <div className={styles.wrapper}>
      <MdSearch size="1.7rem" />
      <input
        type="text"
        className={styles.search}
        data-testid="search-input"
        aria-label="Search"
        placeholder="Search, eg: Rails"
        onKeyPress={event => search(event.key, event.target.value)}
      />
    </div>
  )
}

export default SearchInput
```

In order to simulate a user typing into the search input box, the test for this component will use functions from the [user-event](https://testing-library.com/docs/ecosystem-user-event/) library, which works with react testing library to provide more realistic simulations of browser events.

**WATCH OUT:** Do not attempt to use the [fireEvent](https://testing-library.com/docs/dom-testing-library/api-events) function from react testing library. Although in theory it should be possible to simulate the correct combination of key press/up/down events using the `fireEvent` function, in practice I couldn't get it working. Then I read that it's recommended to use the [user-event](https://testing-library.com/docs/ecosystem-user-event/) library for this purpose and it made everything much easier.

Also this test should not attempt to navigate to another page for real as this is just a unit test running in Node.js, not an end-to-end test running in a browser. To avoid real navigation, Gatsby's `navigate` function is mocked out with a Jest mock function. Since this is universally desired across all the tests, the mock function can be defined in the global `__mocks__/gatsby.js` file. The first part of this file you should already have from following the [initial setup](https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/) instructions:

```js
// __mocks__/gatsby.js
const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(
    ({
      activeClassName,
      activeStyle,
      getProps,
      innerRef,
      partiallyActive,
      ref,
      replace,
      to,
      ...rest
    }) =>
      React.createElement("a", {
        ...rest,
        href: to,
      })
  ),
  // +++ ADD MOCK NAVIGATE FUNCTION HERE +++
  navigate: jest.fn()
}
```

And here is the test for the `<SearchInput>` component. It uses the `getByTestId` function to locate the text input element, then uses the `userEvent.type` function to enter some example text into the search box. Finally Jest's `toHaveBeenCalledWith` function is used to verify the mock version of the `navigate` function was called after user hit <kbd>Enter</kbd>.

```js
import React from "react"
import { navigate } from "gatsby"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import SearchInput from "./search-input"

describe("SearchInput", () => {
  it("navigates to search results on Enter key press", () => {
    render(<SearchInput />)

    const inputEl = screen.getByTestId("search-input")
    userEvent.type(inputEl, "Rails{enter}")

    expect(navigate).toHaveBeenCalledWith("/search-results/?q=Rails")
  })
})
```

Notice the use of the special control character `{enter}` to simulate the <kbd>Enter</kbd> key. See the user-event docs for a list of all such [control characters](https://testing-library.com/docs/ecosystem-user-event/#special-characters).

## Meta Tags

Many Gatsby sites will have an `<SEO>` component that gets included in every page. It uses a static query to get the site's metadata such as title, description, url, etc. (defined in `gatsby-config.js`), and also accepts properties to override these. Then it uses `react-helmet` to output meta tags for site description, image, url, and also the social sharing tags so that nice looking cards can be generated on the various social media platforms when someone shares a link to your site.

A full discussion of how to build this component is out of scope for this article as I just want to focus on how to test it, but take a look at [this article](https://www.gatsbyjs.com/docs/add-seo-component/) on the Gatsby site for more information on building an SEO component. Mine looks something like this:

```js
// src/components/SEO.js
import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

export default function SEO({
  title,
  description,
  image,
  pathname,
}) {
  const data = useStaticQuery(graphql`
    query SEOQuery {
      site {
        siteMetadata {
          defaultTitle: title
          titleTemplate
          defaultDescription: description
          siteUrl: url
          defaultImage: image
        }
      }
    }
  `)

  const seo = {
    title: title || data.site.siteMetadata.defaultTitle,
    description: description || data.site.siteMetadata.defaultDescription,
    image: `${data.site.siteMetadata.siteUrl}${image || data.site.siteMetadata.defaultImage}`,
    url: `${data.site.siteMetadata.siteUrl}${pathname || "/"}`,
  }

  return (
    <Helmet title={seo.title} titleTemplate={data.site.siteMetadata.titleTemplate} >
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />
      {seo.url && <meta property="og:url" content={seo.url} />}
      {seo.title && <meta property="og:title" content={seo.title} />}
      {seo.description && <meta property="og:description" content={seo.description} />}
      {seo.image && <meta property="og:image" content={seo.image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {seo.title && <meta name="twitter:title" content={seo.title} />}
      {seo.description && <meta name="twitter:description" content={seo.description} /> }
      {seo.image && <meta name="twitter:image" content={seo.image} />}
    </Helmet>
  )
}
```

In order to test this component, the `useStaticQuery` hook must be mocked out. This is because the build time GraphQL server may not be running when tests are running and unit tests should not have any external dependencies.

This can be done in the test, or if there's only one component that uses a static query, the mock can be defined in the global `__mocks__/gatsby.js`. Unlike when we mocked the Gatsby `navigate` function earlier, for this test, the returned result matters because the values will be used to generate the meta tag values, therefore Gatsby's `mockImplementation` function will be used to have the mock return a result:

```js
// __mocks__/gatsby.js
const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  // other mocks...
  // +++ ADD NEW MOCK HERE +++
  useStaticQuery: jest.fn().mockImplementation(() => {
    // When component calls useStaticQuery(...), this result will be returned
    return {
      site: {
        siteMetadata: {
          defaultTitle: "Jane Doe Blog",
          titleTemplate: "%s · Jane Doe",
          defaultDescription: "Blog description.",
          siteUrl: "https://someblog.com",
          defaultImage: "/images/profile.png",
        },
      },
    }
  }),
}
```

The other thing that will be different about this test is that the meta tags are not query-able in react testing library. Instead, the `Helmet.peek` method is used. Here are a few example tests for the Home Page and an Article Page. It gets quite lengthy verifying all the meta tags so will only include a few to demonstrate the idea. See [SEO.spec.js](https://github.com/danielabar/meblog/blob/master/src/components/SEO.spec.js) on my blog project on Github for the complete listing.

```js
// src/components/SEO.spec.js
import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import Helmet from "react-helmet"
import SEO from "./SEO"

describe("SEO", () => {
  it("renders for home page", () => {
    render(<SEO title="Home" pathname="/"/>)

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Home · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Blog description.", name: "description" },
        { content: "https://someblog.com/images/profile.png", name: "image", },
        { content: "https://someblog.com/", property: "og:url", },
        { content: "website", property: "og:type" },
        { content: "Home", property: "og:title" },
        { content: "Blog description.", property: "og:description" },
        { content: "https://someblog.com/images/profile.png", property: "og:image", },
        { content: "summary_large_image", name: "twitter:card" },
        { content: "Home", name: "twitter:title" },
        { content: "Blog description.", name: "twitter:description" },
        { content: "https://someblog.com/images/profile.png", name: "twitter:image", },
      ])
    )
  })

  it("renders for an article page", () => {
    render(
      <SEO
        title="Article Title"
        description="Article Description"
        image="/static/abc123/def/article-image.jpg"
        pathname="/blog/article-slug/"
      />
    )

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Article Title · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Article Description", name: "description" },
        { content: "https://someblog.com/static/abc123/def/article-image.jpg", name: "image", },
        { content: "https://someblog.com/blog/article-slug/", property: "og:url", },
        { content: "article", property: "og:type" },
        { content: "Article Title", property: "og:title" },
        { content: "Article Description", property: "og:description" },
        { content: "https://someblog.com/static/abc123/def/article-image.jpg", property: "og:image", },
        { content: "summary_large_image", name: "twitter:card" },
        { content: "Article Title", name: "twitter:title" },
        { content: "Article Description", name: "twitter:description" },
        { content: "https://someblog.com/static/abc123/def/article-image.jpg", name: "twitter:image", },
      ])
    )
  })
})
```

## Pagination Logic

Another type of component you might want to test is one that implements some business logic. For example, on my site all the blog list pages are paginated, 5 articles at a time, with Previous and Next links shown across the bottom of each list of 5 articles. The display of these links is implemented with a `<Pagination>` component that receives some props indicating if this is the first page or last page, and the previous/next page links.

The rules for this component are that the previous link should be disabled if this is the first page and the next link should be disabled if this is the last page. For any other page, both previous and next links will be enabled. The href for (enabled) previous/next links should be for the page number as provided in the props.

```js
// src/components/pagination.js
import React from "react"
import { Link } from "gatsby"
import styles from "./pagination.module.css"

export default props => (
  <div className={styles.container}>
    {!props.isFirst && (
      <div className={`${styles.prev} ${styles.pagination}`} data-testid="previous-enabled" >
        <Link to={props.prevPage} rel="prev"> ← prev </Link>
      </div>
    )}
    {props.isFirst && (
      <div className={`${styles.prev} ${styles.pagination} ${styles.inactive}`} data-testid="previous-disabled" >
        ← prev
      </div>
    )}
    {!props.isLast && (
      <div className={`${styles.next} ${styles.pagination}`} data-testid="next-enabled" >
        <Link to={props.nextPage} rel="next"> next → </Link>
      </div>
    )}
    {props.isLast && (
      <div className={`${styles.next} ${styles.pagination} ${styles.inactive}`} data-testid="next-disabled" >
        next →
      </div>
    )}
  </div>
)
```

The tests for this component should cover all possible cases: first page, middle page, last page, and an edge case where there only is one page (first and last links disabled). Each test renders the component with props representing these scenarios, then verifies the presence or absence of expected DOM elements by `data-testid`.

If a link is expected, then the test will also verify its expected href value. I couldn't find a convenience `getByHref...` query from react testing library so the "escape hatch" `document.querySelector...` is used to verify the href attributes of the links.

Verifying all the expectations gets quite lengthy so this snippet below shows only the tests for first and middle page. See [pagination.spec.js](https://github.com/danielabar/meblog/blob/master/src/components/pagination.spec.js) on my blog project on Github for the complete listing.

```js
// src/components/pagination.spec.js
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Pagination from "./pagination"

describe("Pagination", () => {
  it("renders first page", () => {
    const container = render(
      <Pagination
        isFirst={true}
        prevPage={"/blog/0"}
        isLast={false}
        nextPage={"/blog/2"}
      />
    )

    expect(screen.queryByTestId("previous-enabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).not.toBeInTheDocument()

    expect(document.querySelector("[data-testid='next-enabled'] a").getAttribute("href")).toEqual("/blog/2")
  })

  it("renders middle page", () => {
    const container = render(
      <Pagination
        isFirst={false}
        prevPage={"/blog/3"}
        isLast={false}
        nextPage={"/blog/5"}
      />
    )

    expect(screen.queryByTestId("previous-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("previous-disabled")).not.toBeInTheDocument()
    expect(screen.queryByTestId("next-enabled")).toBeInTheDocument()
    expect(screen.queryByTestId("next-disabled")).not.toBeInTheDocument()

    expect(document.querySelector("[data-testid='previous-enabled'] a").getAttribute("href")).toEqual("/blog/3")
    expect(document.querySelector("[data-testid='next-enabled'] a").getAttribute("href")).toEqual("/blog/5")
  })
```

## Templates

So far all of the test examples have been for components. Pages and templates can also be tested in a similar manner. For example, here is my `Post` template, which is used to render each post (including the one that you're reading right now), consisting of the article html content, published date, featured image, and title:

```js
// src/templates/post.js
import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"
import Layout from "../components/layout"
import styles from "./post.module.css"

export default props => {
  const markdown = props.data.markdownRemark
  const publishedDate = markdown.frontmatter.date
  const featuredImgFluid = markdown.frontmatter.featuredImage.childImageSharp.fluid
  const content = markdown.html
  const title = markdown.frontmatter.title

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.published}>Published {publishedDate}</div>
        <Img fluid={featuredImgFluid} className={styles.featureImage} />
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: content }}/>
      </div>
    </Layout>
  )
}

// Results of graphql query will NOT be available when this a unit test renders this template
export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "DD MMM YYYY")
        featuredImage {
          childImageSharp {
            fluid(maxWidth: 800) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      fields {
        slug
      }
    }
  }
`
```

The main difference is that for pages or templates that use `graphql`, recall that this is mocked out, therefore will not return any results. From the initial Gatsby unit test setup [instructions]((https://www.gatsbyjs.com/docs/how-to/testing/unit-testing/)), you should have:

```js
// __mocks__/gatsby.js
const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  // All graphql queries are mocked out
  graphql: jest.fn(),
  // rest of the mocks...
}
```

The important thing to understand for testing is when the Gatsby templates are built, results from the graphql query are made available in the `data` prop. This means that when the template is rendered in a test, simply pass in an example of what the query would have returned as `data` when rendering, then use snapshot testing:

```js
// src/templates/post.spec.js
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import Post from "./post"

describe("Post", () => {
  it("Renders in layout", () => {
    // An example of what the graphql query used by the Post template returns:
    const postData = {
      markdownRemark: {
        fields: {
          slug: "/blog/some-slug",
        },
        frontmatter: {
          date: "14 Aug 2021",
          title: "This is the title",
          featuredImage: {
            childImageSharp: {
              fluid: {
                aspectRatio: 1.5,
                base64: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4k=",
                sizes: "(max-width: 800px) 100vw, 800px",
                src: "/static/69f6b/14b42/some-img.jpg",
                srcSet: "/static/69f6b/f836f/some-img.jpg 200w, /static/69f6b/2244e/some-img.jpg 400w, /static/69f6b/14b42/some-img.jpg 800w, /static/69f6b/a7715/some-img.jpg 1000w",
              },
            },
          },
        },
        html:
          "<p>Here is the first paragraph</p><h2>Sub Heading</h2><p>And another paragraph</p>",
      },
    }

    // Render the template with the data prop to mimic graphql passing results to it:
    const container = render(<Post data={postData} />)
    expect(container).toMatchSnapshot()
  })
})
```

## Jest Test Options

During development, it's convenient to have Jest watch for any file changes, and automatically re-run affected tests. This provides nearly instant feedback if anything has broken. Given that you've added `"test": "jest",` to `package.json`, the command to have Jest run in "watch" mode is:

```
npm test -- --watch
```

Jest can also generate a coverage report showing percentage of lines and files in the project that have been "covered", i.e. exercised by a test. Don't stress about getting this all the way up to 100% as that can be difficult. Instead I use the coverage report to focus on areas of the project that are missing tests and see where test coverage could be improved. The command to run tests and generate the coverage report is:

```
npm test -- --coverage
```

## Conclusion

This post has covered how to get started with unit testing on a Gatsby project using Jest and react testing library. It has covered simple snapshot testing, testing components with props, components with children, mocking dependencies globally and per test, user interaction, meta tags, business logic and templates. It has also covered a few different options for how to run the tests. I hope this will encourage everyone who runs a Gatsby site to go ahead and add at least a few tests.