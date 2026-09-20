---
title: "When a Site Blocks Text Selection"
featuredImage: "../images/when-site-blocks-text-selection-juan-molina-7hQDelVc08A-unsplash.jpg"
description: "A DevTools console snippet to restore text selection, copy, and right-click on a site that blocks them."
date: "2026-11-01"
category: "javascript"
related:
  - "When the Password Field Says No to Paste"
  - "Access Chrome Bookmarks with Keyboard"
  - "The Code-Adjacent Power of AI"
---

I recently came across a blog post about automated testing best practices. It covered a set of rules, explaining why each should be followed, and a ready-to-use Claude Code skill that enforces those rules automatically when an AI assistant is writing the specs. Exactly the kind of thing a developer might want to copy into into their Claude Code setup.

But when I went to copy the skill section into my own `.claude/skills` directory, my mouse stopped responding. Everywhere I tried to click and drag to highlight text, nothing happened. It felt like the page had suddenly locked up. Right-click did nothing either, no context menu. My heart skipped a beat: was this a broken mouse, or was something actually running on my machine, a crypto miner, ransomware quietly encrypting files while the tab just sat there, unresponsive.

## Ruling Out The Obvious

I opened Chrome's Task Manager (Window > Task Manager) to check CPU and memory for that tab specifically. A background tab pegged at high CPU is the tell for something like a cryptominer, but nothing stood out.

My next thought was was something must be wrong with my mouse. I use a Magic Mouse over Bluetooth, and it does occasionally drop out or get flaky mid-click. So I checked System Settings, saw it was connected fine. I also tried clicking around on other tabs and windows, and the mouse was behaving normally.

Then I thought maybe the page itself was broken, perhaps a JS error left it half-loaded. But hitting browser refresh didn't help, the mouse was still unresponsive, on that page only.

It was at this point I started to suspect something on the site might be deliberately blocking selection, copying, and right-click. What could it possibly be? Curiosity piqued!

![a curious cat peering intently at something](../images/curios-cat.jpg "Curiosity piqued")

## AI Investigation

I pointed Claude Code at the blog post URL, described the copy selection issue, and prompted it to use the [Chrome DevTools MCP server](https://github.com/ChromeDevTools/chrome-devtools-mcp) to figure out what was going on.

<aside class="markdown-aside">
The Chrome DevTools MCP server gives an AI assistant direct control of a fresh, automated Chrome instance. It can load a page, inspect the DOM, read computed styles, list attached event listeners, watch network requests, and run JS in the console. Instead of guessing at markup from a page source dump, the assistant can poke at the actual running page the same way a developer would in their browser developer tools.
</aside>

It pretty quickly found the following:

Firstly, `user-select: none` was set as a CSS rule on `<body>`, blocking all text selection. Additionally, listeners on `contextmenu`, `selectstart`, `copy`, `cut`, `paste`, and `dragstart`, were attached to `document` and `document.body`, each one presumably calling `preventDefault()` to block its action.

Claude was also able to trace the listeners back to their source, which was a script named `wp-security-front-script.js`. This is shipped by [All-In-One Security (AIOS)](https://wordpress.org/plugins/all-in-one-wp-security-and-firewall/), which is a WordPress plugin that adds firewall rules, login lockout after failed attempts, and two-factor authentication. Copy Protection is an optional toggle in this plugins' settings. While not described on the official plugin's page, this [tutorial](https://www.webnots.com/wordpress-all-in-one-wp-security-and-firewall-plugin-tutorial/) shows that enabling Copy Protection will:

> Disable the "Right Click", "Text Selection", and "Copy" option on the front end of your site.

This felt familiar. A while back I wrote about websites that [block pasting into password fields](../password-field-no-paste/). The fix there relied on how event listeners added during the *capture* phase run before listeners added during the normal *bubble* phase, so you can intercept an event before the page's own blocking code ever sees it.

## Undoing It

I pointed Claude at my earlier blog post about paste blocking, then asked it if a similar idea could be used to allow highlight text selection and copy when this plugin was active. I also prompted Claude to actually test the fix with the Chrome DevTools MCP server, against the live page before handing it to me, rather than just describing something that sounded plausible.

It came back with two pieces: a competing CSS rule to override `user-select: none`, and a capture-phase listener to beat the plugin's own event handlers. It confirmed the CSS override took effect, and worked out that the most bulletproof way to neutralize an unknown number of existing listeners was to intercept the events one level higher, on `window`, before they ever reach `document` or `body`.

Claude then provided this snippet to paste into the browser DevTools Console on any page with this kind of blocking:

```js
(function(){
  const style = document.createElement('style');
  style.textContent = '*{user-select:text !important;-webkit-user-select:text !important;}';
  document.documentElement.appendChild(style);

  ['contextmenu','selectstart','copy','cut','paste','dragstart','mousedown','keydown'].forEach(evt => {
    window.addEventListener(evt, e => e.stopPropagation(), true);
  });

  document.oncontextmenu = null;
  document.onselectstart = null;
  document.oncopy = null;
  document.body.oncontextmenu = null;
})();
```

What each part does:

The `<style>` tag fixes selection. `user-select: none` is a CSS rendering rule the browser applies directly, which has the effect of not allowing text to be selected. So this snippet undoes that with a competing CSS rule using `!important`.

`addEventListener`'s third arg is `useCapture`, defaulting to `false` (bubble phase). Setting it to `true` here registers [capture-phase](https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase) listeners on `window` instead, which is the outermost point in the DOM tree an event passes through. Since capture runs top-down (`window` → `document` → `body` → target), calling `stopPropagation()` there stops the event before it ever reaches the plugin's bubble phase listeners on `document` and `body`.

The `on*` assignments at the end are just a fallback, in case anything was wired up as an inline handler instead of via `addEventListener`.

After pasting that into the browser devtools console, copy, right-click, and select-all all worked again as per normal expected browser behaviour.

<aside class="markdown-aside">
Blocking copy-paste on a post that exists to hand readers a code snippet seems like an odd choice. If someone wants it badly enough they can screenshot it, or just <code>curl</code> the raw HTML and hand it to their AI assistant to reconstruct the skill. All it really does is make a basic, expected browser behaviour stop working, enough to make a reader's heart skip a beat wondering if something's broken or they've been hacked.
</aside>

## Takeaway

If you encounter a website with this kind of copy blocking behaviour, try running the snippet in this post. And if that doesn't work, point your AI assistant at it with Chrome DevTools MCP to troubleshoot and solve the issue.
