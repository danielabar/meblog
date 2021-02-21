module.exports = {
  siteMetadata: {
    title: "Daniela Baron Blog",
    titleTemplate: "%s · Daniela Baron",
    siteUrl: "https://danielabaron.me",
    url: "https://danielabaron.me",
    description: "The personal website of Daniela Baron, software developer.",
    image: "/images/profile.png",
    twitterUsername: "@DanielaMBaron",
    googleSiteVerification: "zmLm6qu34TLdeqUUPDF_K6faoqGqQincxyNZk7VsHgY"
  },
  plugins: [
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-transformer-remark",
    "gatsby-plugin-react-helmet",
    'gatsby-plugin-sitemap',
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-copy-linked-files`,
            // options: {
            //   ignoreFileExtensions: [`png`, `jpg`]
            // }
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
            },
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: "Monokai", // Or install your favorite theme from GitHub
              wrapperClassName: "gatsby-highlight",
              inlineCode: {
                className: "my-inline",
                marker: "•",
                // theme: "Monokai",
              },
            },
          },
        ],
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "files",
        path: `${__dirname}/src/markdown`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/images`,
      },
    },
  ],
}
