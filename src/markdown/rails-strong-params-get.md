---
title: "Rails Strong Params for GET Request"
featuredImage: "../images/strong-params-sigmund-f0dJjQMhfXo-unsplash.jpg"
description: "Learn how to use Rails strong parameters with an HTTP GET request."
date: "2021-10-02"
category: "rails"
---

If you've been using Rails for a while, you've probably encountered [Strong Parameters](https://api.rubyonrails.org/v6.1.3/classes/ActionController/StrongParameters.html). This feature was introduced in Rails 4 and is intended to prevent mass assignment. The typical use case for this is to protect a POST or PUT/PATCH endpoint, which is invoked when a user submits a form and a controller action tries to create or update the corresponding model.

This post will demonstrate how strong params can also be used to protect a GET request. Why would you ever want to do that? I'll get to that in a minute. First, let's look at the typical case for strong params.

## Typical Case: POST

Given an HTML form such as:

```html
<form action="/person">
  <input type="text" name="person[name]" id="person_name">
  <input type="text" name="person[email]" id="person_email">
  <button type="submit">Create</button>
</form>
```

When the submit button on this form is clicked, it will invoke a `POST` http action to the `/person` endpoint, with the following parameters:

```ruby
{
  "person"=>
    {
      "name"=>"fred",
      "email"=>"fred@example.com"
    }
}
```

The corresponding `PersonController#create` method is responsible for creating a new `Person` model with the `name` and `email` properties populated and saving to the database. A naive implementation would look like:

```ruby
class PeopleController < ActionController::Base
  def create
    Person.create(params)
  end
end
```

But what if a sneaky user modifies the form or uses a REST client to submit an additional parameter that happens to be used internally, but is not intended to be set by a user such as `is_admin`, for example:

```ruby
{
  "person"=>
    {
      "name"=>"fred",
      "email"=>"fred@example.com"
      "is_admin"=>"true"
    }
}
```

The Rails solution is to use strong parameters to only allow the `name` and `email` properties of the form to be saved, rather than passing the entire user generated `params` to the model create method:

```ruby
class PeopleController < ActionController::Base
  def create
    Person.create(person_params)
  end

  private

  def person_params
    params.require(:person).permit(:name, :email)
  end
end
```

Now, any additional parameters submitted to the `/person` endpoint will be discarded when `Person.create` is called because the `person_params` method only allows `name` and `email`.

Here we get to the point where as a newcomer to Rails, it's very easy to copy/paste the example from the [Rails api docs](https://api.rubyonrails.org/v6.1.3/classes/ActionController/StrongParameters.html), and as long as your usage is the same as the typical case, it will work just fine. However, sometimes your use case may be a little different, and the copy/paste no longer works. In this case, it requires digging in a little to understand what's going on "under the hood" so to speak.

## Unusual Case: GET

Suppose your application exposes a `GET /search?q=somethingUserIsLookingFor` endpoint, but behind the scenes, the actual search action is delegated to a third party service.

The search form accepts a search term from the user named `q`. Since this is a query and doesn't modify any state, the `GET` method is used.

```html
<form action="/search" method="get">
  <input type="text" name="q">
  <button>Search</button>
</form>
```

The search action is handled by the search controller, which passes on the params given to it to the third party search service to perform the actual search:

```ruby
class SearchController < ActionController::Base
  def search
    ThirdPartySearchService.call(params)
  end
end
```

Where the incoming `params` look like this:

```ruby
{
  "q"=>"something the user typed into the form"
}
```

Since `params` comes from the user, it would be useful to restrict the fields that get sent to the third party search service to only the expected fields. In this simple example there's only one expected field `q`.

This sounds like a job for strong parameters! But recall the typical example:

```ruby
class PeopleController < ActionController::Base
  def create
    Person.create(person_params)
  end

  private

  def person_params
    params.require(:person).permit(:name, :email)
  end
end
```

This doesn't seem to be a good fit for a controller handling a `GET` request because its not creating or updating a model.

To make strong parameters work for the search controller, we need to understand what `params` is. It appears to be a hash of inputs to the controller, that come from either an HTML form, url, or query parameters. It's actually a method that returns an instance of [ActionController::Parameters](https://api.rubyonrails.org/classes/ActionController/Parameters.html). This instance exposes the input parameters as a hash, but also has methods like `permit` and `require`.

Looking at the api docs for the [permit](https://api.rubyonrails.org/classes/ActionController/Parameters.html#method-i-permit) method, it accepts a list of filters, and returns a new instance of `ActionController::Parameters` containing only fields that were specified in the filters.

This means the search controller could call the `permit` method on `params`, specifying that only the `q` field is allowed, then pass the resulting new params object to the third party service:

```ruby
class SearchController < ActionController::Base
  def search
    ThirdPartySearchService.call(search_params)
  end

  def search_params
    params.permit(:q)
  end
end
```

In a sense a "model" is being built out of the params, but its not a Rails model, rather, something that is being passed to a third party service. This is how strong parameters can be useful, even when not creating a Rails model.

## Conclusion

This post has covered the typical use case for strong parameters in Rails and how it can also be used for a non typical case of an http GET request.

## Related Content

The following section contains affiliate links for related content you may find useful. I get a small commission from purchases which helps me maintain this site.

Looking to level up on Rails 6? You might like this book: [Agile Web Development with Rails 6](https://amzn.to/3wS8GNA).

Working on a large legacy code base? This book [Working Effectively with Legacy Code](https://amzn.to/3accwHF) is a must read.

Martin Fowler's [Refactoring: Improving the Design of Existing Code](https://amzn.to/2RFC0Xn) is also amazingly useful on this topic.

Is your organization introducing microservices? This book [Building Event-Driven Microservices: Leveraging Organizational Data at Scale](https://amzn.to/3uSxa87) is a fantastic resource on this topic.
