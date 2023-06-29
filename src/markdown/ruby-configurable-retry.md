---
title: "Configurable Retry with Ruby"
featuredImage: "../images/ruby-retrybrett-jordan--dChkgNLmp4-unsplash.jpg"
description: "Learn how to implement retry logic in Ruby and enhance it with a custom module for improved error handling and resilience"
date: "2023-11-01"
category: "ruby"
related:
  - "Old Ruby and New Mac"
  - "Solving a Python Interview Question in Ruby"
  - "Testing Faraday with RSpec"
---

Often when writing Ruby code, you'll encounter a section of code that might not work the first time, but might work on a repeated attempt. For example, when fetching data from a remote API, the request may occasionally fail due to network issues but be successful when trying the same request a second or even third time. This post will explore how to  handle such situations using Ruby's [retry](https://docs.ruby-lang.org/en/3.2/syntax/exceptions_rdoc.html) keyword. Additionally, we'll delve into creating a custom module written by my colleague Patrick TBD link that extends the functionality of the built-in mechanism, providing additional enhancements and reducing some boilerplate.

## Built-in Retry

In Ruby, the `retry` keyword is used to repeat the execution of a block of code within a `rescue` clause. It allows you to handle and recover from exceptions by retrying the failed operation. In a web application, you would typically want to retry an external network request, but to keep the examples simple for this post, we'll be looking at some code that reads a file. Reading a file could fail if the file is not available on the file system.

For example, the `FileReader` class below is initialized with a path to a file, then attempts to read from the file using `File.read`, which could raise an error if the file is not available on disk:

```ruby
class FileReader
  def initialize(file_path)
    @file_path = file_path
  end

  def read_file
    File.read(@file_path)
    puts "File read successful"
    # do something with file contents...
  rescue Errno::ENOENT => e
    puts "File read failed, exception: #{e}"
  end
end
```

Loading and running this class in an irb console results in the following:

```ruby
# Assume example.txt exists in the current directory
FileReader.new("example.txt").read_file
# File read successful

FileReader.new("does_not_exist.txt").read_file
# File read failed, exception:
#   No such file or directory @ rb_sysopen - does_not_exist.txt
```

Suppose this code is part of a bigger application with known timing issues, where a separate process is responsible for creating the file, but its possible that the first time the file is accessed, it might not have been created yet, then attempting it a second or even third time, by then its usually there. Here is one way the `FileReader` class can be enhanced to automatically retry the `read` operation if it fails up to a limited number of times:

```ruby
class FileReader
  MAX_ATTEMPTS = 2

  def initialize(file_path)
    @file_path = file_path
    @attempt = 0
  end

  def read_file
    File.read(@file_path)
    puts "File read successful"
    # do something with file contents...
  rescue Errno::ENOENT
    if @attempt < MAX_ATTEMPTS
      @attempt += 1
      puts "File not found. Retrying (attempt #{@attempt} of #{MAX_ATTEMPTS})..."
      retry
    else
      puts "File not found after #{MAX_ATTEMPTS} attempts."
    end
  end
end
```

In the above version, if an error occurs reading the file, it incorporates a retry mechanism. If the number of attempts `@attempt` is less than the maximum allowed attempts `MAX_ATTEMPTS`, the method increments the attempt counter and uses the `retry` keyword to reattempt the file read operation. If the maximum number of attempts has been reached, it outputs a failure message indicating that the file was not found after the specified number of attempts.

The `retry` keyword causes the program flow to go back to the beginning of the `begin` block (or beginning of method as in this case), and the file reading operation is attempted again. If it fails again, the `rescue` clause is triggered, and the process repeats until either the operation succeeds or the maximum number of retry attempts is reached.

Loading this version in an irb console and trying it out we can see that when the file exists, it behaves the same as before. When the file does not exist, it makes two more attempts, then gives up if those still fail:

```ruby
FileReader.new("example.txt").read_file
# File read successful

FileReader.new("does_not_exist.txt").read_file
# File not found. Retrying (attempt 1 of 2)...
# File not found. Retrying (attempt 2 of 2)...
# File not found after 2 attempts.
```

<aside class="markdown-aside">
The "retry" method can only be used within a "rescue" clause, as it relies on the context of handling exceptions.
</aside>

If you want to see the method succeed after a failed attempt, add a breakpoint just before the `retry`. I'm using Ruby's built-in debugger, which is available [without a separate gem install as of 3.1](https://www.ruby-lang.org/en/news/2021/12/25/ruby-3-1-0-released/):

```ruby
def read_file
  File.read(@file_path)
  puts "File read successful"
rescue Errno::ENOENT
  if @attempt < MAX_ATTEMPTS
    @attempt += 1
    puts "File not found. Retrying (attempt #{@attempt} of #{MAX_ATTEMPTS})..."

    # === ADD BREAKPOINT HERE ===
    debugger

    retry
  else
    puts "File not found after #{MAX_ATTEMPTS} attempts."
  end
end
```

When the breakpoint is reached, create the file `does_not_exist.txt` in the file system (using a separate terminal, i.e. `touch does_not_exist.txt`), then enter `continue` in the irb console to let the code continue execution. It will go back to the beginning of the method to attempt the file read again, and this time you should see the message `File read successful` printed to the console.

## Reusable Module

The code in the previous section works, but there's a lot of boilerplate. Having the retry and attempt counting logic commingled with the actual business logic makes it difficult to quickly scan the method and determine what its true purpose is. Also, what if you need this logic in many methods throughout the code? What if some types of calls should only be re-attempted once and others multiple times? As currently written, the retry logic has to be repeated in every method where it's needed.

Let's attempt to refactor by extracting the retry and attempt counting logic to a `Retryable` module. We'll make use of the `yield` keyword to transfer control to a block of code that will get passed as an argument to the `with_retries` method of this module. This block of code will represent the actual operation that might raise an error. Since we don't know what kind of error might be raised, we'll rescue `StandardError` (not ideal but we'll get back to this point later):

```ruby
module Retryable
  def with_retries
    # Initialize attempt counter.
    retried = 0

    begin
      # Execute block of code passed in by caller,
      # eg: File.read(...)
      yield
    rescue StandardError => e
      # If attempts have been exceeded, log message
      # and raise error for caller to handle.
      if retried >= 2
        puts "Retryable failed after #{retried} attempts, exception: #{e}"
        raise e
      end

      # Increment attempt counter and try again.
      # Control flows back to `begin` block.
      retried += 1
      retry
    end
  end
end
```

In the `rescue` block, the `retried` counter is checked and if it has reached the max attempt limit (hard-coded to 2 at the moment), then a message is logged and the error is raised. Otherwise, the `retried` counter is incremented and `retry` is used to execute the code in the `begin` block again, which uses `yield` to execute whatever block of the code the caller passed in.

To use this `Retryable` module, it can be included in a class, which can then call the `with_retries` method, passing a block of code that might raise an exception. The code will be retried up to 2 times before failing.

Here's the `FileReader` modified to make use of the `Retryable` module:

```ruby
require "./app/retryable"

class FileReader
  include Retryable

  def initialize(file_path)
    @file_path = file_path
  end

  def read_file
    with_retries do
      File.read(@file_path)
      puts "File read successful"
      # do something with file contents...
    end
  end
end
```

Loading and running this version of the class in an irb console results in the following:

```ruby
# Assume example.txt exists in the current directory
FileReader.new("example.txt").read_file
# File read successful

FileReader.new("does_not_exist.txt").read_file
# Retryable retrying attempt 1
# Retryable retrying attempt 2
# Retryable failed after 2 attempts, exception:
#   No such file or directory @ rb_sysopen - does_not_exist.txt
# file_reader.rb:28:in `read':
#   No such file or directory @ rb_sysopen - does_not_exist.txt (Errno::ENOENT)
```

The benefit of extracting the retry logic to a module is that it cleans up the calling code, in that now it can be solely focused on its single purpose of reading a file. Also, the `Retryable` module can be easily reused by including it in any class, and wrapping any block of code that needs to be retried in the `with_retries` block.

## Flexibility

There are some problems with the `Retryable` module as currently written:

It always rescues `StandardError`, but the caller may want to be more specific about which exceptions should be retried. For example, in the case of `File.read`, it could raise `Errno::ENOENT` (no such file or directory) or `Errno::EMFILE` (too many open files), which should be retried as those could get resolved in this particular application. But other errors such as `Errno::EISDIR` (is a directory) or `Errno::EACCES` (permission denied) would not get resolved on repeated attempts therefore should not be retried.

Also the max number of attempts is currently hard-coded to `2`. The caller might want to specify how many retries. For example, some use cases may require a higher number of retries such as `5`, whereas others should only be retried once.

It would be nice if the `with_retries` method could accept some arguments where the caller could specify a list of exceptions that should be handled, and an options hash to specify the number of retries, like this:

```ruby
def read_file
  with_retries(Errno::ENOENT, Errno::EMFILE, limit: 2) do
    File.read(@file_path)
    puts "File read successful"
  end
end
```

In order to support this flexibility, the `with_retries` method in the `Retryable` will be modified to accept some arguments. We'll use the splat operator for the parameter `*args`, which will allow the `with_retries` method to accept a variable number of arguments as an array. The [extract_options!](https://api.rubyonrails.org/classes/Array.html#method-i-extract_options-21) method from ActiveSupport will be used to assist in parsing out the array/options.

The splat operator will also be used in the rescue clause, to expand the `*exceptions` array into multiple arguments, each one being an individual exception that should be retried.

```ruby
require "active_support/all"

module Retryable
  def with_retries(*args)
    # Remove and return last element in args if it's a hash,
    # otherwise returns a blank hash, for example:
    # { :limit => 2 }
    options = args.extract_options!

    # What's left of the args array will be the list of exceptions,
    # for example: [Errno::ENOENT, Errno::EMFILE]
    exceptions = args

    # Set a default number of retries if caller did not specify.
    options[:limit] ||= 3

    # Default exceptions to handle if caller has not provided any
    exceptions = [StandardError] if exceptions.empty?

    retried = 0
    begin
      yield
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

<aside class="markdown-aside">
<a class="markdown-link" href="https://guides.rubyonrails.org/active_support_core_extensions.html">ActiveSupport</a> provides many Ruby language extensions and utilities. It's installed automatically for Rails projects, but it can be used outside of Rails by specifying it in the Gemfile as "gem 'activesupport'", and then requiring it at the top of the module.
</aside>

Another feature that would be useful when retrying is the ability to specify a timeout. That is, the caller might want to specify a time limit on each attempt such as "if there are no results within 2 seconds, try again. This can be done with Ruby's [Timeout](https://docs.ruby-lang.org/en/3.2/Timeout.html) module, which provides a way to halt a long running operation if it hasn’t finished in a fixed amount of time.

Below is a modified version of the `Retryable` module that supports a `timeout_in` option, and if specified, wraps the `yield` execution in a `Timeout.timeout` block, with the `timeout_in` value provided by the caller. We also add `Timeout::Error` to the list of default exceptions to handle:

```ruby
require "active_support/all"
require "timeout"

module Retryable
  def with_retries(*args)
    options = args.extract_options!
    exceptions = args

    options[:limit] ||= 3

    # Default exceptions to handle if caller has not provided any
    exceptions = [StandardError, Timeout::Error] if exceptions.empty?

    retried = 0
    begin
      # If caller has provided a `timeout_in` option,
      # wrap the execution in a timeout block:
      if options[:timeout_in]
        Timeout.timeout(options[:timeout_in]) do
          return yield
        end
      # Otherwise, execute the code as before:
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

To try this out, modify the `FileReader#read_file` method to call [sleep](https://docs.ruby-lang.org/en/3.2/Kernel.html#method-i-sleep) to simulate a slow operation. For this example, we'll have `with_retries` use defaults for the other options so it will retry 3 times, and handle `StandardError` and `Timeout::Error`:

```ruby
require "./app/retryable"

class FileReader
  include Retryable

  def initialize(file_path)
    @file_path = file_path
  end

  def read_file
    # Specify we should only wait 2 seconds before retrying.
    with_retries(timeout_in: 2) do
      # Simulate a slow operation by pausing
      # current thread for 3 seconds.
      sleep(3)
      File.read(@file_path)
      puts "File read successful!"
    end
  end
end
```

Now running this version in an irb console will show that it attempts 3 times (waiting 2 seconds each time), then raises a timeout error:

```ruby
FileReader.new("example.txt").read_slow
# Retryable failed after 3 retry(ies), exception: execution expired
# app/file_reader.rb:29:in `sleep': execution expired (Timeout::Error)
#   from app/file_reader.rb:29:in `block in read_slow'
#   from app/retryable.rb:50:in `block in with_retries'
#   ...
#   from app/retryable.rb:49:in `with_retries'
#   from app/file_reader.rb:28:in `read_slow'
```

## Conclusion

This post has covered an introduction to Ruby's built-in `retry` mechanism and the development of a flexible `Retryable` module. This module provides code re-use for the retry logic with flexibility to specify which exception classes should be handled, how many times the code should be retried, and whether it should timeout after some period of time. The development of this module was inspired this post on [Ruby retry](https://scoutapm.com/blog/ruby-retry) and this [Github gist](https://gist.github.com/cainlevy/1323593/2321056de18e63436e66562e218a631d32077a20), check them out for further reading on this topic.

# Rough brainstorming notes
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

## Yield Explanation

Is this needed or to be assumed that reader knows this?

In Ruby, the yield keyword is used within a method to transfer control to a block of code that was passed as an argument to that method. It allows the method to execute the block at a specific point, injecting the necessary data or context into the block for processing.

When a method encounters a yield statement, it pauses its execution and executes the block of code that was passed in, passing any specified arguments. The block can perform operations using the provided data and may return a value back to the method if needed. After the block completes its execution, the method continues executing from where it left off.

The yield keyword is commonly used to implement iterators or to execute custom code within a predefined method. It allows for greater flexibility and customization by enabling users of the method to define their own behavior through blocks of code that can be executed within the method's context.

## TODO

* Explain simple Ruby project setup (no Rails!), show tree dir with boot.rb loading the files
* Mention what Ruby version and that it has built-in debugger
* Add puts in Retryable as its attempting again
* Figure out testing.
* Link to demo repo on Github.
* Add link to Patrick's Linkedin/website
* Need yield explanation or assume reader knows? Maybe an aside?
* Add "re" in a monospaced font to feature image, maybe throw in a ruby gem if it looks good
* Somehow work in: "If at first you don't succeed... Ruby's retry to the rescue"
* Use [Ruby Logger](https://blog.appsignal.com/2023/05/17/manage-your-ruby-logs-like-a-pro.html?utm_source=shortruby&utm_campaign=shortruby_0042&utm_medium=email) to display what's happening
* Maybe aside about error hierarchy in Ruby? https://github.com/danielabar/ruby-pluralsight#handling-exceptions
* Maybe ref Errno exceptions: https://www.honeybadger.io/blog/understanding-rubys-strange-errno-exceptions/
