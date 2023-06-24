---
title: "Configurable Retry with Ruby"
featuredImage: "../images/tbd.jpg"
description: "tbd"
date: "2023-11-01"
category: "ruby"
related:
  - "tbd"
  - "tbd"
  - "tbd"
---

Rough brainstorming notes...

# Configurable Retry

Why not just use Ruby's [retry](https://docs.ruby-lang.org/en/3.2/syntax/exceptions_rdoc.html)?

In Ruby, the `retry` method is used to repeat the execution of a block of code within a `rescue` clause. It allows you to handle and recover from exceptions by retrying the failed operation.

Here's an example usage of the `retry` method:

```ruby
class FileReader
  def initialize(file_path)
    @file_path = file_path
    @attempt = 0
  end

  def read_file_with_retry
    begin
      file_contents = File.read(@file_path)
      puts "File read successful!"
      # Further processing of file contents
    rescue Errno::ENOENT
      handle_file_not_found
    end
  end

  private

  def handle_file_not_found
    puts "File not found."

    @attempt += 1
    if @attempt < 3
      puts "Retrying..."
      read_file_with_retry  # Retry the file reading operation
    else
      puts "Max retry attempts reached."
    end
  end
end

# Usage:
file_reader = FileReader.new("example.txt")
file_reader.read_file_with_retry
```

In this example, we attempt to read the contents of a file called "example.txt". If the file doesn't exist, Ruby raises an `Errno::ENOENT` exception, which is rescued by the `rescue` clause.

Inside the `rescue` block, we increment the `attempt` counter and check if it's less than 3. If it is, we output a message indicating that we're retrying, and then we use the `retry` keyword to re-execute the entire `begin` block, including the file reading operation.

The `retry` keyword causes the program flow to go back to the beginning of the `begin` block, and the file reading operation is attempted again. If it fails again, the `rescue` clause is triggered, and the process repeats until either the operation succeeds or the maximum number of retry attempts is reached.

Note that the `retry` method can only be used within a `rescue` clause, as it relies on the context of handling exceptions.

This works but there's a lot of boilerplate. Having the retry and attempt counting logic intermingled with the actual business logic makes it difficult to quickly scan this method and determine what its true purpose is. Further, what if you need this logic in many methods throughout the code? What if some types of calls should only be re-attempted once and others multiple times?

## More Flexibility and Reuse

```ruby
# app/services/retryable.rb

# For a Rails project, ActiveSupport would be auto loaded
require "active_support/all"
require "timeout"

module Retryable
  # Retries the execution of a block of code with retry logic.
  #
  # @param [Array<Exception>] args The list of exceptions that should trigger a retry.
  # @param [Hash] options The options for retrying the code block.
  # @option options [Integer] :limit (3) The maximum number of retry attempts.
  # @option options [Integer] :timeout_in The maximum time in seconds to wait for each retry attempt.
  # @yield The block of code to be executed.
  #
  # @example Retry the code block with a specific exception and a custom limit:
  #   Retryable.with_retries(Errno::ENOENT, limit: 5) do
  #     # Code to be retried if Errno::ENOENT is raised
  #   end
  #
  # @example Retry the code block with default exceptions and a timeout:
  #   Retryable.with_retries(limit: 3, timeout_in: 10) do
  #     # Code to be retried if StandardError or Timeout::Error is raised,
  #     # with a maximum of 3 retries and a timeout of 10 seconds.
  #   end
  #
  # @example Retry the code block with default options:
  #   Retryable.with_retries do
  #     # Code to be retried if StandardError or Timeout::Error is raised,
  #     # with a maximum of 3 retries and no timeout.
  #   end
  #
  # @example Retry the code block with multiple exceptions:
  #   Retryable.with_retries(Errno::ECONNRESET, Errno::ETIMEDOUT, limit: 5) do
  #     # Code to be retried if Errno::ECONNRESET or Errno::ETIMEDOUT is raised,
  #     # with a maximum of 5 retries and no timeout.
  #   end
  #
  def self.with_retries(*args)
    options = args.extract_options!
    exceptions = args

    options[:limit] ||= 3
    exceptions = [StandardError, Timeout::Error] if exceptions.empty?

    retried = 0
    begin
      if options[:timeout_in]
        Timeout.timeout(options[:timeout_in]) do
          puts "=== DEBUG: attempt..."
          return yield
        end
      else
        yield
      end
    rescue *exceptions => e
      if retried >= options[:limit]
        puts "Retryable failed after #{options[:limit]} retry(ies), exception: #{e}"
        raise e
      end

      retried += 1
      retry
    end
  end
end
```
## Benefits

The provided code defines a module called `Retryable` in a Ruby project. This module contains a method `with_retries` that allows for retrying a block of code in case of specified exceptions. This custom implementation offers some additional features compared to Ruby's built-in `retry` method. Here are a few points to consider:

1. **Customizable retry limit**: The `with_retries` method allows you to specify the maximum number of retry attempts through the `limit` option. This provides flexibility in controlling the number of retries, whereas Ruby's `retry` method is limited to a fixed number of retries.

2. **Handling specific exceptions**: The `with_retries` method allows you to specify a list of exceptions to rescue and retry on. If no specific exceptions are provided, it defaults to rescuing `StandardError` and `Timeout::Error`. In contrast, Ruby's `retry` method retries the block only when encountering an exception caught by the `rescue` clause.

3. **Timeout option**: The `with_retries` method supports a `timeout_in` option, which can be used to specify a time limit for each retry attempt using the `Timeout` module. This is useful when you want to ensure that the retried operation doesn't take too long. Ruby's `retry` method doesn't provide built-in timeout functionality.

4. **Logging and error reporting**: The custom implementation includes logging and error reporting using methods like `Rails.logger.error` and `Rollbar.log`. This allows you to capture information about the retries, the retry limit, the timeout, and the exceptions encountered. Ruby's `retry` method doesn't provide built-in logging or reporting features.

Overall, the custom `Retryable` module provides more flexibility and additional features compared to Ruby's `retry` method. It allows you to control the retry limit, specify exceptions to handle, add timeouts, and log/report retry attempts. However, the choice between using the custom module or the built-in `retry` method depends on the specific requirements and complexity of your code.

## Explanation

Here's an explanation of how the code works:

- The `with_retries` method accepts variable arguments (`*args`), which can include exceptions to be rescued and options for retry behavior.
- The method extracts the options from the arguments using `args.extract_options!` and assigns them to the `options` variable. The remaining arguments are assumed to be exceptions to be rescued and are assigned to the `exceptions` variable.
- If the `:limit` option is not provided in the `options` hash, it defaults to 3.
- If no exceptions are specified in the arguments, the `exceptions` variable is set to `[StandardError, Timeout::Error]`.
- The `retried` variable is initialized to 0 to keep track of the number of retries.
- The method then begins a `begin-rescue` block. If the `:timeout_in` option is provided in the `options` hash, the code is executed within a timeout using `Timeout.timeout` for the specified duration. If there is no timeout, the code is executed normally.
- If an exception occurs during execution, it is captured and assigned to the variable `e`.
- If the number of retries (`retried`) exceeds the specified limit (`options[:limit]`), an error message or log is generated (assuming there is a Rails logger or a Rollbar logger available), including information such as the number of retries, limit, timeout duration, and the exception that caused the failure.
- Finally, if the number of retries is below the limit, the `retried` counter is incremented, and the code execution is retried from the beginning using the `retry` keyword.

### More in depth on *args:

In the `Retryable` module's `with_retries` method, the asterisk (`*`) before the `args` parameter is known as the "splat" operator. It allows the method to accept a variable number of arguments as an array.

With the `*args` parameter, the caller can pass zero or more arguments to the `with_retries` method. These arguments are captured in the `args` array, which can then be further processed within the method.

The different arguments that a caller can pass to the `with_retries` method include:

1. `limit: <integer>`: Specifies the maximum number of retry attempts. For example: `with_retries(limit: 3)` will allow up to 3 retry attempts.

2. `exceptions: <array of exceptions>`: Specifies the list of exceptions to be rescued and retried. For example: `with_retries(exceptions: [Errno::ENOENT, Timeout::Error])` will rescue and retry when encountering `Errno::ENOENT` or `Timeout::Error` exceptions.

3. `timeout_in: <numeric>`: Specifies the timeout duration for each retry attempt. The value should be in seconds. For example: `with_retries(timeout_in: 5)` sets a timeout of 5 seconds for each retry attempt.

Additionally, the caller can pass any other arguments that might be needed within the block of code to be retried. These arguments will be received as part of the `args` array and can be accessed within the `yield` statement.

It's important to note that the `with_retries` method expects the options (such as `limit`, `exceptions`, `timeout_in`) to be passed as keyword arguments. This means they should be provided in the form of `key: value` pairs when calling the method.

### More in depth on *exception:

In the line `rescue *exceptions => e`, the asterisk (*) is again being used as the splat operator, but in a slightly different context.

In this case, `exceptions` is an array of exception classes, and the splat operator is used to "splat" or expand the array into multiple arguments. The purpose is to specify a list of exceptions that should be rescued and handled by the `rescue` block.

When an exception is raised within the `begin` block, the `rescue` block attempts to match the raised exception against the list of exceptions specified with the splat operator. If a match is found, the code within the `rescue` block will be executed.

Here's a breakdown of the line:

- `*exceptions` - The splat operator is used to expand the `exceptions` array into individual arguments. For example, if `exceptions` contains `[Errno::ENOENT, Errno::ECONNRESET]`, it will be expanded to `Errno::ENOENT, Errno::ECONNRESET`.
- `=> e` - This syntax assigns the rescued exception to the variable `e`. The `rescue` block will catch any exceptions specified by the splatted `exceptions` list and assign the caught exception to the variable `e`, allowing further handling or processing within the block.

Here's an example to illustrate the usage:

```ruby
exceptions = [Errno::ENOENT, Errno::ECONNRESET]

begin
  # Code that may raise exceptions
rescue *exceptions => e
  # Handle the rescued exception
  puts "Rescued exception: #{e}"
end
```

In this example, if an `Errno::ENOENT` or `Errno::ECONNRESET` exception is raised within the `begin` block, it will be caught by the `rescue` block, and the code within the `rescue` block will execute, printing the rescued exception to the console.

### More in depth on extract_options

The `extract_options!` method is not part of the Ruby standard library, but rather a method commonly used in Rails projects. It is an extension provided by ActiveSupport, which is a Ruby library that extends the core Ruby classes with additional utility methods.

The `extract_options!` method is typically used to extract a hash of options from the last element of an array, removing the options from the array in the process. This is a convenient way to handle method arguments that accept both positional arguments and an options hash.

In a Rails project, ActiveSupport is automatically included, so you can use `extract_options!` without explicitly requiring any additional gems. However, in plain Ruby without Rails or ActiveSupport, the `extract_options!` method is not available.

If you want to use `extract_options!`-like functionality in plain Ruby, add to Gemfile:

```
gem 'activesupport'
```

Then require it in code:

```
require 'active_support/all'
```

## Example usage

```ruby
class MyService
  include Retryable

  def perform_operation
    Retryable.with_retries(limit: 5, timeout_in: 10) do
      # Code block to be retried
      perform_network_request
    end
  end

  private

  def perform_network_request
    # Simulating a network request that may raise an exception
    # or timeout
    raise StandardError, "Network error" if rand > 0.5
    puts "Network request successful!"
  end
end

service = MyService.new
service.perform_operation
```

In this example, the `perform_operation` method of the `MyService` class includes the `Retryable` module and uses the `with_retries` method. It specifies a limit of 5 retries and a timeout of 10 seconds. The code block within the `with_retries` block represents a network request that may raise an exception or timeout. If an exception occurs or the request times out, the code will be retried up to the specified limit.

Rewrite file reader using Retryable module:

```ruby
# require "timeout"
require "retryable"

class FileReader
  include Retryable

  def initialize(file_path)
    @file_path = file_path
  end

  def read_file_with_retry
    with_retries(limit: 3, exceptions: [Errno::ENOENT]) do
      file_contents = File.read(@file_path)
      puts "File read successful!"
      # Further processing of file contents
    end
  end

  private

  def with_retries(*args, &block)
    Retryable.with_retries(*args, &block)
  end
end

# Usage:
file_reader = FileReader.new("example.txt")
file_reader.read_file_with_retry
```

## Tests

```ruby
require "timeout"
require_relative "retryable"

RSpec.describe Retryable do
  class TestClass
    include Retryable

    def perform_retryable_operation(limit, timeout_in, raise_exception = false)
      Retryable.with_retries(limit: limit, timeout_in: timeout_in) do
        raise StandardError, "Custom exception" if raise_exception
        return "Success"
      end
    end
  end

  describe ".with_retries" do
    let(:test_class) { TestClass.new }

    context "when the operation succeeds without exceptions" do
      it "returns the expected result" do
        result = test_class.perform_retryable_operation(3, 10)
        expect(result).to eq("Success")
      end
    end

    context "when the operation raises a custom exception" do
      it "retries and raises the exception" do
        expect {
          test_class.perform_retryable_operation(3, 10, true)
        }.to raise_error(StandardError, "Custom exception")
      end
    end

    context "when the operation times out" do
      it "retries and raises a Timeout::Error" do
        expect {
          test_class.perform_retryable_operation(3, 1)
        }.to raise_error(Timeout::Error)
      end
    end

    context "when the retry limit is reached" do
      it "raises the exception without retrying" do
        expect {
          test_class.perform_retryable_operation(2, 10, true)
        }.to raise_error(StandardError, "Custom exception")
      end
    end
  end
end
```

In this example, we have an RSpec test suite for the `Retryable` module. We define a `TestClass` that includes the `Retryable` module and has a method `perform_retryable_operation` which utilizes `Retryable.with_retries` for the purpose of testing.

We then have different contexts within the `describe ".with_retries"` block to cover different scenarios:

1. The operation succeeds without exceptions.
2. The operation raises a custom exception.
3. The operation times out.
4. The retry limit is reached without success.

## TODO

* Intro para
* Subsection organization
* Write a simpler `with_retries` that hard-codes the options and does not support `Timeout` to introduce the concept, then introduce ActiveSupport `extract_options!` to support the `limit` option and list of exceptions, and lastly add the `timeout_in` option.
* Figure out testing.
* Link to demo repo on Github.
* Conclusion para.
* Somehow work in: "If at first you don't succeed... Ruby's retry to the rescue"
* Feature image.
* Use [Ruby Logger](https://blog.appsignal.com/2023/05/17/manage-your-ruby-logs-like-a-pro.html?utm_source=shortruby&utm_campaign=shortruby_0042&utm_medium=email) to display what's happening
