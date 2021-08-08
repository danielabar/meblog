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

How to write a test for `WeatherClient`? Calling out to the Weather API is a side effect, and tests should not have any side effects. For example, each call uses up request quota for the API key. Even if usage were unlimited, this code is requesting the *current* weather. This means at any given day/time, the response could be different so it will be impossible to write a test expecting a specific result.

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

While this works, it feels a little clunky. We have to know some details of Faraday like the fact that calling `get` returns a `Faraday::Response` object. If a future release of Faraday will refactor to return a different object, then this test will fail even the refactored object behaves exactly the same as in the previous version. Generally speaking, use of stubs/mocks can make a test brittle because its verifying some implementation details rather than only focusing on the expected return value of a method.

Also the double stubbing required - once for `Faraday.get` and again for the response double it returns makes the test hard to read. Fortunately, Faraday provides a cleaner way to test code that uses it, but this will require some refactoring.

## 2. Faraday Stubbing