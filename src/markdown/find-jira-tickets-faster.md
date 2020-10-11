---
title: "Find Jira Tickets Faster"
featuredImage: "../images/search-jira-markus-winkler-afW1hht0NSs-unsplash.jpg"
description: "Use this simple little trick to make finding Jira tickets faster."
date: "2020-10-11"
category: "productivity"
---

A short blog post for today. Just wanted to share a neat trick my colleague showed me recently to find Jira tickets faster, given that you know the ticket number.

## Add Custom Search Engine

To start, open Chrome Settings by clicking on the 3 vertical dots icon from the top right corner of Chrome, then select `Settings`. On a Mac, Settings can be launched with <kbd>Cmd</kbd> + <kbd>,</kbd>. Then click on `Search Engines` from the left menu option. I'm intentionally not including screenshots as Chrome changes the layout regularly. From the options that appear, select `Manage Search Engines`. Then click `Add` button to add a new search engine. Fill in the form as follows:

Search engine: Jira

Keyword: Your project code, for example, if Jira tickets on your project look something like `ABC-123`, then enter `abc` in this field.

URL: Your company's Jira URL, for example `https://jira.acme.com/browse/ABC-%s`. The `%s` is the key here, this will get replaced with the actual ticket number when doing a search.

## Use Custom Search Engine

With this setup, you can simply type in the Chrome address bar: Project code, for example `abc`, then <kbd>tab</kbd>. This will change the address bar to a Search bar. Then type in the ticket number, for example `123`, then <kbd>Enter</kbd>. This will replace the `%s` defined earlier in the search url with the ticket number and navigate to `https://jira.acme.com/browse/ABC-123`.

## Conclusion

If you work in any mid or larger size company, there's a good chance you have to use Jira. It's kind of meh, but at least in this one small way, finding tickets can be more efficient.