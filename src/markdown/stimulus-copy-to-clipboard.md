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

## Initial Setup

Given a controller that makes some data available for a view as follows:

```ruby
# app/controllers/welcome_controller.rb
class WelcomeController < ApplicationController
  def index
    @very_important_content = <<-CONTENT
      The sun gently peeked through the dense foliage, casting dappled shadows on the forest floor.
      With a steady hand, the artist meticulously applied strokes of vibrant color to the canvas, bringing the landscape to life.
      As the waves crashed against the rugged coastline, a sense of tranquility washed over the solitary figure standing on the cliff's edge.
      Amidst the bustling city streets, the aroma of freshly brewed coffee wafted from the quaint cafe, inviting passersby to linger a little longer.
    CONTENT
  end
end
```

Here is the corresponding view that displays this content:

```erb
<%# app/views/welcome/index.html.erb %>

<div>
  <%= @very_important_content %>
</div>
```

To get started with the copy to clipboard feature, we first need a button that the user can click to start the interaction. Normally buttons would be contained in a form with an action that POSTs to the server. But this is going to be a client-side only interaction, therefore no form or action is needed:

```erb
<%# app/views/welcome/index.html.erb %>

<div>
  <%= @very_important_content %>
</div>

<%# === ADD BUTTON HERE === %>
<button>Copy</button>
```

## Introduce Stimulus

The next step is to generate a Stimulus controller. This is a JavaScript file that will be responsible for:

1. Handling the Copy button click event
2. Using the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) to copy the text in the content div to the clipboard
3. Updating the text of the Copy button to "Copied" for 2 seconds, and then setting it back to "Copy" after the 2 seconds have passed.

Rails provides a generator for this:

```bash
bin/rails generate stimulus clipboard
# create  app/javascript/controllers/clipboard_controller.js
```

This creates the following file:

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  connect() {
  }
}
```

The `connect()` function is one of several [lifecycle callbacks](https://stimulus.hotwired.dev/reference/lifecycle-callbacks). It's called every time the associated element enters the DOM. To associate a DOM element with a Stimulus controller, `data-` attributes are used. This will make more sense with an example.

Let's update the welcome view to wrap both the content and button in a wrapper div, and assign the `data-controller` attribute to the wrapper div to connect it to our controller:

```erb
<%# app/views/welcome/index.html.erb %>

<%# === CONNECT CLIPBOARD STIMULUS CONTROLLER TO DOM === %>
<div data-controller="clipboard">
  <div id="content">
    <%= @very_important_content %>
  </div>
  <button>Copy</button>
</div>
```

Now update the `connect()` function in the controller to log that it's been called:

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  connect() {
    console.log("=== CLIPBOARD CONTROLLER CONNECTED ===")
  }
}
```

Navigating to `http://localhost:3000` with the browser dev tools open to the Console tab should show:
```
=== CLIPBOARD CONTROLLER CONNECTED ===
```

## Copy Button Action

Now that we have the controller connected, it's time to make it do something useful.

Stimulus has the concept of [actions](https://stimulus.hotwired.dev/reference/actions) for handling DOM events. An action connects a DOM element and event listener to a function within the controller.

In our case, we need to handle the "click" event on the Copy button. We start by defining a `copy()` function in the controller. For now, it just logs that it was called:

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  connect() {
    console.log("=== CLIPBOARD CONTROLLER CONNECTED ===")
  }

  copy() {
    console.log("=== CLIPBOARD COPY CALLED ===")
  }
}
```

WIP, explain long form `click->clipboard#copy`, then use shorthand.

## TODO
* generate screenshot of interaction from working demo
* can this be worked in? JavaScript sprinkles
* mention using Rails 7.1
* brief mention I'm using TailwindCSS but doesn't matter for Stimulus, use whatever you like for styles
* main content
  * new rails app `rails new`
  * welcome controller with index only action `bin/rails g controller welcome index`
  * explain `foo#action`, by default is on `click` event
  * Explain `target` to get a reference to a DOM element from within controller, we need a reference to the content
  * After the essential feature is working, introduce customization: what text to display after copied, and for how long - `values`
* to confirm copied content: either paste into a new text document, or on mac: Finder -> Edit -> View clipboard
* conclusion para
* maybe aside link to kickstart post re: customizing `rails new...`
* Maybe also show stimulus controllers can use js debug from browser dev tools just like any other js code
* References: Stimulus docs:
  * https://stimulus.hotwired.dev/
  * https://stimulus.hotwired.dev/handbook/introduction
  * https://stimulus.hotwired.dev/handbook/installing (installation doc has naming conventions - very important!)
  * lifecycle callbacks: https://stimulus.hotwired.dev/reference/lifecycle-callbacks
  * actions: https://stimulus.hotwired.dev/reference/actions
* Aside: At time of this writing, clipboard api not fully supported
* link to my github repo: stimulus_demo
* edit
