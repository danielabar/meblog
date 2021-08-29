/**
 * @jest-environment jsdom
 */

import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import Helmet from "react-helmet"
import SEO from "./SEO"

const mockWorkerImpl = jest.fn()
let mockedWorker = jest.Mock;
jest.mock('../workers/hello.worker.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        init: mockedWorker,
        postMessage: jest.fn().mockImplementation(() => {
          mockWorkerImpl()
        })
      };
    }),
  };
});

describe("SEO", () => {

  const COMMON_META_TAGS = [
   { content: "abc123", name: "google-site-verification" },
   { content: "summary_large_image", name: "twitter:card" },
   { content: "@somebody", name: "twitter:creator" },
   { content: "#ffffff", name: "msapplication-TileColor" },
   { content: "/ms-icon-144x144.png", name: "msapplication-TileImage" },
   { content: "#ffffff", name: "theme-color" },
  ]

  beforeEach(() => {
    mockedWorker = jest.fn().mockImplementation();
    mockedWorker.mockClear();
    mockWorkerImpl.mockClear();
  });

  it("tracks", () => {
    render(
      <SEO
        title="Home"
        pathname="/"
        track="YES"
      />
    )

    expect(mockWorkerImpl).toHaveBeenCalled();
  })

  it("renders for home page", () => {
    render(
      <SEO
        title="Home"
        pathname="/"
        track="NO"
      />
    )

    expect(mockWorkerImpl).not.toHaveBeenCalled();

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Home · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Blog description.", name: "description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "image",
        },
        {
          content: "https://someblog.com/", property: "og:url",
        },
        { content: "website", property: "og:type" },
        { content: "Home", property: "og:title" },
        { content: "Blog description.", property: "og:description" },
        {
          content: "https://someblog.com/images/profile.png",
          property: "og:image",
        },
        { content: "Home", name: "twitter:title" },
        { content: "Blog description.", name: "twitter:description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "twitter:image",
        },
        ...COMMON_META_TAGS
      ])
    )
  })

  it("renders for about page", () => {
    render(
      <SEO
        title="About"
        pathname="/about"
        track="NO"
      />
    )

    expect(mockWorkerImpl).not.toHaveBeenCalled();

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("About · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Blog description.", name: "description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "image",
        },
        {
          content: "https://someblog.com/about", property: "og:url",
        },
        { content: "website", property: "og:type" },
        { content: "About", property: "og:title" },
        { content: "Blog description.", property: "og:description" },
        {
          content: "https://someblog.com/images/profile.png",
          property: "og:image",
        },
        { content: "About", name: "twitter:title" },
        { content: "Blog description.", name: "twitter:description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "twitter:image",
        },
        ...COMMON_META_TAGS
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
        article={true}
        track="NO"
      />
    )

    expect(mockWorkerImpl).not.toHaveBeenCalled();

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Article Title · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Article Description", name: "description" },
        {
          content: "https://someblog.com/static/abc123/def/article-image.jpg",
          name: "image",
        },
        {
          content: "https://someblog.com/blog/article-slug/",
          property: "og:url",
        },
        { content: "article", property: "og:type" },
        { content: "Article Title", property: "og:title" },
        { content: "Article Description", property: "og:description" },
        {
          content: "https://someblog.com/static/abc123/def/article-image.jpg",
          property: "og:image",
        },
        { content: "Article Title", name: "twitter:title" },
        { content: "Article Description", name: "twitter:description" },
        {
          content: "https://someblog.com/static/abc123/def/article-image.jpg",
          name: "twitter:image",
        },
        ...COMMON_META_TAGS
      ])
    )
  })

  it("renders for article list page", () => {
    render(
      <SEO
        title="Blog"
        pathname="/blog/2"
        track="NO"
      />
    )

    expect(mockWorkerImpl).not.toHaveBeenCalled();

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Blog · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Blog description.", name: "description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "image",
        },
        {
          content: "https://someblog.com/blog/2", property: "og:url",
        },
        { content: "website", property: "og:type" },
        { content: "Blog", property: "og:title" },
        { content: "Blog description.", property: "og:description" },
        {
          content: "https://someblog.com/images/profile.png",
          property: "og:image",
        },
        { content: "Blog", name: "twitter:title" },
        { content: "Blog description.", name: "twitter:description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "twitter:image",
        },
        ...COMMON_META_TAGS
      ])
    )
  })

  it("renders for search results page", () => {
    render(
      <SEO
        title="Search Results"
        pathname="/search-results"
        track="NO"
      />
    )

    expect(mockWorkerImpl).not.toHaveBeenCalled();

    const helmet = Helmet.peek()
    expect(helmet.title).toEqual("Search Results · Jane Doe")
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        { content: "Blog description.", name: "description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "image",
        },
        {
          content: "https://someblog.com/search-results", property: "og:url",
        },
        { content: "website", property: "og:type" },
        { content: "Search Results", property: "og:title" },
        { content: "Blog description.", property: "og:description" },
        {
          content: "https://someblog.com/images/profile.png",
          property: "og:image",
        },
        { content: "Search Results", name: "twitter:title" },
        { content: "Blog description.", name: "twitter:description" },
        {
          content: "https://someblog.com/images/profile.png",
          name: "twitter:image",
        },
        ...COMMON_META_TAGS
      ])
    )
  })
})
