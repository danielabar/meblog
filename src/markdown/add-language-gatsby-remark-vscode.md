---
title: "Add a Language to gatsby-remark-vscode"
featuredImage: "../images/add-language-pankaj-patel-fvMeP4ml4bU-unsplash.jpg"
description: "Learn how to add a new language for syntax highlighting to gatsby-remark-vscode."
date: "2021-06-14"
category: "web development"
---

This blog is built with [Gatsby](https://www.gatsbyjs.com/), and being an engineering blog, naturally requires a syntax higlighter. I'm using `gatsby-remark-vscode` for this, which is a Gatsby plugin that adds syntax highlighting using VS Code's highlighting engine. It comes with [over 50](https://www.gatsbyjs.com/plugins/gatsby-remark-vscode/#built-in-languages-and-themes) built-in languages.

Up until recently, the built-in language support from this plugin was more than enough for my needs on this blog, such as `ruby`, `js`, `html`, and `yml`.

But a recent post I wrote on [A Postman Alternative](../postman-alternative-vscode) required adding a new language that wasn't in the list the plugin comes with. This was `http` to specify a file of http requests, for example:

```http
# Get all subscriptions
GET {{host}}/api/v1/subscriptions

Accept: application/vnd.api+json
Myapp-Tenant-Api-Key: {{apikey}}

###

# Create a new subscription
POST {{host}}/api/v1/subscriptions

Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
Myapp-Tenant-Api-Key: {{apikey}}

{
  "data": {
    "type": "subscriptions",
    "attributes": {
      "status": "active",
      "customer-id": "some-customer",
      "plan-id": "some-plan"
    }
  }
}
```

In theory the `gatsby-remark-vscode` plugin can be customized to add other themes and languages, however, the [docs](https://www.gatsbyjs.com/plugins/gatsby-remark-vscode/#using-languages-and-themes-from-an-extension) only provide an example for how to add a new theme, not language.

A little investigation found it could be solved as follows:

First, find the project on Github that has the syntax definition file for the language you're looking to add. In my case, I was using the `.http` files as part of this VS Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension, which also comes with the syntax highlighting. I found the corresponding project on Github at [Huachao/vscode-restclient](https://github.com/Huachao/vscode-restclient). This project has the syntax definition file for the `http` and `rest` file types at [http.tmLanguage.json](https://github.com/Huachao/vscode-restclient/blob/master/syntaxes/http.tmLanguage.json).

Here's just a few lines from this file - notice the supported `fileTypes` http and rest:

```json
{
  "scopeName": "source.http",
  "fileTypes": [
    "http",
    "rest"
  ],
  // ...
}
```

Next, npm install this project from Github, into the Gatsby project:

```shell
npm install Huachao/vscode-restclient --save
```

Now, this is important, take a look at what this package got saved as in `package.json`, for example, this created an entry with key `rest-client` in the dependencies object:

```json
// package.json

"dependencies": {
  // ...
  "rest-client": "github:Huachao/vscode-restclient",
  // ...
},
```

Configure the `gatsby-remark-vscode` extension in `gatsby-config.js` by adding the package key from `package.json` into the `extensions` list. I'm using this plugin for syntax highlighting in markdown files so it's nested under the `gatsby-transformer-remark` plugin:

```js
// gatsby-config.js

module.exports = {
  plugins: [
    // other plugins...
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: "Monokai", // Or install your favorite theme from GitHub
              extensions: ['rest-client'],
            },
          },
        ],
      },
    }
  ]
}
```

And now, you can created fenced code blocks in markdown using any of the supported file types, as specified in the `http.tmLanguage.json` file from the github package.