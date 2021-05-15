---
title: "Construct a PATCH request for a JSON API"
featuredImage: "../images/change-leaves.jpg"
description: "Learn how to Construct a PATCH request when using the jsonapi-resources gem with Rails."
date: "2020-11-20"
category: "rails"
---

I'm currently building a subscription management and notification microservice in Rails and decided to use the [jsonapi-resources](https://github.com/cerebris/jsonapi-resources) gem to build a JSON spec compliant REST API. This will allow clients of the microservice to submit http requests to do things like add new plans and register new subscriptions for these plans.

At this point some readers may be wondering why build a custom subscription management system? Why not use Stripe or Recurly or some other established subscription-as-a-service offering? The reasons for that are beyond the scope of this article, but suffice to say, several of these services were researched and determined not to be a good fit for this project.

Back to the story. Another thing a client of this service may want to do is update a plan, for example, the price may have changed. Although the `jsonapi-resource` gem is fairly well documented, I couldn't find an example of how to construct a PATCH request to update a resource. After some trial and error, got it working, and wanted to share the results here.

To start, here is the plan resource class, which is a wrapper for the `Plan` model. It exposes several attributes from the plan model such as currency, name, recurring interval and the price in cents (not related to this post, but it's generally good practice to store prices in cents to avoid rounding errors).

```ruby
# app/resources/api/v1/plan_resource.rb
module Api
  module V1
    class PlanResource < JSONAPI::Resource
      attributes :currency, :name, :recurring_interval, :recurring_interval_count, :unit_amount_cents
      belongs_to :tenant

      def meta(_options)
        {
          last_updated_at: _model.updated_at
        }
      end
    end
  end
end
```

And the plans resource is configured in the routes file as follows:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      jsonapi_resources :plans
    end
  end
end
```

Now suppose there exists a Plan in the system with id `6d369edf-af6b-4da3-a928-3ab6160b3284` (if you want to learn how to configure Rails and Postgres to work with UUID as a primary key, see my [post on UUID](/blog/rails-uuid-primary-key-postgres/)) that has a current price of $20.00 per month (i.e. 2000 cents), and the price has gone up to $22.00 (i.e. 2200 cents). Given a rails server running on the default port 3000 via `bundle exec rails s`, then the following curl request will update this plan with the new price:

```
curl --location --request PATCH 'http://localhost:3000/api/v1/plans/6d369edf-af6b-4da3-a928-3ab6160b3284' \
--header 'Accept: application/vnd.api+json' \
--header 'Content-Type: application/vnd.api+json' \
--data-raw '{
    "data": {
        "id": "6d369edf-af6b-4da3-a928-3ab6160b3284",
        "type": "plans",
        "attributes": {
            "unit-amount-cents": 2200
        }
    }
}'
```

A 200 OK (success) response will be returned with the body containing the updated plan, as well as some metadata (configured to show last updated timestamp in the resource class) and self and relationship links:

```json
{
  "data": {
    "id": "6d369edf-af6b-4da3-a928-3ab6160b3284",
    "type": "plans",
    "links": {
      "self": "http://localhost:3000/api/v1/plans/6d369edf-af6b-4da3-a928-3ab6160b3284"
    },
    "attributes": {
      "currency": "USD",
      "name": "The Best Plan Ever",
      "recurring-interval": "month",
      "recurring-interval-count": 1,
      "unit-amount-cents": 2200
    },
    "relationships": {
      "tenant": {
        "links": {
          "self": "http://localhost:3000/api/v1/plans/6d369edf-af6b-4da3-a928-3ab6160b3284/relationships/tenant",
          "related": "http://localhost:3000/api/v1/plans/6d369edf-af6b-4da3-a928-3ab6160b3284/tenant"
        }
      }
    },
    "meta": {
      "last_updated_at": "2020-11-20 20:46:12 UTC"
    }
  }
}
```

The curious thing is that the plan id needs to be specified twice - once in the url so the route will match `PATCH /api/v1/plans/:id(.:format)`, but it also needs to be specified in the body, in the `data` hash. Not specifying it will result in a 400 bad request error:

```json
{
  "errors": [
    {
      "title": "A key is required",
      "detail": "The resource object does not contain a key.",
      "code": "109",
      "status": "400"
    }
  ]
}
```

At first I couldn't understand why this error was returned given the id is specified in the url, but it looks like the `jsonapi-resource` gem expects to also find it in the body. I hope this will save you some time if you're setting up an api with this gem.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.
