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
              // https://github.com/syntax-tree/mdast
              classMap: {
                root: "markdown-root",
                paragraph: "markdown-para",
                "heading[depth=2]": "markdown-subtitle",
                "heading[depth=3]": "markdown-sub-subtitle",
                blockquote: "markdown-blockquote",
                "list[ordered=true]": "markdown-list-ordered",
                "list[ordered=false]": "markdown-list-unordered",
                listItem: "markdown-list-item",
                html: "markdown-html",
                code: "markdown-code",
                "code[lang=yml]": "markdown-code-yml",
                emphasis: "markdown-emphasis",
                strong: "markdown-strong",
                inlinecode: "markdown-inline-code",
                link: "markdown-link",
                image: "markdown-image",
                linkReference: "markdown-link-ref",
                imageReference: "markdown-image-ref",
              },
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              offsetY: `100`,
              icon: `<svg aria-hidden="true" height="20" version="1.1" viewBox="0 0 16 16" width="20"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>`,
              className: `markdown-header-link`,
              maintainCase: true,
              removeAccents: true,
              isIconAfterHeader: false,
              elements: [`h2`, `h3`],
            },
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
              extensions: ["rest-client", "HCL", "applescript"],
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
