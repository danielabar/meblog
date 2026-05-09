---
title: "Displaying File Names for Multi-File Inputs with Stimulus"
featuredImage: "../images/displaying-multiple-file-names-stimulus-jon-tyson-566CgCRSNCk-unsplash.jpg"
description: "How to build a small Stimulus controller that displays individual file names when users select multiple files, replacing the browser's generic count."
date: "2026-08-01"
category: "rails"
related:
  - "Copy to Clipboard with Stimulus & Rails"
  - "Active Storage & Form Errors: Preventing Lost File Uploads in Rails"
  - "Understanding ActiveRecord Dependent Options"
---

When you add a multi-file upload to a Rails form with Active Storage's `has_many_attached`, the browser's native file input shows something like "3 files" instead of listing the actual file names. This isn't a Rails limitation, it's how `<input type="file" multiple>` works in every browser. In this post, we'll build a small [Stimulus](https://stimulus.hotwired.dev) controller that reads the selected files and displays each name, giving users clear confirmation of what they picked. If you're new to Stimulus, the [official handbook](https://stimulus.hotwired.dev/handbook/introduction) is a good starting point — this post assumes basic familiarity.

## Understanding the Browser Behavior

Before writing any code, let's understand *why* the file input behaves this way. A multi-file input looks like this:

```html
<label for="photos">Choose photos:</label>
<input type="file" id="photos" name="photos" accept="image/png, image/jpeg" multiple>
```

From [MDN Input Type File](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file):

> When the user selected multiple files, the value represents the first file in the list of files they selected. The other files can be identified using the input's HTMLInputElement.files property.

The input's `value` property only holds the first file's name. When multiple files are selected, browsers display a count like "3 files" because they don't iterate over the full list. But the files *are* accessible through the [`HTMLInputElement.files`](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#getting_information_about_selected_files) property, which returns a `FileList` containing every selected file.

This means that the data is already there in the DOM. We can read it and render the file names with a few lines of JavaScript.

## Demo App Setup

To demonstrate the solution, we'll build a simple Pet Adoption Board where a shelter posts pets with multiple photos. This is a natural use case for  `has_many_attached :photos`.

**Create the App**

Note that Rails 8 includes Stimulus by default:

```bash
rails new pet_adoptions_demo
cd pet_adoptions_demo
```

**Set Up Active Storage and Scaffold**

```bash
bin/rails active_storage:install
bin/rails db:migrate

bin/rails generate scaffold Pet name:string breed:string age:integer description:text
bin/rails db:migrate
```

**Configure the Model**

Add `has_many_attached` to the `Pet` model:

```ruby
# app/models/pet.rb
class Pet < ApplicationRecord
  has_many_attached :photos
end
```

**Update the Controller**

The scaffold generates the usual RESTful controller. You'll need to update it to permit and attach the uploaded photos. The [demo project's controller](https://github.com/danielabar/pet_adoptions_demo) has the full details, but it's standard Active Storage plumbing.

**Add the File Input to the Form**

Add a file input before the submit button in `app/views/pets/_form.html.erb`:

```erb
<div>
  <%= form.label :photos, "Add photos" %>
  <%= form.file_field :photos, multiple: true %>
</div>
```

Run the server with `bin/dev` and visit `http://localhost:3000/pets/new`. You'll see a form like this:

![new pet form with file input](../images/default-file-input-no-files-selected.jpg "new pet form before selecting files")

Now click on "Choose Files" and select three files using the OS file picker:

![OS file picker with three files selected](../images/os-file-picker-three-files-selected.jpg "selecting three files in the OS file picker")

After selecting, the browser just shows "3 files":

![default file input showing 3 files](../images/default-file-input-three-files-selected.jpg "default file input showing generic 3 files count")

Which three? The user can't tell without opening the file picker again. Let's fix that.

## Building the Stimulus Controller

Generate the controller:

```bash
bin/rails generate stimulus file_input
# create  app/javascript/controllers/file_input_controller.js
```

Replace the generated boilerplate with:

```javascript
// app/javascript/controllers/file_input_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "list"]

  updateFileList() {
    const files = this.inputTarget.files
    this.listTarget.innerHTML = ""

    if (files.length === 0) return

    Array.from(files).forEach((file) => {
      const span = document.createElement("span")
      span.className = "pill"
      span.textContent = file.name
      this.listTarget.appendChild(span)
    })
  }
}
```

Let's walk through this:

- **`static targets = ["input", "list"]`** declares two [targets](https://stimulus.hotwired.dev/reference/targets): `input` for the file input element (to read its `files` property) and `list` for a container div where we'll render the file names.
- **`this.inputTarget.files`** accesses the `FileList` from the file input. This is the DOM API that gives us what the browser's native display doesn't show.
- **`this.listTarget.innerHTML = ""`** clears any previously rendered file names. This handles the case where the user selects files, then changes their selection.
- **`Array.from(files).forEach(...)`** converts the `FileList` (which isn't a true array) to an array, so we can iterate. For each file, we create a styled `<span>` pill showing the file name.

## Wiring It Up in the View

Next, the file input section in `app/views/pets/_form.html.erb` is updated to connect the Stimulus controller. This is accomplished with data dash attributes as follows:

```erb
<div data-controller="file-input">
  <%= form.label :photos, "Add photos" %>
  <%= form.file_field :photos,
      multiple: true,
      data: {
        file_input_target: "input",
        action: "change->file-input#updateFileList" } %>
  <div data-file-input-target="list"></div>
</div>
```

Three things changed:

1. **`data-controller="file-input"`** on the wrapper div connects this section of the DOM to the Stimulus controller `file_input_controller.js`.
2. **`data: { file_input_target: "input", action: "change->file-input#updateFileList" }`** on the file field marks this element as the `input` target and calls `updateFileList()` on every `change` event (i.e., whenever the user selects files).
3. **`<div data-file-input-target="list">`** is an empty container where the controller will render file name pills.

<aside class="markdown-aside">
Notice that the event binding uses <code>data-action</code> on the input element rather than adding an event listener in the controller's <code>connect()</code> callback. This is <a class="markdown-link" href="https://stimulus.hotwired.dev/reference/actions">idiomatic Stimulus</a>. Actions declared in the markup keep the controller focused on behavior, and Stimulus handles the listener lifecycle automatically.
</aside>

Now when selecting multiple files, it displays each file name as a pill in the list section:

![custom file input showing individual file names](../images/custom-file-input-three-files-selected.jpg "file input with individual file names displayed as pills")

Opening the browser DevTools confirms the controller is creating a `<span>` for each file:

![DevTools showing generated span elements](../images/custom-file-input-dom-elements.jpg "DevTools showing the generated span elements for each file name")

## What About Existing Solutions?

Before building this, I had my AI assistant research existing solutions. Here's what it found and why I didn't use them for this simple use case:

**Full upload libraries** like [Uppy](https://uppy.io/), [Dropzone.js](https://www.dropzone.dev/), and [FilePond](https://pqina.nl/filepond/) replace the native file input entirely with a custom UI that includes drag-and-drop, image previews, progress bars, and more. If you need those features, they're excellent. But if all you need is to show file names alongside a standard form input, pulling in a 50-200KB library is overkill.

**The Stimulus ecosystem**: Searched across [stimulus-components](https://www.stimulus-components.com/), [stimulus-use](https://stimulus-use.github.io/stimulus-use/), [tailwindcss-stimulus-components](https://github.com/excid3/tailwindcss-stimulus-components), and the [awesome-stimulusjs](https://github.com/stimulus-components/awesome-stimulusjs) curated list. None contained a file input display controller.

## Conclusion

The native file input's "n files" display is a well-known UX gap, and the fix is straightforward once you know about `HTMLInputElement.files`. A small focused Stimulus controller reads the `FileList`, renders each name, and gives users clear feedback on their selection.

The full solution works with any multi-file input, not just Rails. The controller is vanilla JavaScript that reads a standard DOM API. Stimulus provides the wiring between the markup and the behavior.

The completed demo project is available on [Github](https://github.com/danielabar/pet_adoptions_demo).

## TODO

- clarify about tailwind styling for quick demo styles but not shown in code samples for brevity
- maybe mention more clearly in conclusion or somewhere that stimulus can be used outside of rails
