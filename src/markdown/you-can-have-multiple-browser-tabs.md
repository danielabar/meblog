---
title: "You can have your Browser Tabs and use them too"
featuredImage: "../images/multiple-tabs-cake-annie-spratt-6SHd7Q-l1UQ-unsplash.jpg"
description: "A simple Chrome trick to efficiently manage a large number of tabs."
date: "2022-06-01"
category: "productivity"
related:
  - "Automate Tabs & Commands in iTerm2"
  - "Find Jira Tickets Faster"
  - "Access Chrome Bookmarks with Keyboard"
---

I decided to write this after hearing a discussion about the difficulties of managing multiple browser tabs on one of the programming podcasts I listen to. The idea being that during web development, you'd have one tab open for the app you're building, something like `http://localhost:3000`, and then numerous other tabs for every problem you encounter. If you're doing fullstack dev, this can get especially large as you may have run into issues with the database, server side framework/language, client side JavaScript, CSS, etc. The tendency is not to close these tabs just in case they're needed again. But after a while, the tab icons become so small and so numerous, it can get difficult to navigate to the one you want and will inevitably click on the wrong one, wasting some time.

On the podcast I was listening to, the hosts suggestion was to close the tabs when you're done with them as you can always find them again later if they're really needed. In this post, I'd like to suggest an alternative solution that I prefer that supports managing as many tabs as you'd like to have open, while being able to easily and accurately navigate to them, mouse clicking not required. Note that I'm using the Chrome browser.

## A Mess of Tabs

To start, suppose you currently have a `localhost` tab open for development, with many other tabs that you've opened for various research and problem solving. The top of your browser will look something like this - a whole mess of tiny tabs, the more you open, the "squishier" they appear to try and fit in:
![Multiple Browser Tabs Top](../images/multiple-browser-tabs-top.png "Multiple Browser Tabs Top")

## Search Tabs

One of these tabs is for some GraphQL documentation and now you'd like to switch to that one. Instead of mousing over the tiny icons trying to guess which tab it is, you can use a new-ish feature Chrome added called "Search Tabs". The keyboard shortcut is: <kbd class="markdown-kbd">Cmd</kbd> + <kbd class="markdown-kbd">Shift</kbd> + <kbd class="markdown-kbd">A</kbd>, or <kbd class="markdown-kbd">Ctrl</kbd> for Windows users.

After using this shortcut, you will see a selection menu open up at the top right of the browser window, containing a vertical listing all the open tabs (except for the one you're currently on). Each selection in the menu displays the tab title and url. Tabs are listed in order of most recent use. For example:

![Multiple Browser Tabs Select](../images/multiple-browser-tabs-select.png "Multiple Browser Tabs Select")

## Select Tabs

To make use of the tab selection menu, you can use the mouse to click on the tab title you want to open from this menu, *or* simply start typing, for example typing "graph" will filter the list down to tab titles or urls that match what you typed in:

![Multiple Browser Tabs Type](../images/multiple-browser-tabs-type.png "Multiple Browser Tabs Type")

In the example above, two results are matched. At this point, you can either keep typing, for example "ql" to match exactly, or use the down arrow and hit <kbd class="markdown-kbd">Enter</kbd> to action the selection:

![Multiple Browser Tabs Down Arrow](../images/multiple-browser-tabs-down-arrow.png "Multiple Browser Tabs Down Arrow")

At this point, the browser will switch to the tab you selected from the Search Tabs menu.

## Switch to Most Recently Used Tab

TBD rough outline:
* Now on GraphQL Query options tab, suppose want to switch back to localhost (common workflow, working on local development, switch to figure something out like docs, SO etc, update code, then go back to localhost tab)
* Cmd + Shift + A, It remembers the most recent tab you were on, figuring that's where you're most likely to want to go back to: multiple-browser-tabs-remember-previous.png
* Also mention can click on down caret at top right (screenshot?) for those who don't want to memorize yet another keyboard shortcut: multiple-browser-tabs-down-caret.png (TODO: Draw arrow on this screenshot)
* Add note about recovering accidentally closed tab
* Also mention the other technique via indexing chrome bookmarks reference my previous article
* Maybe also mention tab groups, but for me that's too much clicking and mental overhead to have to create and remember them: https://www.lifewire.com/group-tabs-in-chrome-5221144
* Maybe somewhere acknowledge FF/vertical tabs but my preferred workflow is Chrome, don't want to switch browsers just for a different tab management system?