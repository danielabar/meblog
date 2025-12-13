# Gherkin Syntax Highlighting

Was unable to follow these steps: https://danielabaron.me/blog/add-language-gatsby-remark-vscode/ because there is no longer an official `.tmLanguage` file for Gherkin syntax.

It got removed from the VSCode Cucumber extension in this PR from 2023: https://github.com/cucumber/vscode/pull/196 in favour of [Semantic Token Provider](https://code.visualstudio.com/api/references/vscode-api#DocumentSemanticTokensProvider), implemented in [cucumber/language-service](https://github.com/cucumber/language-service/blob/1e34a962320b9632ddf3bac04e46ea2806183250/src/service/getGherkinSemanticTokens.ts)

But `gatsby-remark-vscode` can't make use of this, it requires a tmLanguage file, bundled via an npm package.

Fortunately, the original tmLanguage file is archived at: https://github.com/cucumber-attic/cucumber-tmbundle/blob/17a4419fb5ea47f910d9b2fd8b29f01f68382050/Syntaxes/Cucumber%20Plain%20Text%20Feature.tmLanguage

Solution is to generate a vendored, file based npm package locally in this project, see `vendor/vscode-gherkin`.

And npm install it as dependency of this project in `package.json` using local `file`:

```json
"dependencies": {
  "vscode-gherkin": "file:vendor/vscode-gherkin"
}
```

Then it can be added to `gatsby-config.js`:

```javascript
{
resolve: `gatsby-remark-vscode`,
options: {
  theme: "Monokai", // Or install your favorite theme from GitHub
  extensions: [
    "rest-client",
    "HCL",
    "applescript",
    "vscode-graphql-syntax",
    "vscode-ruby-syntax",
    "vscode-gherkin",
  ],
  wrapperClassName: "gatsby-highlight",
  inlineCode: {
    className: "my-inline",
    marker: "•",
    // theme: "Monokai",
  },
},
```
