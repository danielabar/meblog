---
title: "Copy to Clipboard with Stimulus & Rails"
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

Before diving into the specifics, let's take a moment to understand what Stimulus is.

Stimulus is a JavaScript library that facilitates adding small, targeted enhancements to web applications. It's part of the [Hotwire](https://hotwired.dev/) stack, which is an innovative approach to building modern web apps without the complexity typically associated with heavy JavaScript frameworks for building single page apps. While StimulusJS can be used as a standalone library from [npm](https://www.npmjs.com/package/@hotwired/stimulus), this post will show how it fits into a Rails application, where it enhances server-rendered HTML with just the right amount of interactivity, aka "JavaScript sprinkles".

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

Now we'd like to add a Copy button that copies the content text to the clipboard. To get started with the copy to clipboard feature, we first need a button that the user can click to start the interaction. Normally buttons would be contained in a form with an action that POSTs to the server. But this is going to be a client-side only interaction, therefore no form or action is needed:

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
  <div>
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
    console.log("=== CLIPBOARD CONTROLLER CONNECTED === ")
  }
}
```

Navigating to `http://localhost:3000` with the browser dev tools open to the Console tab should show:
```
=== CLIPBOARD CONTROLLER CONNECTED ===
```

This is because the default route is the welcome route:

```ruby
Rails.application.routes.draw do
  get "welcome/index"
  root "welcome#index"
end
```

And the welcome controller index action renders the `app/views/welcome/index.html.erb` view, which causes the div with `data-controller="clipboard"` attribute to enter the DOM, which in turn causes the `connect()` function in the Stimulus controller to run.

## Copy Button Action

Now that the controller is connected, it's time to make it do some actual work.

Stimulus uses [actions](https://stimulus.hotwired.dev/reference/actions) for handling DOM events. An action connects a DOM element and an event listener fired on that element, to a function within the controller.

In this case, we need to handle the "click" event on the Copy button. To start, we update the markup with the `data-action` attribute:

```erb
<%# app/views/welcome/index.html.erb %>

<div data-controller="clipboard">
  <div>
    <%= @very_important_content %>
  </div>

  <%# === CONNECT CLICK EVENT ON BUTTON TO COPY FUNCTION IN CONTROLLER === %>
  <button data-action="click->clipboard#copy">Copy</button>
</div>
```

Then add a `copy()` function in the controller. For now, it just logs that it was called. The `connect()` function has been removed as we don't need to run any code when the element enters the DOM.

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  // Executed when a DOM element with `data-action="click->clipboard#copy"`
  // is clicked on.
  copy() {
    console.log("=== CLIPBOARD COPY CALLED ===")
  }
}
```

Now if you refresh `http://localhost:3000` and click the Copy button, the dev tools Console tab should show:

```
=== CLIPBOARD COPY CALLED ===
```

Since the `click` event is commonly used for button elements, Stimulus provides a shorthand syntax for the `data-action` attribute, allowing you to leave off the "click" event:

```erb
<button data-action="clipboard#copy">Copy</button>
```

Now that the click event handler is hooked up to the Stimulus clipboard controller, the next step is to update the `copy()` function to use the Clipboard API to copy the text in the content div. It will look something like this:

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  copy() {
    // The text to be copied should come from the content div
    const text = "TBD..."

    navigator.clipboard.writeText(text)
      .then(() => {
        // success
      })
      .catch((error) => {
        // fail
      });
  }
}
```

However, in order to do this, the controller needs to know what text to copy. The actual text is contained in the content div. This requires getting a reference to the DOM element `<div>the text in here</div>`. This is explained in the next section.

## Targets

Stimulus uses [targets](https://stimulus.hotwired.dev/reference/targets) to get references to specific DOM elements that are within the scope of the controller. This is accomplished by adding a `data-clipboard-target=XXX` attribute to an element, where `XXX` will become part of the variable name in the controller. The `clipboard` part of this data attribute refers to the controller name.

For the copy to clipboard functionality, we need a reference to the content div so that we can extract its `innerText` to pass to the clipboard. We'll name this  `content` by adding a `data-clipboard-target="content"` to the content div:

```erb
<%# app/views/welcome/index.html.erb %>

<div data-controller="clipboard">

  <%# === GRAB A REFERENCE TO THIS ELEMENT BY NAMING IT `content` === %>
  <div data-clipboard-target="content">
    <%= @very_important_content %>
  </div>

  <button data-action="clipboard#copy">Copy</button>
</div>
```

To get a reference to the `content` element in the Stimulus controller, add it to the [static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static) targets array. Then it can be used in any function as `this.contentTarget`:

```javascript
// app/javascript/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  // Entries in the `targets` array connect to DOM elements
  // eg: data-clipboard-target="content"
  static targets = ["content"]

  copy() {
    // Now we can reference `this.contentTarget` to get
    // DOM element having data-clipboard-target="content"
    const text = this.contentTarget.innerText
    console.log(`=== TEXT TO BE COPIED: ${text} ===`)
  }
}
```

Now if you refresh the browser at `http://localhost:3000` and click the Copy button, the console tab should display:

```
=== TEXT TO BE COPIED: The sun gently peeked through the dense foliage... ===
```

## Clipboard API

Now that we have a click handler hooked up to the Copy button, and are able to get a reference to the text content to be copied, we can put this all together with the clipboard API. Specifically the [writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) function is used to copy the given text to the system clipboard. It returns a promise that resolves after the clipboard has been updated with the text.

Update the `copy()` function in the controller as follows:

```javascript
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["content"]

  copy() {
    const text = this.contentTarget.innerText
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
      });
  }
}
```

<aside class="markdown-aside">
The reason error handling is required is because the clipboard API only works in a secure context, otherwise it will throw a `NotAllowedError`. Localhost is considered a secure context so this should work when running on your laptop. In a deployed environment, the page needs to be served over https. See the MDN <a class="markdown-link" href="https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts">documentation</a> for further details.
</aside>

To test if this is working, refresh the browser at `http://localhost:3000` and click the Copy button. The dev tools Console tab should show:

```
Text copied to clipboard
```

Then, entering <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">V</kbd> in a new text document, or with your cursor anywhere in an existing document, should paste in the content from the page, starting with `The sun gently peeked through the dense...`.

## User Feedback

Technically, the copy to clipboard feature is working, but here's no visible feedback to the user that the copy was successful. It would be nice to update the text of the Copy button to "Copied" for a few seconds, so the user knows it worked, and then change the text back to "Copy".

In JavaScript, if you have a reference to a button element, it's text can be modified by setting it's [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) property. So if we had a reference to the button element, we could change its text in the `copy()` function, after the clipboard `writeText` promise is resolved.

To get a reference to a DOM element with Stimulus, we need another target, which was [explained earlier](../stimulus-copy-to-clipboard#targets). Let's add another one for the button element named `button`. Starting with the template. The button element already has a `data-` attribute for the copy action, but it's no problem to add another one to specify it as a target:

```erb
<%# app/views/welcome/index.html.erb %>

<div data-controller="clipboard">
  ...

  <%# === GRAB A REFERENCE TO THE BUTTON ELEMENT BY NAMING IT `button` === %>
  <button
    data-action="clipboard#copy">
    data-clipboard-target="button"
      Copy
  </button>
</div>
```

Then update the static `targets` list in the clipboard controller to add `button`:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  // === ADD BUTTON AS TARGET HERE ===
  static targets = ["content", "button"]

  copy() {
    // ...
  }
}
```

Once the button is added as a target, it can be referenced in controller functions as `this.buttonTarget`. Now we can update the `copy()` function to update the button's text, then use a [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout) to put the text back to what it was, after a 2 second delay:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "button"]

  copy() {
    const text = this.contentTarget.innerText
    navigator.clipboard.writeText(text)
      .then(() => {
        // === UPDATE BUTTON TEXT TO COPIED ===
        this.buttonTarget.textContent = 'Copied';

        // === RESET THE BUTTON TEXT AFTER 2 SECONDS ===
        setTimeout(() => {
          this.buttonTarget.textContent = 'Copy';
        }, 2000);
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
      });
  }
}
```

## Values

At this point, the feature is functional and could be considered complete. But there's a few further customizations that could be made to make this more re-usable across your application. For example, there may be some places where the success text should show something else such as "Done". You may also want variability in the delay, for example 3 seconds rather than 2 seconds.

Currently these values are hard-coded in the controller. It would be nice if the app developer could provide these as inputs to the controller. In Stimulus, this is accomplished with [values](https://stimulus.hotwired.dev/reference/values).

WIP...

## TODO
* generate screenshot of interaction from working demo
* mention using Rails 7.1
* brief mention I'm using TailwindCSS but doesn't matter for Stimulus, use whatever you like for styles
* main content
  * new rails app `rails new`
  * welcome controller with index only action `bin/rails g controller welcome index`
  * After the essential feature is working, introduce customization: what text to display after copied, and for how long - `values`
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
* assumptions: basic rails and JS knowledge, link to MDN on js events, eg: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events and https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event, JS classes
* caveat maintainability? Would be nice to have dev tooling that links views to controllers, or allows refactor/impact analysis such as selecting a controller and showing all views/partials/templates its used in. Or being able to click on a target or value element from a template, and have it navigate to the controller definition.
* summary/complete solution, and from into "for those in a hurry, jump to complete solution"
* Instead of hard-coded 'Copy' in controller, could it read the original value into a variable, and then put it back to what it was
* edit

### Temp

Might also want to explore disabling button during delay period:

```javascript
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  static targets = ["content", "button"]

  copy() {
    const text = this.contentTarget.innerText;

    // Disable the button
    this.buttonTarget.disabled = true;

    navigator.clipboard.writeText(text)
      .then(() => {
        this.buttonTarget.textContent = 'Copied';
        setTimeout(() => {
          this.buttonTarget.textContent = 'Copy';

          // Re-enable the button after 2 seconds
          this.buttonTarget.disabled = false;
        }, 2000);
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
        // Ensure the button is re-enabled in case of error
        this.buttonTarget.disabled = false;
      });
  }
}
```

Then would need additional styles, conditional?
Would also need TailwindCSS build config to scan the controller if adding classes here

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "button"]

  copy() {
    const text = this.contentTarget.innerText;

    // Disable the button
    this.buttonTarget.disabled = true;
    this.buttonTarget.classList.add('opacity-50', 'cursor-not-allowed');

    navigator.clipboard.writeText(text)
      .then(() => {
        this.buttonTarget.textContent = 'Copied';
        setTimeout(() => {
          this.buttonTarget.textContent = 'Copy';

          // Re-enable the button after 2 seconds
          this.buttonTarget.disabled = false;
          this.buttonTarget.classList.remove('opacity-50', 'cursor-not-allowed');
        }, 2000);
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
        // Ensure the button is re-enabled in case of error
        this.buttonTarget.disabled = false;
        this.buttonTarget.classList.remove('opacity-50', 'cursor-not-allowed');
      });
  }
}

```
