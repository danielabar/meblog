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

This post will walk you through how to troubleshoot the "Element is not clickable at point... Other element would receive the click" error when running Selenium based tests with Capybara. I encountered this recently when a feature test started breaking when running as part of the Continuous Integration checks, which we run with a Github Actions workflow.

## Test Failure

This was the error message:

```
element click intercepted:
Element <label class="forward-toggle">...</label> is not clickable at point (700, 225).
Other element would receive the click: <div class="row">...</div>
(Session info: headless chrome=101.0.4951.54)
(Selenium::WebDriver::Error::ElementClickInterceptedError)
```

The error message was coming from this line in the test:

```ruby
find("label", text: "FORWARDING").click
```

Which means find an html element `<label>...</label>` on the page that contains the text `FORWARDING` and click on it. See the [Capybara Docs](https://rubydoc.info/github/teamcapybara/capybara/master/Capybara/Node/Finders#find-instance_method) for more details about the `find` method.

Here is the UI that is exercised for this test. This app allows users to manage email mailboxes and optionally update forward settings:

![capybara edit forward 1](../images/capybara-edit-forward-1.png "capybara edit forward 1")

After the test clicks the forwarding toggle, the UI updates to allow entering an email address to forward to and saving changes:

![capybara edit forward 2](../images/capybara-edit-forward-2.png "capybara edit forward 2")

It was very strange that this test started failing, as the mailbox management area of the code hadn't changed in years, *and* the test was passing when run locally on my laptop.

## Testing Stack

WIP...

Before getting further into troubleshooting, a brief description of our testing stack...

This being a Rails project, Capybara is used for the feature tests, with Selenium as the driver...

## Chromedriver

When encountering this type of situation (test fails on CI but passes locally), first thing to do is determine what's different between CI and laptop setup? My first thought went to browser and driver versions. The code itself hadn't changed, but browser/driver versions are updated constantly. Looking more closely at the error message, it indicates that Chrome v101 is being used on the Github runner:

```
...
(Session info: headless chrome=101.0.4951.54)
...
```

The next question to ask is: What version is being used locally on my laptop (recall this test was passing locally). The tests are run against a headless Chrome browser which requires a local installation of chromedriver. We use the [webdrivers](https://github.com/titusfortner/webdrivers/) gem which automatically downloads the latest version of the driver for the browser being used by the tests. This gem by default downloads drivers to the `~/.webdrivers` directory so you can check what it installed. From my laptop:

```bash
ls ~/.webdrivers
chromedriver chromedriver.version

cat ~/.webdrivers/chromedriver.version
100.0.4896.60
```

Aha, my local had one version (v100) older of chromedriver. In order for webdriver to update to the latest, I opened Chrome on my laptop and selected from the menu: Chrome -> About Google Chrome, which kicked off an update to the latest 101. Yes Chrome is auto updating, but I've found that sometimes it requires a little "kick" to get going to the next version.

I then ran this test locally, and it failed, with the same error message as was displayed on CI. This was progress, at least there was consistent behaviour between laptop and the CI system.

## Coordinates

Next step was to dig in more into the error, I was curious about the specific point reference:

```
Element <label class="forward-toggle">...</label> is not clickable at point (700, 225).
```

This means the test is trying to click at `x` position 700 and `y` position 225 on the page and not finding anything clickable such as an input or link. In terms of Capybara selectors, none of the tests use co-ordinates to select elements because it would be too brittle. Any design change or layout shift would break a test that expected an element to be in a specific location on the page. So why was the test reporting an error about a specific point reference?

To easily find where this point was on the page, I installed the [coordinates](https://chrome.google.com/webstore/detail/coordinates/bpflbjmbfccblbhlcmlgkajdpoiepmkd) Chrome extension, navigated to the Email Forwarding area of the app and enabled the extension. Here is where point `(700, 225)` occurs on the page:

![capybara edit forward click point](../images/capybara-edit-forward-click-point.png "capybara edit forward click point")

Indeed this is a point of "white space" with nothing clickable in that area. The actual toggle that should be clicked occurs way more to the left and slightly above this point. So that explains why the test reports `not clickable at point (700, 225)`. But *why* is the test trying to click there rather than the toggle that is selected by the test?

## Selector and Click

WIP...

Next step was to understand what exactly the test was selecting for click...
Explain about label/input hide input and style label to make toggle...
Show image from devtools, notice how wide label is...
Show temp debug capybara code to get `rect` and output point
Interesting that x + half width and y + half height = 700, 225 - exact center of label

TBD:
* Add TL;DR somewhere near the top re: offsets, then read on for step-by-step troubleshooting
* Better feature image related to broken click? https://unsplash.com/photos/cGXdjyP6-NU, https://unsplash.com/photos/Vqg809B-SrE