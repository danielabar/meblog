---
title: "Configurable Retry with Ruby"
featuredImage: "../images/ruby-retry-mod-brett-jordan--dChkgNLmp4-unsplash.jpg"
description: "Learn how to implement retry logic in Ruby and enhance it with a custom module for improved error handling and resilience"
date: "2023-11-01"
category: "ruby"
related:
  - "Old Ruby and New Mac"
  - "Solving a Python Interview Question in Ruby"
  - "Testing Faraday with RSpec"
---

When writing Ruby code, you may encounter a section of code that is known to fail the first time, but usually works on a repeated attempt. For example, when fetching data from a remote API, the request may occasionally fail due to network issues but be successful when trying the same request a second or even third time. This post will explore how to  handle such situations using Ruby's [retry](https://docs.ruby-lang.org/en/3.2/syntax/exceptions_rdoc.html) keyword. Additionally, we'll delve into creating a custom module (written by my colleague [Patrick Ptasiński](https://www.linkedin.com/in/patryk-ptasi%C5%84ski-07941713b/)) that extends the functionality of the built-in mechanism, providing additional enhancements and reducing boilerplate.

## Ruby Project

All the code in this post is using Ruby v3.1.2. If you want to follow along with the code exercises, here is the project directory structure. This is a simple Ruby project with no Rails:

```
.
├── .rspec
├── .rubocop.yml
├── .ruby-version
├── Gemfile
├── Gemfile.lock
├── app
│   ├── file_reader.rb
│   └── retryable.rb
├── boot.rb
├── example.txt
└── spec
    ├── retryable_spec.rb
    └── spec_helper.rb
```

Where `boot.rb` is used to load the code:

```ruby
require "debug"
require "./app/retryable"
require "./app/file_reader"

def reload
  load "./app/retryable.rb"
  load "./app/file_reader.rb"
end

puts "FileReader loaded, try it out for example: FileReader.new(\"example.txt\").read_file"
```

The boot file is run when starting an irb console as follows:

```
irb -r ./boot.rb
```

This saves from having to manually require/load code in the console while working through the examples. You can also view the [demo project](https://github.com/danielabar/ruby-retry) on Github.

## Built-in Retry

> If at first you don't succeed, try, try again.

In Ruby, the `retry` keyword is used to repeat the execution of a block of code within a `rescue` clause. It allows you to handle and recover from exceptions by retrying the failed operation. In a web application, you would typically want to retry an external network request, but to keep the examples simple for this post, we'll be looking at some code that reads a file. There are many reasons why reading a file could fail, among them, if the file is not available on the file system.

The `FileReader` class below is initialized with a path to a file, then attempts to read from the file using the `File.read` method, which could raise an error if the file is not available on disk:

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

# Try it with a file that is not in the current directory
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
      # Increment attempt counter and try again,
      # execution flows back to beginning of method.
      @attempt += 1
      puts "File not found. Retrying (attempt #{@attempt} of #{MAX_ATTEMPTS})..."
      retry
    else
      # Used up all the attempts, give up.
      puts "File not found after #{MAX_ATTEMPTS} attempts."
    end
  end
end
```

In the above version, if an error occurs reading the file, it incorporates a retry mechanism. If the number of attempts `@attempt` is less than the maximum allowed attempts `MAX_ATTEMPTS`, the method increments the attempt counter and uses the `retry` keyword to reattempt the file read operation. If the maximum number of attempts has been reached, it outputs a failure message indicating that the file was not found after the specified number of attempts.

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

If you want to see the method succeed after a failed attempt, add a breakpoint just before the `retry`. I'm using Ruby's built-in debugger, which is available [without a separate gem install as of v3.1](https://www.ruby-lang.org/en/news/2021/12/25/ruby-3-1-0-released/):

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

Let's refactor by extracting the retry and attempt counting logic to a `Retryable` module that defines an instance method `with_retries`. This method uses the [yield](https://www.rubyguides.com/2019/12/yield-keyword/) keyword to transfer control to a block of code that will get passed as an argument. This block of code will represent the actual operation that might raise an error. Since we don't know what kind of error might be raised, we'll rescue `StandardError` for now (we'll return to this shortly):

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
      puts "Retryable retrying (attempt #{retried} of #{options[:limit]})"
      retry
    end
  end
end
```

In the `rescue` block, the `retried` counter is checked and if it has reached the max attempt limit (hard-coded to 2 at the moment), then a message is logged and the error is raised. Otherwise, the `retried` counter is incremented and `retry` is used to execute the code in the `begin` block again.

To use this `Retryable` module, it can be included in a class. As a result of including this module, the class now has the `with_retries` instance method, which it can call by passing a block of code that might raise an exception. The code will be retried up to 2 times before failing.

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
# Retryable retrying (attempt 1 of 2)
# Retryable retrying (attempt 2 of 2)
# Retryable failed after 2 attempts, exception:
#   No such file or directory @ rb_sysopen - does_not_exist.txt
# file_reader.rb:28:in `read':
#   No such file or directory @ rb_sysopen - does_not_exist.txt (Errno::ENOENT)
```

The benefit of extracting the retry logic to a module is that it cleans up the calling code, in that now it can be solely focused on its single purpose of reading a file. Also, the `Retryable` module can be easily reused by including it in any class, and wrapping any block of code that needs to be retried in the `with_retries` block.

## Flexibility

There are some problems with the `Retryable` module as currently written:

It always rescues `StandardError`, but the caller may want to be more specific about which exceptions should be retried. For example, in the case of `File.read`, it could raise `Errno::ENOENT` (no such file or directory) or `Errno::EMFILE` (too many open files), which should be retried as those could get resolved in this particular application. But other errors such as `Errno::EISDIR` (is a directory) or `Errno::EACCES` (permission denied) would not get resolved on repeated attempts therefore should not be retried.

<aside class="markdown-aside">
The "Errno::" exceptions in Ruby differ from the usual exceptions like "NoMethodError" or "ArgumentError" because they represent operating system errors. To delve deeper into the topic and understand why they may seem cryptic, refer to this blog post <a class="markdown-link" href="https://www.honeybadger.io/blog/understanding-rubys-strange-errno-exceptions/">Understanding Ruby's Strange Errno Exceptions</a> for more insights.
</aside>

Another issue with the `Retryable` module is the maximum number of attempts is currently hard-coded to `2`. The caller might want to specify how many retries. For example, some use cases may require a higher number of retries such as `5`, whereas others should only be retried once.

It would be nice if the `with_retries` method could accept some arguments where the caller could specify a list of exceptions that should be retried, and an options hash to specify the number of retries, like this:

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

    # What's left of the args array will be an array of exceptions,
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
      puts "Retryable retrying (attempt #{retried} of #{options[:limit]})"
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
      puts "Retryable retrying (attempt #{retried} of #{options[:limit]})"
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
# Retryable retrying (attempt 1 of 3)
# Retryable retrying (attempt 2 of 3)
# Retryable retrying (attempt 3 of 3)
# Retryable failed after 3 retry(ies), exception: execution expired
# app/file_reader.rb:29:in `sleep': execution expired (Timeout::Error)
#   from app/file_reader.rb:29:in `block in read_slow'
#   from app/retryable.rb:50:in `block in with_retries'
#   ...
#   from app/retryable.rb:49:in `with_retries'
#   from app/file_reader.rb:28:in `read_slow'
```

## Tests

We're not quite finished, the Retryable module also needs tests. I'll be using [RSpec](http://rspec.info/). At first it looks tricky to test because it needs to be included in a class in order to invoke the `with_retries` method. So it might seem like the only way to test it would be to test the `FileReader` class that uses it. However, we can use Ruby's [module_function](https://docs.ruby-lang.org/en/3.2/Module.html#method-i-module_function) to make any method in a module callable on the module, in addition to being an instance method on any class the module is included in.

Here is the modified `Retryable` module that adds the `with_retries` method as a method that can be invoked directly on the module like `Retryable.with_retries(...)`:

```ruby
require "active_support/all"
require "timeout"

module Retryable
  def with_retries(*args)
    # snip...
  end

  # === EXPOSE THIS METHOD DIRECTLY ON THE MODULE ===
  module_function :with_retries
end
```

Now the module can be set as the `described_class` with RSpec, and invoked as `described_class.with_retries(...)`:

```ruby
# spec/retryable_spec.rb

require "./app/retryable"

RSpec.describe Retryable do
  describe ".with_retries" do
    it "executes the code block without retrying if no exception is raised" do
      expect { described_class.with_retries { puts "Executing code" } }.to output("Executing code\n").to_stdout
    end

    it "retries the code block if a specified exception is raised" do
      counter = 0
      described_class.with_retries(ZeroDivisionError, limit: 4) do
        counter += 1
        raise ZeroDivisionError if counter < 4
      end

      expect(counter).to eq(4)
    end

    it "raises an exception if the retry limit is exceeded" do
      expect do
        described_class.with_retries(ZeroDivisionError, limit: 3) do
          raise ZeroDivisionError
        end
      end.to raise_error(ZeroDivisionError)
    end

    it "retries the code block with default options if no arguments are provided" do
      counter = 0
      described_class.with_retries do
        counter += 1
        raise StandardError if counter < 3
      end

      expect(counter).to eq(3)
    end

    it "retries the code block with a timeout if timeout_in option is provided" do
      counter = 0
      described_class.with_retries(timeout_in: 1) do
        counter += 1
        sleep(2) if counter < 3
      end

      expect(counter).to eq(3)
    end
  end
end
```

## Documentation

The last thing to do before calling this feature done is to add some documentation. Fortunately ChatGPT can help out with this. I asked it to generate [RDoc](https://ruby.github.io/rdoc/) comments for the `Retryable` module and here is what it came up with:

```ruby
require "active_support/all"
require "timeout"

module Retryable
  # Retries the execution of a block of code with retry logic.
  #
  # @param [Array<Exception>] args The list of exceptions that should trigger a retry.
  # @param [Hash] options The options for retrying the code block.
  # @option options [Integer] :limit (3) The maximum number of retry attempts after initial run.
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
  def with_retries(*args)
    options = args.extract_options!
    exceptions = args
    options[:limit] ||= 3
    exceptions = [StandardError, Timeout::Error] if exceptions.empty?

    retried = 0
    begin
      if options[:timeout_in]
        Timeout.timeout(options[:timeout_in]) do
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
      puts "Retryable retrying (attempt #{retried} of #{options[:limit]})"
      retry
    end
  end
  module_function :with_retries
end
```

## Conclusion

This post has covered an introduction to Ruby's built-in `retry` mechanism and the development of a flexible `Retryable` module. This module provides code re-use for the retry logic with flexibility to specify which exception classes should be handled, how many times the code should be retried, and whether it should timeout after some period of time. Finally we covered testing and documentation. The development of this module was inspired by this post on [Ruby retry](https://scoutapm.com/blog/ruby-retry) and this [Github gist](https://gist.github.com/cainlevy/1323593/2321056de18e63436e66562e218a631d32077a20), check them out for further reading on this topic.
