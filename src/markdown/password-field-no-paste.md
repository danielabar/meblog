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

If you were affected by the [LastPass breach](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/), you've probably found yourself on various websites changing your password. You may have also noticed that some websites block pasting in a password field. For some reason, the companies behind these seem to think that being able to paste in a password field is insecure. But it's actually the opposite, forcing users to manually type in a password one character at a time encourages the use of weak passwords - shorter and easier to type in, and interferes with password managers. This is a frustrating user experience. This post will show how to work around this issue.

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

In order to understand why the snippet works, we first need to understand how paste is blocked in the first place.

## TODO
* better feature image?
* link to Snippet definition from chrome devtools docs
* WIP: solution
* Use options object instead of `true` in `addEventListener` function as per MDN
* Link to MDN for official ref on `addEventListener`
* Add screenshots for adding snippet
* deeper explanation for the curious
* link to my example site to test out the snippet: https://danielabar.github.io/messing_with_paste/
