---
title: "When the Password Field Says No to Paste"
featuredImage: "../images/password-paste-regularguy-eth-q7h8LVeUgFU-unsplash.jpg"
description: "Take back control from websites that block pasting in password fields."
date: "2023-03-01"
category: "javascript"
related:
  - "Access Chrome Bookmarks with Keyboard"
  - "TDD by Example"
  - "View Localhost on Your Phone"
---

If you were affected by the [LastPass breach](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/), you've probably found yourself on various websites changing your password. You may have also noticed that some websites block pasting in a password field. For some reason, the companies behind these seem to think that being able to paste in a password field is insecure. But it's actually the opposite, forcing users to manually type in a password one character at a time encourages the use of weak passwords - shorter and easier to type in. It can also interfere with password managers, although some of them may be able to work around it. This post will show how to work around this frustrating user experience.

## Solution

Next time you encounter a website that won't let you paste into a password (or any other) field, open Developer Tools (<kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Option</kbd> + <kbd class="markdown-kbd">I</kbd> on a Mac if using Chrome), make sure you're in the Console tab, and paste in the following lines:

```javascript
var allowPaste = function(e){
  e.stopImmediatePropagation();
  console.log("Free the paste!")
  return true;
};
document.addEventListener('paste', allowPaste, true);
```

Now, without refreshing the page, try to paste again in the field that wouldn't allow it before - you should now be able to paste, hurray!

To avoid having to remember those lines and paste them in the console each time, they can be saved as a Snippet as follows:

1. With Developer Tools open, click on the Sources tab.
2. There should be another panel open on the left hand side with tabs like Page, Filesystem, Snippets. Click on Snippets.
3. Click on "+ New Snippet" at the top of the Snippets tab.
4. This will open up an editor in the middle tab - paste in the lines of JavaScript from above, and press <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">S</kbd> to save it.
5. Chrome will automatically assign the snippet a name, shown in the snippet listing in the left panel such as "Script snippet #1". Right-click on it, select Rename, and name it whatever you like. I name mine "free_the_paste".

## How Does it Work?

In order to understand why the snippet works, we first need to understand how paste is blocked in the first place. If you inspect any input field that has paste blocked, it will most likely looks like this:

```html
<input type="password" id="some_field" name="some_field" onpaste="return false;">
```

This makes use of the `paste` event. According to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event):

> The paste event fires when the user initiates a paste action through the browser's user interface.

That bit in the markup `onpaste="return false;"` overrides the default action, which is to insert the contents of the clipboard into the field at the cursor position. It's equivalent to the following, which adds an event handler to the field using the `onpaste` property of the field:

```javascript
const some_field = document.querySelector("#some_field");
some_field.onpaste = (event) => {
  return false;
}
```

Alternatively, it could be implemented using the [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) method of the text field:

```javascript
const some_field = document.querySelector("#some_field");
some_field.addEventListener("paste", (event) => {
  event.preventDefault();
  return false;
});
```

The end result of returning false from an override of the `paste` event is that nothing happens when the user attempts to pastes in content.

## TODO
* better feature image?
* link to Snippet definition from chrome devtools docs
* deeper explanation for the curious
  * Link to MDN for official ref on `addEventListener`
  * explain use of `useCapture` option
  * "For event listeners attached to the event target, the event is in the target phase, rather than the capturing and bubbling phases. Event listeners in the capturing phase are called before event listeners in any non-capturing phases."
* Add screenshots for adding snippet
* link to my example site to test out the snippet: https://danielabar.github.io/messing_with_paste/
* Reference MDN paste event: https://developer.mozilla.org/en-US/docs/Web/API/Document/paste_event or better https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
* Add WARN: Not intended as how-to instructions for blocking paste, please don't do this - its awful UX!!!
