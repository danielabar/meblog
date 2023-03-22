const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(
    // these props are invalid for an `a` tag
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
  Slice: jest.fn().mockImplementation(
    ({ alias, ...rest }) =>
      React.createElement("div", {
        ...rest,
        "data-test-slice-alias": alias
      })
  ),
  // TODO: Remove, no longer using StaticQuery component
  StaticQuery: jest.fn().mockImplementation(() => {
    return {
      site: {
        siteMetadata: {
          defaultTitle: "Jane Doe Blog",
          titleTemplate: "%s · Jane Doe",
          defaultDescription: "Blog description.",
          siteUrl: "https://someblog.com",
          defaultImage: "/images/profile.png",
          twitterUsername: "@somebody",
          googleSiteVerification: "abc123",
        },
      },
    }
  }),
  // This works because only SEO component uses useStaticQuery hook
  useStaticQuery: jest.fn().mockImplementation(() => {
    return {
      site: {
        siteMetadata: {
          defaultTitle: "Jane Doe Blog",
          titleTemplate: "%s · Jane Doe",
          defaultDescription: "Blog description.",
          siteUrl: "https://someblog.com",
          defaultImage: "/images/profile.png",
          twitterUsername: "@somebody",
          googleSiteVerification: "abc123",
        },
      },
    }
  }),
  navigate: jest.fn(),
}
