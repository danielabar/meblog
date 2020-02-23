module.exports = {
  siteMetadata: {
    title: "Daniela Baron Blog",
    titleTemplate: "%s · Daniela Baron",
    siteUrl: "https://danielabaron.me",
    url: "https://danielabaron.me",
    description: "The personal website of Daniela Baron, software developer.",
    image: "/images/placeholder.png",
    twitterUsername: "@DanielaMBaron",
  },
  plugins: [
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-transformer-remark",
    "gatsby-plugin-react-helmet",
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
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
