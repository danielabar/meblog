---
title: "Capybara Webdriver Element not Clickable Resolved"
featuredImage: "../images/capybara-brian-mcgowan-P1-6ioOcGNU-unsplash.jpg"
description: "Learn how to troubleshoot the Capybara Selenium Webdriver error: element not clickable at point."
date: "2022-08-01"
category: "rails"
related:
  - "Debug Github Actions"
  - "Dockerize a Rails Application for Development"
  - "Rails Feature Test Solved by Regex"
---

This post will walk you through how to troubleshoot the "Element is not clickable at point... Other element would receive the click" error when running Selenium based tests with Capybara. I encountered this recently when a feature test started breaking when running as part of the Continuous Integration checks, which we run with a Github Actions workflow. This was the error message:

```
element click intercepted:
Element <label class="forward-toggle">...</label> is not clickable at point (700, 225).
Other element would receive the click: <div class="row">...</div>
(Session info: headless chrome=101.0.4951.54)
(Selenium::WebDriver::Error::ElementClickInterceptedError)
```

Here is what the test was attempting to do:

```ruby
find("label", text: "FORWARDING").click
```

Which means find an html element `<label>...</label>` on the page that contains the text `FORWARDING` and click on it. See the [Capybara Docs](https://rubydoc.info/github/teamcapybara/capybara/master/Capybara/Node/Finders#find-instance_method) for more details about the `find` method.

Here is the UI that is displayed for this test, this app allows users to manage email mailboxes and optionally update forward settings:

![capybara edit forward 1](../images/capybara-edit-forward-1.png "capybara edit forward 1")

After the test clicks the forwarding toggle, the UI updates to allow entering an email address to forward to and saving changes:

![capybara edit forward 2](../images/capybara-edit-forward-2.png "capybara edit forward 2")

It was very strange that this test started failing, as the area of the code the test was exercising hadn't changed in years, *and* the test was passing when run locally on my laptop.

When encountering this type of situation (test fails on CI but passes locally), first thing to do is determine what's different between CI and laptop setup?

TBD:
* Add TL;DR somewhere near the top re: offsets, then read on for step-by-step troubleshooting
* Where to explain testing stack? This being a Rails project, Capybara is used for the feature tests, with Selenium as the driver.
* Organize into subheadings
* Better image related to broken click? https://unsplash.com/photos/cGXdjyP6-NU, https://unsplash.com/photos/Vqg809B-SrE