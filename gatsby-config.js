require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    title: "Daniela Baron Blog",
    titleTemplate: "%s · Daniela Baron",
    siteUrl: "https://danielabaron.me",
    url: "https://danielabaron.me",
    description: "The personal website of Daniela Baron, software developer.",
    image: "/images/profile.png",
    twitterUsername: "@DanielaMBaron",
    googleSiteVerification: "zmLm6qu34TLdeqUUPDF_K6faoqGqQincxyNZk7VsHgY",
  },
  plugins: [
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-transformer-remark",
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-sitemap",
    "gatsby-plugin-workerize-loader",
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-classes`,
            options: {
              classMap: {
                "root": "markdown-root",
                paragraph: "markdown-para",
                "heading[depth=2]": "markdown-subtitle",
                "heading[depth=3]": "markdown-sub-subtitle",
                "blockquote": "markdown-blockquote",
                "list[ordered=true]": "markdown-list-ordered",
                "list[ordered=false]": "markdown-list-unordered",
                "listItem": "markdown-list-item",
                "html": "markdown-html",
                "code": "markdown-code",
                "code[lang=yml]": "markdown-code-yml",
                emphasis: "markdown-emphasis",
                strong: "markdown-strong",
                inlinecode: "markdown-inline-code",
                link: "markdown-link",
                image: "markdown-image",
                linkReference: "markdown-link-ref",
                imageReference: "markdown-image-ref"
              }
            }
          },
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
              extensions: ["rest-client"],
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
