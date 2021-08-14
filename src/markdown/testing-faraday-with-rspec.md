---
title: "Testing Faraday with RSpec"
featuredImage: "../images/faraday-alex-kondratiev-H9t723yPjYI-unsplash.jpg"
description: "Learn two different techniques for testing code that uses Faraday with RSpec."
date: "2021-08-15"
category: "ruby"
---

If you've ever developed code that had to integrate with a third party service that didn't have an up-to-date gem available, there's a good chance you've had to reach for an HTTP client to make requests to the service. [Faraday](https://github.com/lostisland/faraday) is a popular choice. It's easy to use and well documented. However, the way in which it gets used will impact how the code can be tested. This post will go through two different ways it can be tested.

## Setup

Suppose you're building an app to display today's weather in a given city. We'll be using the [Weather API](https://www.weatherapi.com/docs/) to get the weather data via a restful API that returns JSON data. Usage requires signing up for an API key, but the free tier is very generous and will be adequate for this demo.

A request to get the current weather and air quality index, for example, for Paris, looks like this:

```http
GET https://api.weatherapi.com/v1/current.json?key=yourApiKey&q=Paris&aqi=yes
```

And the response looks something like this (shortened for brevity):

```json
{
    "location": {
        "name": "Paris",
        "country": "France",
        "localtime": "2021-08-08 23:00"
    },
    "current": {
        "last_updated": "2021-08-08 22:00",
        "temp_c": 18.0,
        "condition": {
            "text": "Partly cloudy",
            "icon": "//cdn.weatherapi.com/weather/64x64/night/116.png",
            "code": 1003
        },
        "feelslike_c": 18.0,
        "uv": 4.0,
        "air_quality": {
            "us-epa-index": 1
        }
    }
}
```

Here is the first attempt at writing the `WeatherClient` using Faraday. It exposes a single method `today` that makes a `Faraday.get` request to the weather api, and parses the response to return a sentence such as:

"Weather for Paris, France is 18 degrees. Cloudy. Air quality is Good."

The mapping of `us-epa-index` to an air quality string such as `Good`, `Moderate` etc. comes from the Weather API docs. [dotenv](https://github.com/bkeepers/dotenv) is used to avoid hard-coding the API key and instead pull it from a git ignored `.env` file.

This is a plain old Ruby project with no Rails, so the dependencies are required:

```ruby
# app/weather_client.rb
require 'dotenv/load'
require 'faraday'
require 'json'

class WeatherClient
  def today(city:)
    response = Faraday.get('https://api.weatherapi.com/v1/current.json',
                           {
                             key: ENV['WEATHER_API_KEY'],
                             q: city,
                             aqi: 'yes'
                           },
                           { 'Accept' => 'application/json' })
    parse_today(JSON.parse(response.body))
  end

  private

  def parse_today(json)
    location = json['location']
    current = json['current']
    condition = current['condition']
    "Weather for #{location['name']}, #{location['country']} is #{current['temp_c']} degrees. #{condition['text']}.\
 Air quality is #{air_quality(current['air_quality']['us-epa-index'])}"
  end

  def air_quality(aq_val)
    aq_map = {
      1 => 'Good',
      2 => 'Moderate',
      3 => 'Unhealthy for sensitive groups',
      4 => 'Unhealthy',
      5 => 'Very Unhealthy',
      6 => 'Hazardous'
    }
    aq_map[aq_val] || 'Unknown'
  end
end
```

Some example usage in an irb console:

```
irb -r ./app/weather_client.rb
irb(main):001:0> WeatherClient.new.today(city: 'Paris')
=> "Weather for Paris, France is 17.0 degrees. Partly cloudy. Air quality is Good"
```

## 1. RSpec Stubbing

How to write a test for `WeatherClient`? Calling out to the Weather API is a side effect, and tests should not have any side effects. For example, each call uses up request quota for the API key. Even if usage were unlimited, this code is requesting the *current* weather. This means at any given day/time, the response could be different so it will be impossible to write a test expecting a specific result. Another consideration is the Weather API could go down at the same instance when the test is run, this would cause the test to fail even though no code changes had been made on this app.

Because the `today` method calls `Faraday.get` directly, RSpec stubbing must be used to set the returned response of the `Faraday.get` method for the test. This will prevent a real HTTP request from being sent when the test is run and instead return a canned response of our design. But in order to do this, we must know what kind of object is returned by `Faraday.get`, which is a `Faraday::Response`.

Then the code calls the `body` method of the returned `Faraday::Response` object, this contains the string content of the Weather API response. In order for this to work in a test, the stub of `Faraday.get` must return a test double, which will stand in for the `Faraday::Response` object. Then the `body` method of the test double is also stubbed to return the actual string response.

Here is the test:

```ruby
# spec/weather_client_spec.rb
require './app/weather_client_old'

RSpec.describe WeatherClient do
  describe '#today' do
    it 'gets current weather for a city' do
      # stub Faraday `get` method to avoid making a real HTTP request when test is run
      response_dbl = instance_double('Faraday::Response')
      allow(Faraday).to receive(:get)
        .with('https://api.weatherapi.com/v1/current.json',
              {
                key: ENV['WEATHER_API_KEY'],
                q: 'Paris',
                aqi: 'yes'
              },
              { 'Accept' => 'application/json' })
        .and_return(response_dbl)

      # stub body method on response object to return a canned response for Paris weather
      allow(response_dbl).to receive(:body)
        .and_return('{"location":{"name":"Paris","country":"France"},"current":{"temp_c":16.0,"condition":{"text":"Clear"},"air_quality":{"us-epa-index":1}}}')

      paris_weather = described_class.new.today(city: 'Paris')
      expect(paris_weather).to eq('Weather for Paris, France is 16.0 degrees. Clear. Air quality is Good')
    end
  end
end
```

### Problems

While this works, it feels a little clunky. We have to know some details of Faraday like the fact that calling `get` returns a `Faraday::Response` object. If a future release of Faraday will refactor to return a different object, then this test will fail even the refactored object behaves exactly the same as in the previous version. Generally speaking, use of stubs/mocks can make a test brittle because its verifying some implementation details rather than focusing on the expected return value of a method.

Also the double stubbing required - once for `Faraday.get` and again for the response double it returns, makes the test hard to read.

Another issue occurs when trying to add another Weather API request. For example, in addition to the current weather `/current.json`, there's another endpoint for the future weather at `/forecast.json`. When using `Faraday.get`, each request has to repeat the base url, headers, and common parameters such as the API key, for example:

```ruby
class WeatherClient
  def today(city:)
    response = Faraday.get('https://api.weatherapi.com/v1/current.json',
                           {
                             key: ENV['WEATHER_API_KEY'],
                             q: city,
                             aqi: 'yes'
                           },
                           { 'Accept' => 'application/json' })
    parse_today(JSON.parse(response.body))
  end

  # Some duplication with `today` method including base url, headers, and setting of API key
  def forecast(city:)
    response = Faraday.get('https://api.weatherapi.com/v1/forecast.json',
                           {
                             key: ENV['WEATHER_API_KEY'],
                             q: city
                           },
                           { 'Accept' => 'application/json' })
    # do something with response...
  end

  private

  # snip...
end
```

## 2. Faraday Stubbing

Fortunately, Faraday provides a cleaner solution for testing, but this will require some refactoring and introducing several new concepts.

### Faraday Connection

First, to fix the issue of code duplication - that every request to the API requires repeating the base url and common parameters. Faraday provides a `Faraday::Connection` object to store common configuration. Then subsequent http requests such as `get`, `post`, etc. can be made on the connection object.

To create a connection object, call `Faraday.new`. For example, the `today` method on `WeatherClient` could be written like this:

```ruby
class WeatherClient
  def today(city:)
    conn = Faraday.new(
      url: 'https://api.weatherapi.com/v1',
      params: { key: ENV['WEATHER_API_KEY'] },
      headers: { 'Accept' => 'application/json' }
    )

    response = conn.get('current.json', { q: city, aqi: 'yes' })
    parse_today(JSON.parse(response.body))
  end

  private

  # snip...
end
```

At this point, it doesn't seem like much of an improvement because all the common logic (base url, api key and headers) are still in the `today` method.

The beauty of this approach comes when pulling out the connection object into the `initialize` method and making it an instance variable. Then it can be shared among multiple API methods without having to repeat the base url, api key and headers. For example:

```ruby
class WeatherClient
  def initialize
    @conn = Faraday.new(
      url: 'https://api.weatherapi.com/v1',
      params: { key: ENV['WEATHER_API_KEY'] },
      headers: { 'Accept' => 'application/json' }
    )
  end

  def today(city:)
    response = @conn.get('current.json', { q: city, aqi: 'yes' })
    parse_today(JSON.parse(response.body))
  end

  def future(city:)
    response = @conn.get('forecast.json', { q: city })
    # do something with response...
  end

  private

  # snip...
end
```

Ok so the code duplication issue has been solved with use of an instance `Faraday::Connection` object, but how does this help with testing?

### Faraday Test Adapter

Faraday comes with a built-in test adapter for defining stubbed HTTP requests to mock out network services. A `Faraday::Connection` object can then be instantiated using the test adapter. For example:

```ruby
# Test adapter
stubs = Faraday::Adapter::Test::Stubs.new

# Instantiate a connection that uses the test adapter
conn = Faraday.new { |b| b.adapter(:test, stubs) }

# Define any number of mock network requests on the test adapter, which yields an array of three elements:
#   1. HTTP response code
#   2. Hash of HTTP response headers
#   3. String of HTTP response body
stubs.get('/some-endpoint') do
  [
    200,
    { 'Content-Type': 'application/json' },
    '{"name": "some canned response for testing"}'
  ]
end
```

If the stubbed connection object `conn` gets used to make an HTTP request that matches what is stubbed, then the HTTP response code will be 200 and the response body will be the canned response. No real network request to `/some-endpoint` will be made. For example:

```ruby
resp = conn.get('/some-endpoint')

resp.status # 200
resp.headers # { 'Content-Type': 'application/json' }
resp.body # '{"name": "some canned response for testing"}'
```

So the next question is - how to make `WeatherClient` use this stubbed connection object instead of a real connection object when running tests? This leads to the last and final concept that will tie this all together.

### Dependency Injection

Dependency injection is a technique that will allow us to "inject" a stubbed Faraday connection into `WeatherClient` for testing purposes. But first, what is dependency injection? According to [Wikipedia](https://en.wikipedia.org/wiki/Dependency_injection):

> In software engineering, dependency injection is a technique in which an object receives other objects that it depends on, called dependencies. Typically, the receiving object is called a client and the passed-in ('injected') object is called a service. The code that passes the service to the client is called the injector. Instead of the client specifying which service it will use, the injector tells the client what service to use. The 'injection' refers to the passing of a dependency (a service) into the client that uses it.

In this example, the `WeatherClient` is the "receiving object", and the "service" we want to pass in is a `Faraday::Connection`. The problem with the current implementation of `WeatherClient` is that the initializer *always* instantiates a new instance of `Faraday::Connection`:

```ruby
class WeatherClient
  def initialize
    # always constructs a new Faraday::Connection object
    @conn = Faraday.new(
      url: 'https://api.weatherapi.com/v1',
      params: { key: ENV['WEATHER_API_KEY'] },
      headers: { 'Accept' => 'application/json' }
    )
  end

  # snip...
end
```

To make `WeatherClient` support injecting a connection object, the `initialize` method is modified to optionally accept a `conn` parameter, and either use the provided parameter, or if not specified, instantiate a new Faraday connection object:

```ruby
class WeatherClient
  # Make Faraday connection injectable for easier testing.
  def initialize(conn = nil)
    @conn = conn || Faraday.new(
      url: 'https://api.weatherapi.com/v1',
      params: { key: ENV['WEATHER_API_KEY'] },
      headers: { 'Accept' => 'application/json' }
    )
  end

  # snip...
end
```

And finally, a test can be written against this version of `WeatherClient`, initializing it with a stubbed `Faraday::Connection` to avoid making real HTTP requests:

```ruby
require './app/weather_client'

RSpec.describe WeatherClient do
  # Faraday test adapter
  let(:stubs) { Faraday::Adapter::Test::Stubs.new }

  # Faraday::Connection object that uses the test adapter
  let(:conn) { Faraday.new { |b| b.adapter(:test, stubs) } }

  # WeatherClient with the stubbed connection object injected
  let(:client) { described_class.new(conn) }

  # Clear default connection to prevent it from being cached between different tests.
  # This allows for each test to have its own set of stubs
  after do
    Faraday.default_connection = nil
  end

  describe '#today' do
    it 'gets current weather for a city' do
      # Block yields an array with 3 items:
      #   1. HTTP response code
      #   2. Hash of headers
      #   3. String response body
      stubs.get('current.json') do
        [
          200,
          { 'Content-Type': 'application/json' },
          '{"location":{"name":"Paris","country":"France"},"current":{"temp_c":16.0,"condition":{"text":"Clear"},"air_quality":{"us-epa-index":1}}}'
        ]
      end

      paris_weather = client.today(city: 'Paris')
      expect(paris_weather).to eq('Weather for Paris, France is 16.0 degrees. Clear. Air quality is Good')

      # Verify every stubbed method that was defined on test adapter actually got called when code was exercised
      stubs.verify_stubbed_calls
    end
  end
end

```

## Which Approach to Use?

My preference is to use the built-in Faraday test adapter whenever possible because it results in cleaner looking tests and is officially supported by the library. However, as with most technical decisions, the correct answer is, it depends.

If you're fortunate to be green fielding a project, or at the very least, the client class that will be making HTTP requests, then go ahead and design the class with dependency injection and use the built-in Faraday test adapter. If on the other hand, you're dealing with legacy code that uses the Faraday class helper methods such as `Faraday.get`, `Faraday.post`, then the safest solution may be to use regular RSpec stubbing.

## Conclusion

This post has covered two different ways of using and testing Faraday for making HTTP requests to an external service. The first approach is to use Faraday's class helper methods, and test with regular RSpec stubbing. Although this works, it can lead to brittle, difficult to read tests, but may be the safest option when dealing with legacy code. The second approach is to design the client class with dependency injection, and then use Faraday's built-in test adapter to inject a stubbed connection into the class for testing.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.
