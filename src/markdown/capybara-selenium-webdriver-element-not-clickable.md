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

This post will walk you through how to troubleshoot the "Element is not clickable at point... Other element would receive the click" error when running Selenium based tests with Capybara. I encountered this recently when a feature test started breaking when running as part of the Continuous Integration checks on a project I'm working on, which is run with a Github Actions workflow.

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

## What's Changed?

When encountering this type of situation (test fails on CI but passes locally), the first thing to do is determine what's different between CI and laptop setup? My first thought went to browser and driver versions. The code itself hadn't changed, but browser/driver versions are updated constantly so this is a likely culprit.

Looking more closely at the error message, it indicates that Chrome v101 is being used on the Github runner:

```
...
(Session info: headless chrome=101.0.4951.54)
...
```

The next question to ask is: What version is being used locally on my laptop (recall this test was passing locally). The tests are run against a headless Chrome browser which requires a local installation of chromedriver. This project uses the [webdrivers](https://github.com/titusfortner/webdrivers/) gem which automatically downloads the latest version of the driver for the browser being used by the tests. This gem by default downloads drivers to the `~/.webdrivers` directory so you can check what it installed. From my laptop:

```bash
ls ~/.webdrivers
chromedriver chromedriver.version

cat ~/.webdrivers/chromedriver.version
100.0.4896.60
```

Aha! My local had one version (v100) older of chromedriver. In order for webdriver to update to the latest, I opened Chrome on my laptop and selected from the menu: Chrome -> About Google Chrome, which triggered an update to the latest 101. Yes Chrome is auto updating, but I've found that sometimes it requires a little "kick" to get going to the next version.

I then ran the test locally, and this time the webdrivers gem detected Chrome 101, and installed an updated driver for this version. This caused the test to fail, with the same error message as was displayed on CI. This was progress, at least there was consistent behaviour between my laptop and the CI system.

## Coordinates

Next step was to dig in more into the error, I was curious about the specific point reference:

```
Element <label class="forward-toggle">...</label> is not clickable at point (700, 225).
```

This means the test is trying to click at `x` position 700 and `y` position 225 on the page and not finding anything clickable such as an input or link. In terms of Capybara selectors, none of the tests use co-ordinates to select elements because it would be too brittle. Any design change or layout shift would break a test that expected an element to be in a specific location on the page. So why was the test reporting an error about a specific point reference?

To find where this point was on the page, I installed the [coordinates](https://chrome.google.com/webstore/detail/coordinates/bpflbjmbfccblbhlcmlgkajdpoiepmkd) Chrome extension, navigated to the Email Forwarding area of the app and enabled the extension. Here is where point `(700, 225)` occurs on the page:

![capybara edit forward click point](../images/capybara-edit-forward-click-point.png "capybara edit forward click point")

Indeed this is a point of "white space" with nothing clickable in that area. The actual toggle that should be clicked occurs way more to the left and slightly above this point. So that explains why the test reports `not clickable at point (700, 225)`. But *why* is the test trying to click there rather than the toggle that is selected by the test?

## Markup

To investigate further, I needed to take a closer look at the markup for the element the test is trying to click:

![capybara toggle close up](../images/capybara-toggle-close-up.png "capybara toggle close up")

This toggle control is not a native element. The implementation to achieve this effect is to use native `<label>...</label>` and `<input type="checkbox">...</input>` elements, hide the input element, and then style the label to appear like a toggle. Here's the markup for this control:

```html
<div class="row">
  <label class="forward-toggle"> <!-- test tries to click this element -->
    <div class="caption">Enable Forwarding</div>
    <div class="onoff_slide">
        <input type="checkbox" id="forward">
        <label for="forward">...</label>
    </div>
  </label>
</div>
```

Recall that the test is trying to click on the `<label>` element. Let's see what this element looks like when selected in Chrome Developer Tools:

![capybara label selected in dev tools](../images/capybara-label-selected-in-dev-tools.png "capybara label selected in dev tools")

Well that's a surprise, look how wide it is! But actually, this makes sense given the markup. The label is contained in a div that's styled as a row, so it's taking up the entire width of its parent container.

It was at this point that I started to wonder whether the larger than expected size of the label element might have something to do with Capybara reporting there was nothing clickable here.
## Position and Size

Next I wanted to understand where the coordinates from the error message `is not clickable at point (700, 225)` fit in with respect to the label element selected by the test.

Selenium can provide more details about a selected element using the [rect](https://rubydoc.info/github/teamcapybara/capybara/master/Capybara/Node/Element#rect-instance_method) method. This method returns the x and y coordinates of the top left corner of the element, along with its width and height. Here's a temporary modification of the test to output the results of the `rect` method:

```ruby
# temporary debug code to learn more about the element
label_elem = find("label", text: "FORWARDING")
pp label_elem.rect

# original test line that causes test to fail
find("label", text: "FORWARDING").click
```

Here's the output in console from running the test:

```
#<struct Selenium::WebDriver::Rectangle
x=365,
y=205.2578125,
width=670,
height=40>
```

The output is showing that the top left position of the label element occurs at `x` position 365 and `y` position 205. Further, the element is 670 wide by 40 tall. Here's a visual putting this all together, along with the point the text is actually clicking on (x of 700 and y of 225):

![capybara edit forward with points](../images/capybara-edit-forward-with-points.png "capybara edit forward with points")

It *looks* like the test is clicking in the center of the element, but is it really? Some quick arithmetic shows that it is. Starting at the left, the `x` position of 365, plus half the width (670 / 2 = 335) is 700. And starting at the top, the `y` position of 205, plus half the height (40 / 2 = 20) is 225. Recall the error message:

```
Element <label class="forward-toggle">...</label> is not clickable at point (700, 225).
```

So this explains where the point co-ordinates in the error message come from. The next question is *why* does the test click in the center of the element? Recall the line of the test that performs the click is:

```ruby
find("label", text: "FORWARDING").click
```

The `find` method returns an instance of `Capybara::Node::Element`, and then the test invokes the `click` method on the found element. Let's see what the Capybara API docs say about the [click](https://rubydoc.info/github/teamcapybara/capybara/master/Capybara%2FNode%2FElement:click) method:

![capybara click api docs](../images/capybara-click-api-docs.png "capybara click api docs")

Aha! Another mystery solved, the documentation clearly states that the element will be clicked in the middle unless offsets are specified:

> Both x: and y: must be specified if an offset is wanted, if not specified the click will occur at the middle of the element.
## Solution

Now finally we're in a position to solve the problem. If we want the test to click on an element in anywhere other than the center position, the x and y offsets must be provided to the click method. Since the particular UI this test is driving has the actual toggle input near the top left corner, a small amount of offset can resolve this:

```ruby
find("label", text: "FORWARDING").click(x: 5, y: 5)
```

And indeed, running the test with this updated code, both on laptop and the continuous integration workflow passed.

TBD:
* Explain testing stack
* Better feature image related to broken click? https://unsplash.com/photos/cGXdjyP6-NU, https://unsplash.com/photos/Vqg809B-SrE
* Unresolved mystery: Why was click working without offsets prior to Chrome v101? Any clue in ChromeDriver release notes? https://chromedriver.chromium.org/downloads

```
Supports Chrome version 101

Resolved issue 4046: DCHECK hit when appending empty fenced frame [Pri-]

Resolved issue 4080: Switching to nested frame fails [Pri-]
```