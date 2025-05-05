---
title: "Capture Browser Console Logs in Rails System Tests with Capybara and Cuprite"
featuredImage: "../images/capture-browser-console-logs-elena-mozhvilo-AI17tJHgIJ8-unsplash.jpg"
description: "Learn how to capture browser console logs in Rails system tests using Capybara and Cuprite, and debug JavaScript issues without slowing down test execution."
date: "2025-07-01"
category: "rails"
related:
  - "Debug Github Actions"
  - "Capybara Webdriver Element not Clickable Resolved"
  - "Rails Feature Test Solved by Regex"
---

When writing Rails system tests, a common practice is to use [Capybara](https://teamcapybara.github.io/capybara/) to simulate user interactions. If the front end is a JavaScript-heavy Single Page Application (SPA), this also requires installing and configuring a JavaScript driver for Capybara, such as [Cuprite](https://github.com/rubycdp/cuprite), to test JavaScript execution in the browser.

When testing a SPAs, it can be challenging to understand how different pieces of code are interacting or when certain code is executing. In cases where unexpected behavior arises during test execution, such as event handling issues or timing problems, adding `console.log` statements at strategic points in the front-end code can help. But how do you capture and view those logs while running Rails system tests?

Unfortunately, the Cuprite and [Ferrum](https://github.com/rubycdp/ferrum) (the underlying driver for Cuprite) documentation doesn’t make this immediately clear. So in this post, I’ll walk you through why capturing browser console logs is useful and how to configure your tests to capture those logs.

## Why Capture Browser Console Logs?

Imagine a scenario where one of your system tests fails intermittently and you're pretty sure the issue is in some unexpected JavaScript execution. You’ve added some `console.log(...)` statements in your app to debug the issue. However, in headless mode, it’s not obvious how to access these logs. For example, somewhere in the front end JavaScript:

```javascript
// app/javascript/some_code.js
console.log("==== ROUTER NAVIGATE FINISHED")
```

You might consider running the test with a non-headless browser (like Chrome) and use debugging tools (such as `binding.pry` in the system test) to inspect the console. But there’s a problem with this approach: debugging mode often slows down the browser, giving your JavaScript more time to execute. In this case, the timing-related issue may not occur, and the test passes – masking the real problem.

To truly replicate the failure, you need to capture the browser’s console logs while running the test at full speed. This requires a method to redirect `console.log` output from the browser to your test environment.

## Solution

Here’s how you can configure the Cuprite driver to capture the browser console logs:

1. **Modify your Capybara driver configuration** to add a `StringIO` logger.
2. **Access the logs in your tests** after executing the desired page actions.
3. **Output the captured logs** for inspection.

### Step 1: Modify the Capybara Driver

To capture the logs, define a logger using [StringIO](https://docs.ruby-lang.org/en/3.2/StringIO.html) when registering the Cuprite driver. This is done by modifying the Capybara configuration in `spec/support/capybara.rb`:

```ruby
# spec/support/capybara.rb
Capybara.register_driver :cuprite do |app|
  # === Capture console.log from the browser ===
  logger = StringIO.new

  Capybara::Cuprite::Driver.new(
    app,
    window_size: [1440, 900],
    timeout: 5,
    # other config ...
    # === Pass in the logger to capture console logs ===
    logger: logger
  )
end
```

In this configuration, the `StringIO` logger will capture all browser console output during the test execution.

### Step 2: Use the Logger in Your Test

Now that the Cuprite driver is set up to capture the logs, these can be accessed from tests. Here’s an example:

```ruby
# spec/features/some_spec.rb
it "Does something" do
  # Visit the relevant page or trigger the action
  visit some_path

  # Perform some interaction that causes JavaScript to execute
  click_button "Some Action"

  # Capture browser console logs
  logs = page.driver.browser.options.logger.string
  puts "BROWSER LOGS CAPTURED FROM TEST: #{logs}"

  # Some test expectation
  expect(URI.parse(page.current_url).request_uri).to eql("/account")
end
```

In this test, after visiting the page and triggering any JavaScript behavior, you extract the captured logs from the `logger.string` attribute and print them out. This helps you debug JavaScript issues without slowing down the test execution.

### Step 3: Manage the Log Output

The captured output is often massive, as it includes not only the `console.log` statements you added but also a lot of internal browser output. To manage this, you can pipe the output into your clipboard or redirect it to a text file for easier inspection. Here’s how to do that on a Mac:

```bash
bin/rspec spec/features/some_spec.rb | pbcopy
```

Once the output is in your clipboard or saved in a file, you can search for the specific logs you’re interested in. Look for occurrences of `Runtime.consoleAPICalled`:

```json
{
  "method": "Runtime.consoleAPICalled",
  "params": {
    "type": "log",
    "args": [
      {
        "type": "string",
        "value": "==== ROUTER NAVIGATE FINISHED:"
      }
    ]
  }
}
```

This is an example of a `console.log` statement captured during the test. You can now inspect these logs for clues as to what went wrong, such as whether your expected JavaScript code is actually running.

Another option is to filter the log lines you're interested in directly in the test, for example:

```ruby
# spec/features/some_spec.rb
it "Does something" do
  # Visit the relevant page or trigger the action
  visit some_path

  # Perform any interactions or assertions before capturing logs
  click_button "Some Action"

  # Get full log output
  logs = page.driver.browser.options.logger.string

  # Filter only the relevant lines
  matching_logs = logs.lines.select { |line| line.include?("=== ROUTER") }

  puts "FILTERED BROWSER LOGS:"
  puts matching_logs

  # Some test expectation
  expect(URI.parse(page.current_url).request_uri).to eql("/account")
end
```

## Exploring Cuprite Source

Earlier I mentioned that it wasn't obvious from the Cuprite documentation how to do this. However, since the project is open source, a great way to dig deeper is to search the source and test suite. By searching for `console.log` within the Cuprite codebase, I found a [test case](https://github.com/rubycdp/cuprite/blob/503179f8f210c9d431f7f62bc20a68812cffd0e3/spec/features/driver_spec.rb#L53-L69) that demonstrated how to capture console logs using a `StringIO` logger. This example in the Cuprite driver’s spec file confirmed that capturing browser logs during system tests was indeed possible:

```ruby
# cuprite/spec/features/driver_spec.rb
context "output redirection" do
  let(:logger) { StringIO.new }
  let(:session) { Capybara::Session.new(:cuprite_with_logger, TestApp) }

  before do
    Capybara.register_driver(:cuprite_with_logger) do |app|
      Capybara::Cuprite::Driver.new(app, logger: logger)
    end
  end

  after { session.driver.quit }

  it "supports capturing console.log" do
    session.visit("/cuprite/console_log")
    expect(logger.string).to include("Hello world")
  end
end
```

Lesson learned: If you're ever in doubt, remember that reading through the source code and tests can reveal a wealth of information!

## Conclusion

Capturing browser console logs in Rails system tests with Capybara and Cuprite is a useful way to debug JavaScript timing issues without slowing down your tests. By modifying the driver configuration to include a `StringIO` logger, you can access all `console.log` output during test execution. Just be mindful that the captured output can be quite large, so redirecting it to a file or filtering within the test is recommended.

This approach allows you to debug in real-world conditions, ensuring that the JS in your app behaves as expected under full-speed test runs.
