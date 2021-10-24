---
title: "A VS Code Alternative to Postman"
featuredImage: "../images/rest-aaron-burden-2bg1jPty490-unsplash.jpg"
description: "Looking for a Postman alternative? This VS Code REST Client extension could be the answer."
date: "2021-06-13"
category: "Web Development"
---

If you've been doing web development for any length of time, you've probably built or worked on an HTTP REST style API and needed a REST Client to test it. [Postman](https://www.postman.com/product/rest-client/) is a very popular choice and I used to reach for this all the time. However, I'd like to share another tool, a VS Code extension that is working better for me, as an alternative to Postman.

But first, why not just stick with Postman? Below I've outlined a few pain points that have caused me to seek out an alternative.

**Disclaimer** This is not at all to suggest that Postman is a bad product. In fact its very good, feature rich, constantly evolving, and certainly solves a lot of problems for a lot of teams and companies. The following is just my perspective using it as a developer.

## Why Not Postman?

### Context Switching

Postman is a separate application that needs to be downloaded and installed, and is separate from the text editor/IDE I use for development (which is VS Code). This requires a context switch, which creates just enough friction to make me a little irritated. It would be nicer to stay in the editor where I can continue to use my preferred keyboard shortcuts, fonts and themes.

### Team Sharing

If you're working by yourself on a project, then the Postman free tier can be sufficient as there's no need to share collections with anyone else. However, if working on a team, it will require being able to share the collection(s) of HTTP requests and environments configuration (dev, qa, staging, prod, etc.) to test your API. This requires a paid Teams account on Postman. If this is an internal API or something proprietary being built for a client, this means trusting a 3rd party (Postman, the company) with the API, and environment information.

### Backups

As you add more and more requests/collections/environments for your API, you will come to depend on Postman and would lose a lot of work if the data were lost. When working on the free tier, collections and environments can be saved to an external json file with the Export feature, but that requires manual work. Or Postman encourages account creation, and then your collections and environments are backed up and synced on their servers. While this is certainly convenient, it does raise the 3rd party trust issue as mentioned earlier.

### Secrets Management

Speaking of trust, many APIs require authentication such as a username/password or token provided on each request. When using Postman, this gets saved as part of the request (or environment if using variables). For a personal side project, this may not be a big deal. But when working on a company project, this effectively makes Postman a secrets manager, especially if storing tokens for staging and production, or other environments that may be publicly accessible. This may not be desirable, especially if the company you're working for already has an approved secrets manager such as LastPass, 1Password, or Vault.
### Version Control

Another thing I find irritating about working with Postman is lack of version control, at least, on the free tier.  The API requests will evolve as the project evolves. If you have to go back to a previous point in time to fix a bug or track down where a regression occurred in the project, it's impossible to "git checkout ..." the Postman collection at the same git commit hash. Note that the paid teams account does support version control, which I haven't used. From the [docs](https://learning.postman.com/docs/collaborating-in-postman/version-control-for-collections/) it looks like a proprietary system based roughly on Github PRs, accessible via the Postman GUI. But this is not the same as the git you'd be using for version control on the project.

## VS Code REST Client

So what to use instead? I've been using this VS Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for nearly a year and am very happy with it, as it solves all the pain points I've had with Postman. Here a quick introduction to using it.

### Getting Started

After installing the extension, create a new folder somewhere in your project such as `requests` or `http` (doesn't matter what you call it, it's just for organization to have a single place for all the "collections").

Now create a file in the folder and give it an `.http` extension. For example, I'm going to be testing the subscriptions endpoint on my project so will create a file `http/subscription.http`. Think of this as a Collection in Postman as it supports multiple requests.

To add the first request, edit the file as follows. If following along with your project's API, replace with appropriate endpoint:

```http
# Get all subscriptions
GET http://localhost:4000/api/v1/subscriptions

Accept: application/vnd.api+json
Myapp-Tenant-Api-Key: thekey
```

Comments can be added by starting a line with `#`.

The request is specified with any of the usual HTTP verbs, followed by the resource endpoint.

Then following an empty line, the request headers are specified in `key: value` format. In this case, the request is accepting a json response, and also specifies a custom headers specific to this application for the api key.

To submit the request, either click on the `Send Request` text that will appear right above the request line (this is added by the extension), or use keyboard shortcut <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Opt</kbd> + <kbd class="markdown-kbd">R</kbd>.

This will open a new editor tab in a side-by-side view displaying the results. The tab title will contain the HTTP response code, the response headers will be listed in the new editor tab, followed by the response body.

### Environment Variables

A few problems may jump out from the simple example above. Firstly the URL is hard-coded to `localhost`, which makes this less flexible to test other environments. Second issue is secret api key is hard-coded in the file. This is just a regular file in your project that will be committed to version control so secrets should not be a part of that.

To fix both of these issues, the extension provides environment variables - this is a similar idea to Environments in Postman. The environment variables are specified in a `.vscode/settings.json` file at the root of the project. The `.vscode` directory should be git ignored so this is where the secrets will go.

First, edit the request in `http/subscriptions.http` to indicate that `host` and `apikey` should be variable - note the double curly brace syntax for variables:

```http
# Get all subscriptions
GET {{host}}/api/v1/subscriptions

Accept: application/vnd.api+json
Myapp-Tenant-Api-Key: {{apikey}}
```

Then configure the variables for each environment you'll be testing against in `.vscode/settings.json`. For example, if your environments are local, dev, and staging:

```json
{
  "rest-client.environmentVariables": {
    "$shared": {},
    "local": {
      "host": "http://localhost:4000",
      "apikey": "local-api-key"
    },
    "dev": {
      "host": "http://dev.host",
      "apikey": "dev-api-key"
    },
    "staging": {
      "host": "http://staging.host",
      "apikey": "staging-api-key"
    },
    ...
  }
}
```

The `$shared` section is for any non-environment specific variables that should be available even when no specific environment is selected.

Now at the bottom right of your editor, an environment selector will appear. Click it to select the environment you want to test with, for example `local`. Or use <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Opt</kbd> + <kbd class="markdown-kbd">E</kbd> to bring up the environment selector.

Then back in `http/subscriptions.http`, you can hover over the variables and it will show you the value for the selected environment. When submitting the request, the values from `.vscode/settings.json` are filled in for the variables.

### Adding Another Request

You can add as many requests as you like in a single http file. Simply separate them by an empty line and `###`. For example, to add a POST request to the `http/subscriptions.http` file, the POST body follows the request headers after an empty line.

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

I've barely scratched the surface of all the cool features this extension provides, see the [docs](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) for a lot more such as cURL and GraphQL support.

## Why I Prefer This

### Editor Integration

Using the http requests does not require leaving the editor. The request files get formatted/styled in your theme of choice, fonts, etc. All the customizations you've made to make your editor perfect for you will also apply to the `.http` files. You can use the usual shortcut keys to find the http files, intellisense on environment variables when editing the http files, and it even supports finding requests by symbol, just like any other code file in VS Code.

### Version Control, Backups, Sharing

The `.http` files are part of your project, therefore they live under the same version control as the rest of your code. Now you get all the benefits of git and PR reviews, and the requests are tied to the code they're testing. Of course this also means the request files are backed up just like the rest of your code. This also takes care of the team sharing - all the developers on your team will access any newly added http files or requests as soon as they `git fetch` or `git pull`.

### Secrets Management

API secrets will not get committed as part of the http files as long as they're specified with environment variables. Then the actual values can be stored in the company's approved secrets manager, which developers can use to populate their git ignored settings file.

## Drawbacks

One potential issue with using a VS Code extension instead of Postman is that the HTTP requests are not easily accessible to non-techies, or anyone who doesn't have access to the git repo where the request files are stored.

The VS Code client also doesn't run tests the way Postman can (see the Tests tab in Postman if you've never used this feature, can write some assertions about the http response in JavaScript). Although, this can be covered by adding API tests as part of the project itself. For example `request` type tests with RSpec.

Finally if not every developer on the team is using VS Code, will have to investigate plugins for other editors that cover similar functionality as VS Code. For example a [rest client for vim](https://github.com/diepm/vim-rest-console).

## Conclusion

If everyone on the team that wants to run requests is able to access version control, and setup VS Code (or another editor that supports the http extension), then this is a great solution and alternative to Postman. I've been using it for nearly a year now, both on work and side projects and am very happy with it. I hope you'll give it a try and see some benefits as well.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.
