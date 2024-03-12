---
title: "Avoid this bug with numeric environment variables in Ruby"
featuredImage: "../images/bug-numeric-env-var-james-wainscoat-GGewLGcQD-I-unsplash.jpg"
description: "Learn how to avoid a common pitfall when handling numeric environment variables in Ruby, safeguarding against unexpected behavior even when values are unset or unexpected."
date: "2024-08-01"
category: "ruby"
related:
  - "Configurable Retry with Ruby"
  - "Use Ruby to Parse Command Line Output"
  - "Solving a Python Interview Question in Ruby"
---

This post will explain how to avoid a common pitfall with numeric environment variable handling in Ruby.

I recently encountered an error when running some code that calls a third party API to fetch some data. This code uses the [Quickbooks Ruby](https://github.com/ruckus/quickbooks-ruby?tab=readme-ov-file#querying-in-batches) gem to fetch some accounting data for a financial services application. According to the gem documentation, the usage is as follows:

```ruby
query = nil # or specify a custom query
Customer.query_in_batches(query, per_page: 1000) do |batch|
  batch.each do |customer|
    # do something with customer...
  end
end
```

The idea is similar to [Active Record Batches](https://api.rubyonrails.org/classes/ActiveRecord/Batches.html) in Rails, to avoid loading a massive collection into memory all at once. With this API, the `per_page` option is used to control the batch size.

## The Problem

However, when I was attempting to run the application code that calls this API from my laptop, it was returning this error message:

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

This seemed very strange as this code had been in production for many years and working without errors.

The stack trace pointed to this part of the application code that calls the API:

```ruby
Customer.query_in_batches(query, per_page: Settings.api_batch_size) do |batch|
  # ...
end
```

So rather than a hard-coded default value of `1000` as per the example in the gem documentation, some custom configuration code was being called.

The `Settings` class had this:

```ruby
class Settings
  def self.batch_size
    ENV["BATCH_SIZE"].to_i || 1000
  end

  # other settings...
end
```

A cursory glance at the implementation of `Settings.batch_size` suggests the following intention:

* Read in the `BATCH_SIZE` environment variable.
* Convert the `BATCH_SIZE` environment variable to an integer (because *all* environment variables read in are strings).
* If `BATCH_SIZE` is defined in the environment, use it, otherwise, use a default batch size of `1000`.

And yet, the error message was indicating that a `0` batch size had been specified, which is invalid:

```xml
<Detail>QueryValidationError: value 0 is too small. Min allowed value is 1</Detail>
```

How could this have happened?

## Investigation

I started by checking the value of the `BATCH_SIZE` environment variable in the production environment where this code was working just fine:

```bash
# in a production shell
echo $BATCH_SIZE
# 300
```

When this project runs locally, it uses the [dotenv](https://github.com/bkeepers/dotenv) gem to load environment variables from a `.env` file in the project root. Inspecting this file revealed that `BATCH_SIZE` was not defined. According to the `Settings.batch_size` implementation, it should have been fine for `BATCH_SIZE` to not be specified, in which case, it should have defaulted to a batch size of 1000. But instead, the `batch_size` method was returning 0.

To understand why this was the case, I launched a local [irb console](https://rubyreferences.github.io/rubyref/intro/irb.html) with the `BATCH_SIZE` environment variable set to `300` as follows:

```bash
BATCH_SIZE=300 irb
```

Then ran some experimental code to break down each part of the expression `ENV["BATCH_SIZE"].to_i || 1000` to understand the behaviour:

```ruby
# Fetch `BATCH_SIZE` environment variable
ENV["BATCH_SIZE"]
# => "300"

# Notice it gets read in as a String even
# though the value is numeric!
ENV["BATCH_SIZE"].class
# => String

# Convert the string to an integer
ENV["BATCH_SIZE"].to_i
# => 300

# This returns the env var value because its
# populated, rather than the default of 1000
ENV["BATCH_SIZE"].to_i || 1000
# => 300
```

So far so good, when the `BATCH_SIZE` environment variable is set to a numeric value, then this code `ENV["BATCH_SIZE"].to_i || 1000` behaves as per the intention.

Next, I ran another irb console, this time just `irb`, i.e. to simulate an environment where `BATCH_SIZE` is not set:

TODO...

```ruby

```

## TODO
* title
* WIP: intro para
* WIP: main content
* break up into sub-sections
* conclusion para
* clarify this could happen in a plain Ruby project, doesn't have to be Rails
* maybe very brief explanation of dotenv as per https://github.com/bkeepers/dotenv?tab=readme-ov-file#usage
* maybe also try unexpected env var setting like "foo"?
* edit
