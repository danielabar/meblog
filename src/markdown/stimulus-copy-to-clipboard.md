---
title: "Build Copy to Clipboard with Stimulus and Rails"
featuredImage: "../images/stimulus-copy-clipboard-meg-boulden-7daz5hPdd1c-unsplash.jpg"
description: "Learn how to build a configurable copy to clipboard feature with the Stimulus JavaScript library as part of a Rails application"
date: "2024-10-01"
category: "javascript"
related:
  - "When the Password Field Says No to Paste"
  - "Maximize Learning from Screencasts"
  - "Rails Strong Params for GET Request"
---

In this post, we'll explore how to implement a Copy to Clipboard feature using Stimulus within a Rails application. The interaction looks like this:

TODO: Screenshots...

But before diving into the specifics, let's take a moment to understand what Stimulus is and where it fits into the broader landscape of web development.

Stimulus is a JavaScript library that facilitates adding small, targeted enhancements to web applications. It's part of the [Hotwire](https://hotwired.dev/) stack, which is an innovative approach to building modern web apps without the complexity typically associated with heavy JavaScript frameworks for building single page apps. While StimulusJS can be used as a standalone library from [npm](https://www.npmjs.com/package/@hotwired/stimulus), this post will show how it fits into a Rails application, where it enhances server-rendered HTML with just the right amount of interactivity.

The copy button is an example of a feature that doesn't need server interaction - i.e. there's no need to send a request to the server, maintain state in the database and update the url of the application. This is why JavaScript, implemented with StimulusJS is a perfect solution for this. Let's get started building it.

## TODO
* generate screenshot of interaction from working demo
* can this be worked in? JavaScript sprinkles
* main content
  * new rails app `rails new`
  * welcome controller with index only action `bin/rails g controller welcome index`
  * fill in index action with some cat lorem ipsum content
  * fill in index view with a wrapper div - inside another div for content, then another div for controls, that has the copy button
  * Generate a stimulus controller, name it clipboard
  * Explain data- naming and attach it to the wrapper div
  * Demo in the `connect()` method, when associated element appears in dom, this runs, just do a console.log
  * Explain `target` to get a reference to a DOM element from within controller, we need a reference to the content
  * explain `foo#action`, by default is on `click` event
  * After the essential feature is working, introduce customization: what text to display after copied, and for how long - `values`
* mention used cat lorem ipsum for long example text: https://fungenerators.com/lorem-ipsum/cat/
* link to my github repo: stimulus_demo
* to confirm copied content: either paste into a new text document, or on mac: Finder -> Edit -> View clipboard
* conclusion para
* maybe aside link to kickstart post re: customizing `rails new...`
* brief mention I'm using TailwindCSS but doesn't matter for Stimulus, use whatever you like for styles
* Maybe also show stimulus controllers can use js debug from browser dev tools just like any other js code
* References: Stimulus docs: https://stimulus.hotwired.dev/, https://stimulus.hotwired.dev/handbook/introduction, https://stimulus.hotwired.dev/handbook/installing (installation doc has naming conventions - very important!)
* edit

### Temp

```ruby
class WelcomeController < ApplicationController
  def index
    @very_important_content = <<-CAT_IPSUM
      Attack feet behind the couch...
      Intently stare at the same spot...
    CAT_IPSUM
  end
end
```

```erb
<div>
  <h1 class="font-bold text-4xl">Welcome#index</h1>
  <div id="content-container">
    <div id="content">
      <%= @very_important_content %>
    </div>
    <div id="controls">
      <button>Copy</button>
    </div>
  </div>
</div>
```
