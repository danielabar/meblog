---
title: "Avoid this Bug with Numeric Environment Variables in Ruby"
featuredImage: "../images/bug-numeric-env-var-james-wainscoat-GGewLGcQD-I-unsplash.jpg"
description: "Learn how to avoid a common pitfall when handling numeric environment variables in Ruby, safeguarding against unexpected behavior even when values are unset or unexpected."
date: "2024-09-01"
category: "ruby"
related:
  - "Configurable Retry with Ruby"
  - "Use Ruby to Parse Command Line Output"
  - "Solving a Python Interview Question in Ruby"
---

This post will explain how to avoid a common pitfall with numeric environment variable handling in Ruby.

I recently encountered an error when running some code that calls a third party API to fetch data. This code uses the Quickbooks Ruby gem to fetch accounting data for a financial services application. According to the gem [documentation](https://github.com/ruckus/quickbooks-ruby?tab=readme-ov-file#querying-in-batches), usage is as follows:

```ruby
query = nil # or specify a custom query
Customer.query_in_batches(query, per_page: 1000) do |batch|
  batch.each do |customer|
    # do something with customer...
  end
end
```

The idea with splitting up the result in batches is similar to [Active Record Batches](https://api.rubyonrails.org/classes/ActiveRecord/Batches.html) in Rails, to avoid loading a very large collection into memory all at once. With this API, the `per_page` option is used to control the batch size.

## The Bug

When I was attempting to run the application code that calls this API from my laptop, it was returning this error message:

```xml
------ QUICKBOOKS-RUBY RESPONSE ------
RESPONSE CODE = 400
RESPONSE BODY:
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<IntuitResponse xmlns="http://schema.intuit.com/finance/v3" time="2024-07-22T12:17:49">
  <Fault type="ValidationFault">
    <Error code="4001">
      <Message>Invalid query</Message>
      <Detail>QueryValidationError: value 0 is too small. Min allowed value is 1</Detail>
    </Error>
  </Fault>
</IntuitResponse>
```

Which was surprising as this code had been running in production for many years without errors. The stack trace pointed to this part of the application code that calls the API:

```ruby
Customer.query_in_batches(query, per_page: Settings.batch_size) do |batch|
  # ...
end
```

So rather than a hard-coded default value of `1000` as per the example in the gem documentation, some custom configuration code `Settings.batch_size` was being called. Here is the relevant snippet of the `Settings` class:

```ruby
class Settings
  def self.batch_size
    ENV["BATCH_SIZE"].to_i || 1000
  end

  # other settings...
end
```

A cursory glance at the implementation of `Settings.batch_size` suggests the intention is to use the value of the `BATCH_SIZE` environment variable if it's set, otherwise, use the fallback value of `1000` with the following logic:

* Read in the `BATCH_SIZE` environment variable.
* Convert the `BATCH_SIZE` environment variable to an integer (because *all* environment variables read in are strings).
* If `BATCH_SIZE` is defined in the environment, use it, otherwise, use a default batch size of `1000`.

However, the error message was indicating that a `0` batch size had been specified, which is invalid:

```xml
<Detail>QueryValidationError: value 0 is too small. Min allowed value is 1</Detail>
```

How could this have happened?

## Investigation

When code is working in production but not locally, different configuration could be the culprit. I started by checking the value of the `BATCH_SIZE` environment variable in the production environment where this code was working:

```bash
# in a production shell
echo $BATCH_SIZE
# 300
```

When this project runs locally, it uses the [dotenv](https://github.com/bkeepers/dotenv) gem to load environment variables from a `.env` file in the project root. Inspecting this file revealed that `BATCH_SIZE` was nowhere to be found in this file, i.e. it was not set. According to the `Settings.batch_size` implementation, it should have been fine for `BATCH_SIZE` to not be specified, in which case, it should have defaulted to a batch size of 1000. But instead, the `batch_size` method was returning 0.

To understand why this was the case, I launched a local [irb console](https://rubyreferences.github.io/rubyref/intro/irb.html) with the `BATCH_SIZE` environment variable set to `300` as follows:

```bash
BATCH_SIZE=300 irb
```

<aside class="markdown-aside">
Although this bug arose within a Rails project, the cause has to do solely with Ruby methods, so an irb console rather than a Rails console can be used to demonstrate it.
</aside>

Then ran some experimental code to break down each part of the expression `ENV["BATCH_SIZE"].to_i || 1000` to understand the behaviour:

```ruby
# Fetch `BATCH_SIZE` environment variable
ENV["BATCH_SIZE"]
# => "300"

# Notice it gets read in as a String even though
# the value is numeric
ENV["BATCH_SIZE"].class
# => String

# Convert batch size env var to an integer
ENV["BATCH_SIZE"].to_i
# => 300

# This returns the env var value because its
# populated (truthy), rather than the default of 1000
ENV["BATCH_SIZE"].to_i || 1000
# => 300
```

So far so good, when the `BATCH_SIZE` environment variable is populated, then this code `ENV["BATCH_SIZE"].to_i || 1000` behaves as per the intention.

Next, I ran another irb console, this time just `irb`, i.e. to simulate an environment where `BATCH_SIZE` is not set:

```ruby
# Fetch `BATCH_SIZE` environment variable
# This time it returns nil because its not set
ENV["BATCH_SIZE"]
# => nil

# When not set, the env var is of type NilClass
ENV["BATCH_SIZE"].class
# => NilClass

# What happens when `nil` is converted to an integer?
# It returns 0!
ENV["BATCH_SIZE"].to_i
# => 0

# What happens when evaluating 0 OR something?
# It returns 0!
ENV["BATCH_SIZE"].to_i || 1000
# => 0
```

The code in the above irb session demonstrates the problem. Despite the intention of the `Settings` method to return `1000` when the `BATCH_SIZE` environment variable isn't set, what actually happens is that it returns `0`. This then gets passed on to the third party API as the value of batch size, which raises an error because `0` is an invalid value for batching the response.

## Root Cause

There are several points to understand about why a `0` is being returned when the requested environment variable isn't set:

Running `to_i` on `nil` always returns `0` in Ruby. This means the result of `ENV["ANYTHING_THATS_NOT_SET"].to_i` will be `0`. See the Ruby docs on [NilClass#to_i](https://docs.ruby-lang.org/en/3.2/NilClass.html#method-i-to_i).

The result of `0 || 1000` is `0`, not `1000` as some might expect coming from other languages. The first part of this is to understand that [||](https://docs.ruby-lang.org/en/master/syntax/operators_rdoc.html#label-7C-7C-2C+or) is a short circuit operator that returns the result of the first expression that is truthy.

Since the `||` OR operator is returning 0, this must mean that `0` is truthy in Ruby! This might be surprising to those coming to Ruby from other languages such as Python or JavaScript where `0` is considered falsey. According to the Ruby docs on [booleans and nil](https://ruby-doc.org/core-2.2.3/doc/syntax/literals_rdoc.html#label-Booleans+and+nil):

> nil and false are both false values. nil is sometimes used to indicate “no value” or “unknown” but evaluates to false in conditional expressions. true is a true value. All objects except nil and false evaluate to a true value in conditional expressions.

The key phrase is "**All objects except nil and false evaluate to a true value in conditional expressions**". Since `0` is not `nil` or `false`, it evaluates to `true` in conditional expressions such as `||`. Further, since it occurs on the left hand side of the short circuit OR in the `Settings` code, as in `0 || 1000`, it means `0` is the first truthy value and returned.

<aside class="markdown-aside">
This Stack Overflow post contains further discussion on <a class="markdown-link" href="https://stackoverflow.com/questions/10387515/why-treat-0-as-true-in-ruby">why 0 is treated as truthy in Ruby</a>.
</aside>

To summarize, the problem is caused by a combination of the following factors:

1. Calling `to_i` on `nil` returns `0`.
2. `0` is considered a truthy value and evaluates to `true` when used in conditional expressions.

## Solution

The solution is to use the [ENV.fetch](https://docs.ruby-lang.org/en/3.2/ENV.html#method-c-fetch) method when accessing an environment variable that might not be set, rather than accessing `ENV` with `[]`. The `fetch` method accepts an optional default value, which will be returned if the requested environment variable isn't set. Since the original intent of the code is to use a fallback value of `1000` when the `BATCH_SIZE` environment variable isn't set, the `fetch` method is exactly what's needed here.

It still requires the use of `to_i` because if the environment variable is set, then it will still be retrieved as a string. If it's not set, then the numeric default of `1000` will be returned, but there's no harm in calling `to_i` on it as that will still return an integer:


```ruby
class Settings
  def self.batch_size
    ENV.fetch("BATCH_SIZE", 1000).to_i
  end
end
```

With the above code in place, if the `BATCH_SIZE` environment variable is set, it will be returned as an integer, otherwise `1000`  will be returned.

## Conclusion

This post highlighted a potential bug that can result when working with numeric environment variables in Ruby, and how use of the `ENV.fetch` method can be used to more accurately express the intention of using a fallback value.
