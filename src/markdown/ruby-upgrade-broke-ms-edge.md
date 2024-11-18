---
title: "How a Ruby Upgrade Broke MS Edge Support in Our Rails App"
featuredImage: "../images/tbd.jpg"
description: "Discover how upgrading Ruby unexpectedly caused compatibility issues with Microsoft Edge in our Rails app, and learn the debugging steps we took to resolve it."
date: "2025-05-01"
category: "rails"
related:
  - "Capybara Webdriver Element not Clickable Resolved"
  - "Old Ruby and New Mac"
  - "Rails Feature Test Solved by Regex"
---

Recently, I encountered a perplexing issue: customers using Microsoft Edge could no longer access the Rails app I maintain. Instead, they were redirected to our `/unsupported_browser` page, which advises users to switch to Chrome, Firefox, or Safari. This wasn’t just an inconvenience—it was a major blocker for some users who relied exclusively on Edge. Here’s the story of how I debugged and fixed the problem.

## The Issue

A user reported that they were being redirected to the `/unsupported_browser` page on Edge, despite having used the app without issues before. This behavior was unexpected because Microsoft Edge, being Chromium-based since **[insert date]**, is a modern browser and fully compatible with our app.

To understand why Edge users were being blocked, I started by identifying where the `/unsupported_browser` page was being rendered in the Rails app. A quick `bin/rails routes -g "unsupported_browser"` pointed me to `PagesController#unsupported_browser`. From there, I turned to Datadog APM to investigate traffic patterns.

TODO: Shw output of bin/rails routes -g (maybe also aside about this task and -g flag)

## Investigating the Cause

Datadog showed a sharp increase in requests to `PagesController#unsupported_browser` starting around **October 17**

![Datadog traffic spike screenshot]

This just happened to be the exact same date we deployed a Ruby 3.x upgrade.

TODO: Coincidence image

Datadog traces provided the User-Agent strings of affected requests, revealing that the users were indeed on modern, Chromium-based Microsoft Edge. For example:

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/130.0.0.0
```

TODO: Show output of cli user agent parser via npx

I confirmed this by using an online User-Agent parser, which identified the browser as Chromium-based Edge. To reproduce the issue, I configured my Chrome browser to send the same User-Agent string using Chrome DevTools’ **Network Conditions** panel. Upon refreshing the app, I was redirected to `/unsupported_browser`—the issue was reproducible.

## Digging Into the Code

Our app uses the `browsernizer` gem (which depends on the `browser` gem) to detect browsers and redirect unsupported ones. Reviewing the `Gemfile.lock` changes from the Ruby upgrade revealed that while `browsernizer` hadn’t changed, its dependency, `browser`, was updated from version 2.2.0 to 2.7.1.

TODO: Image of git diff

In our `browsernizer` configuration:

```ruby
Rails.application.config.middleware.use Browsernizer::Router do |config|
  config.supported "Internet Explorer", false
  config.supported "Microsoft Edge", false

  config.location  "/unsupported_browser"
  config.exclude   %r{^/assets}
end
```
At first glance, it appeared that Edge was intentionally marked as unsupported. However, this configuration was introduced eight years ago, back when Edge was more like Internet Explorer. At the time, this rule made sense.

TODO: Explain about Backbone/Marionette front end for legacy app and known issues with older browsers such as IE8.

With the older `browser` gem (v2.2.0), Chromium-based Edge wasn’t recognized as "Microsoft Edge" due to differences in User-Agent parsing. This unintentional gap allowed Chromium-based Edge users to bypass the block. After the Ruby upgrade, the newer `browser` gem (v2.7.1) correctly identified all Edge browsers—Chromium-based or not—triggering the block for all versions of Edge.

TODO: Better explanation of above? Maybe dig into 2.2.0 code...

## Implementing the Fix

The real requirement was to:
1. Block Internet Explorer.
2. Block non-Chromium-based Edge.
3. Allow all Chromium-based browsers, including modern Edge.

Unfortunately, the `browsernizer` gem hasn’t been updated to support the latest `browser` gem versions, where a convenient `chromium_based?` method exists. To work around this, I implemented a custom check for Chromium-based Edge in our browsernizer configuration:

```ruby
Rails.application.config.middleware.use Browsernizer::Router do |config|
  config.supported "Internet Explorer", false

  config.supported do |browser|
    if browser.edge?
      browser.ua.match?(/\bEdg\b/) # Allow Chromium-based Edge
    else
      true
    end
  end

  config.location  "/unsupported_browser"
  config.exclude   %r{^/assets}
end
```

## Ensuring the Bug Stays Fixed

But it's not enough to just deliver a code fix. The question had to be asked: Why didn't any test fail back when the Ruby upgrade was being performed?

This project does have decent system/feature test coverage with Capybara and Cuprite (TODO: Link, JS driver for Capybara, pure Ruby, no Selenium webdriver/chromedriver etc. simpler to setup). But Cuprite JS driver is Chrome only, so at first glance, it seems like it wouldn't be possible to have an automated test to verify chromium-based MS Edge is allowed.

However, remembering my earlier experiment with Chrome dev tools to simulate the error condition, I had an idea that maybe the same thing could be done with a feature test, if there was a way to modify the user agent string sent in request header.

It turns out, Cuprite does indeed support modifying request headers! https://github.com/rubycdp/cuprite?tab=readme-ov-file#request-headers. The code sample they provide helpfully includes an example for changing the user agent string, which is exactly what I wanted to do:

```ruby
page.driver.headers # => {}
page.driver.headers = { "User-Agent" => "Cuprite" }
page.driver.add_headers("Referer" => "https://example.com")
page.driver.headers # => { "User-Agent" => "Cuprite", "Referer" => "https://example.com" }
```

This allowed me to write a test to simulate a user visiting the root path "/" from any number of different browsers, differentiated only by the user agent string. If a browser is supported, then the test expects that the user should be redirected to "/login", otherwise, "/unsupported_browser". And here is the test - this ensures that this particular bug should never happen again, even if there are future updates to browsernizer and/or the browser gems:

```ruby
# spec/features/user_agent_spec.rb
require "rails_helper"

feature "Browser support based on User Agent", :js do
  def visit_with_user_agent(user_agent)
    page.driver.headers = { "User-Agent" => user_agent }
    visit "/"
  end

  scenario "Old Edge (non-Chromium) should not be allowed" do
    old_edge_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/16.16299"
    visit_with_user_agent(old_edge_ua)
    expect(page).to have_current_path("/unsupported_browser")
  end

  scenario "New Edge (Chromium-based) should be allowed" do
    new_edge_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
    visit_with_user_agent(new_edge_ua)
    expect(page).to have_current_path("/login")
  end

  scenario "Chrome should be allowed" do
    chrome_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    visit_with_user_agent(chrome_ua)
    expect(page).to have_current_path("/login")
  end

  scenario "Firefox should be allowed" do
    firefox_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0"
    visit_with_user_agent(firefox_ua)
    expect(page).to have_current_path("/login")
  end

  scenario "Safari should be allowed" do
    safari_ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
    visit_with_user_agent(safari_ua)
    expect(page).to have_current_path("/login")
  end

  scenario "Internet Explorer should not be allowed" do
    ie_ua = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)"
    visit_with_user_agent(ie_ua)
    expect(page).to have_current_path("/unsupported_browser")
  end
end
```

These tests ensure that future updates won’t reintroduce the bug.

## Lessons Learned

1. **Legacy Configurations Need Periodic Reviews**: The `browsernizer` configuration was a time bomb waiting for the right conditions to trigger issues.
2. **Test Browser Compatibility**: Incorporating tests with simulated User-Agent strings is invaluable for avoiding browser-specific regressions.
3. **Keep Dependencies Up-to-Date**: Stagnant gems like `browsernizer` can lead to tech debt and compatibility issues.
4. **Debugging Tools Are Your Friend**: Chrome DevTools’ ability to simulate User-Agent strings was critical to reproducing the issue.

## TODO
* feature image
* maybe one of related should be datadog apm on heroku rails
* edit
* integrate notes from `~/Documents/tech/blog-research/blog-ideas.md`
* exact date when MS Edge switched to chromium?
* Consistency in browser naming re: Edge, MS Edge, Microsoft Edge.
* Explain what browsernizer and browser gems do
* Aside: Datadog/APM terminology - link to a good learning resource for those unfamiliar
* Dig into code differences on browser 2.2.0 v 2.7.1 wrt Microsoft Edge
* Aside: Mention browsernizer hasn't been updated in 8 years, careful with bringing in gems that don't get regularly updated, we may in the future want to remove this dependency and use browser gem directly for browser detection.
* Conclusion or maybe call it Lessons Learned - careful with bringing in gems that may no longer be maintained, especially if all they do is provide a lightweight wrapper around a well-maintained/popular gem. Do maintain the system tests as much as possible, because relying on manual testing will slow you down tremendously as app size grows. Anything else?
