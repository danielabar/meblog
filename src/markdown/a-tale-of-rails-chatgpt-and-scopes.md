---
title: "A Tale of Rails, ChatGPT, and Scopes"
featuredImage: "../images/rails-scopes-chatgpt-elizabeth-gottwald-dnIWYrliZfU-unsplash.jpg"
description: "Learn from this cautionary tale about using ChatGPT in an attempt to improve some code duplication in Rails. Explore the challenges faced while optimizing a routine query and the valuable lessons learned about Rails scopes."
date: "2024-01-01"
category: "rails"
related:
  - "Understanding ActiveRecord Dependent Options"
  - "Rails Enums with MySQL or Postgres"
  - "They Don't All Have To Be ActiveRecord Models"
---

Today I'd like to share a cautionary tale about using ChatGPT to improve some Rails model querying code, and how the Rails Guides and API docs turned out to be a better resource in this case.

## The Problem

I'm working on a Rails application to handle agile retrospective meetings for teams. The Retrospective model has an enum to indicate whether the retrospective is open or closed. There can only be one open retrospective at a time, which is represented with a custom validation rule. Here is the model:

```ruby
# == Schema Information
#
# Table name: retrospectives
#
#  id         :bigint           not null, primary key
#  status     :enum             default("open"), not null
#  title      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_retrospectives_on_title  (title) UNIQUE
#
class Retrospective < ApplicationRecord
  has_many :comments, dependent: :destroy

  enum status: {
    open: "open",
    closed: "closed"
  }

  validates :title, presence: true, uniqueness: true
  validates :status, presence: true
  validate :only_one_open_retrospective

  private

  def only_one_open_retrospective
    return unless open? && Retrospective.exists?(status: "open")

    errors.add(:status, "There can only be one open retrospective at a time.")
  end
end
```

Throughout the application, I frequently need to access the one and only open retrospective. After some time, I noticed this code appeared multiple times throughout the services layer:

```ruby
Retrospective.find_by(status: Retrospective.statuses[:open])
```

In the future, the logic to find the retrospective could change, for example, if the application is enhanced for multi-tenancy. To avoid code duplication, and having the services be dependent on these details of the retrospective model, I decided to refactor by adding a class method `find_open` on the model:

```ruby
class Retrospective < ApplicationRecord
  # ...
  enum status: {
    open: "open",
    closed: "closed"
  }

  def self.find_open
    Retrospective.find_by(status: Retrospective.statuses[:open])
  end
end
```

Then all the services that need access to the open retrospective can simply call the `find_open` method on the model class:

```ruby
# app/services/some_service.rb
class SomeService
  def call
    retro = Retrospective.find_open
    # do something with retro...
  end
end
```

## Ask ChatGPT

The `find_open` model method worked, but I had a feeling there might be a more "Rails-ey way" of doing things. So I gave the model code to ChatGPT and asked if there was a more idiomatic Rails solution to deal with the code duplication. ChatGPT said that using Rails scopes would be better for query re-usability. Here's what it came up with:

```ruby
class Retrospective < ApplicationRecord
  # ...
  enum status: {
    open: "open",
    closed: "closed"
  }

  scope :open_retrospective, -> { find_by(status: statuses[:open]) }
end
```

Looks reasonable? Let's try this out in a Rails console. I started from an empty database:

```ruby
# Create an open retrospective
retro1 = Retrospective.create(
  title: "My Project Sprint 2",
  status: Retrospective.statuses[:open]
)

# Also create a closed retrospective
retro2 = Retrospective.create(
  title: "My Project Sprint 1",
  status: Retrospective.statuses[:closed]
)

# Use the scope suggested by ChatGPT to find the open retrospective
result = Retrospective.open_retrospective
# SELECT "retrospectives".*
# FROM "retrospectives"
# WHERE "retrospectives"."status" = $1 LIMIT $2  [["status", "open"], ["LIMIT", 1]]

result
# <Retrospective:0x00000001140fa018
#   id: 22,
#   title: "My Project Sprint 2",
#   status: "open"
#   created_at: ..., updated_at: ...
# >

result.class
# => Retrospective(id: integer, title: string, created_at: datetime, updated_at: datetime, status: enum)
```

When the scope is invoked, the Rails console output shows a SQL SELECT running to find retrospectives where the status is `open`. Then the scope returns the model titled "My Project Sprint 2", which is the only open retrospective in the database. So far so good.

However, what will the scope return when there are no open retrospectives? I was expecting a `nil` return, but here's what actually happened:

```ruby
# Close the currently open retrospective with the enum-generated method
retro1.closed!

# Use the scope suggested by ChatGPT
result = Retrospective.open_retrospective
# === RUNS THIS QUERY, THE SAME AS BEFORE,
# === BUT IT DOES NOT RETURN ANY RESULTS
# SELECT "retrospectives".*
# FROM "retrospectives"
# WHERE "retrospectives"."status" = $1 LIMIT $2  [["status", "open"], ["LIMIT", 1]]

# === THEN RUNS ANOTHER QUERY TO FETCH ALL RETROSPECTIVES!
# SELECT "retrospectives".* FROM "retrospectives"

result
# [
#   <Retrospective:0x00000001140fa018
#     id: 23,
#     title: "My Project Sprint 1",
#     status: "closed"
#     created_at: ..., updated_at: ...
#   >,
#   <Retrospective:0x00000001140fa018
#     id: 22,
#     title: "My Project Sprint 2",
#     status: "closed"
#     created_at: ..., updated_at: ...
#   >
# ]

result.class
# => Retrospective::ActiveRecord_Relation

result.size
# => 2
```

This time, the results are unexpected. When the scope is invoked, the Rails console output shows its running the same SQL SELECT as before to find an open retrospective. However, in this case, none are found. Then the Rails console output shows that the scope proceeds to run a second query that fetches *all* retrospectives from the database, regardless of status.

In this case, the return result from the scope is an [ActiveRecord::Relation](https://api.rubyonrails.org/v7.1.2/classes/ActiveRecord/Relation.html) representing a query that returns *all* the retrospectives (there are just 2 in this simple example).

Not only was I not getting `nil` as expected, but this could cause a performance problem as the application grows and there are large numbers of records in the `retrospectives` table.

I explained the situation to ChatGPT and it did that thing where it apologizes, then provides the same solution again that doesn't fix the problem. (I encountered a similar issue awhile back trying to find the syntax for a [distinct GraphQL query](../gatsby5-distinct-query#ai-to-the-rescue))

## Ask the Docs

When AI doesn't provide the solution, it's good to lean on skills we engineers developed before the existence of such tools. Read the documentation! Industry old-timers may remember this as [RTFM](https://en.wikipedia.org/wiki/RTFM).

I started with the guide on the [Active Record Query Interface](https://guides.rubyonrails.org/active_record_querying.html), more specifically, the section on [scopes](https://guides.rubyonrails.org/active_record_querying.html#scopes). Here I found this illuminating description:

> Scoping allows you to specify commonly-used queries which can be referenced as method calls on the association objects or models. With these scopes, you can use every method previously covered such as where, joins and includes. All scope bodies should return an ActiveRecord::Relation or nil to allow for further methods (such as other scopes) to be called on it.

This phrase is key: **All scope bodies should return an ActiveRecord::Relation**

Let's take another look at the scope that ChatGPT generated:

```ruby
scope :open_retrospective, -> { find_by(status: statuses[:open]) }
```

What does the `find_by` method return? The answer to this can be found in the [Rails API docs for find_by](https://api.rubyonrails.org/classes/ActiveRecord/FinderMethods.html#method-i-find_by). Quoting the relevant snippet:

> Finds the first record matching the specified conditions... If no record is found, returns nil.

Aha! So `find_by` does not return an `ActiveRecord::Relation`. It returns either the model instance if one is found matching the given conditions, or it returns `nil`. This starts to explain some of the surprising behaviour encountered earlier with the scope, it's not being given a method that returns a relation.

The next part of the mystery is, why did the scope proceed to query for *all* model instances, when the finder returned `nil`? Although the guides explained that the scope should return a relation or `nil`, it didn't say what happens if `nil` is returned. The answer to this can be found in the Rails API docs for [scope](https://api.rubyonrails.org/classes/ActiveRecord/Scoping/Named/ClassMethods.html#method-i-scope). Quoting the relevant snippet:

> Adds a class method for retrieving and querying objects... If it returns nil or false, an all scope is returned instead.

Aha! Another piece of the mystery resolved. If the body of the scope returns `nil`, which is the behaviour of `find_by` when no records are found, then the scope will go ahead and return an `all` scope. What exactly is an `all` scope? You can probably guess by the name that it will return a relation representing all the records for the model where this scope is defined. To be absolutely sure, let's check the Rails API docs for [all](https://api.rubyonrails.org/classes/ActiveRecord/Scoping/Named/ClassMethods.html#method-i-all). Here there's only a one sentence description:

> Returns an ActiveRecord::Relation scope object.

And a code example that demonstrates the behavior of `all`:

```ruby
posts = Post.all
posts.size # Fires "select count(*) from  posts" and returns the count
posts.each {|p| puts p.name } # Fires "select * from posts" and loads post objects
```

## Solution

Putting together all the information from the Rails guides and API documentation, the scope can be fixed to return an `ActiveRecord::Relation` by using the [where](https://api.rubyonrails.org/classes/ActiveRecord/QueryMethods.html#method-i-where) method rather than a finder method:

```ruby
class Retrospective < ApplicationRecord
  # ...
  enum status: {
    open: "open",
    closed: "closed"
  }

  scope :open_retrospective, -> { where(status: statuses[:open]) }
end
```

Trying this version in the Rails console `bin/rails c`:

```ruby
# Starting from all retrospectives closed:
Retrospective.select(:id, :title, :status)
# [
#   <Retrospective:0xb2fb40 id: 23, title: "My Project Sprint 1", status: "closed">,
#   <Retrospective:0xb2faa0 id: 22, title: "My Project Sprint 2", status: "closed">
# ]

# This time, using the scope returns an empty relation:
result = Retrospective.open_retrospective
# => []
result.class
# => Retrospective::ActiveRecord_Relation

# Re-open one of the retrospectives with the enum method
Retrospective.find_by(title: "My Project Sprint 2").open!

# Use the scope again, this time it returns a relation
# with the one open retrospective
result = Retrospective.open_retrospective
# [ <Retrospective:0xb2faa0 id: 22, title: "My Project Sprint 2", status: "closed"> ]
```

Since `where` always returns a relation (unlike `find_by` which returns the model instance), usage of this scope in application code can call `first` to get the model instance:

```ruby
# anywhere in service code that needs the one open retro
retro = Retrospective.open_retrospective.first
```

## Lessons Learned

A few things learned from this experience:

It seems that ChatGPT saw my original code using the finder method, and knew that scopes are a good solution for query re-usability, so it simply placed the finder in a scope. It did not make the inference that `find_by` doesn't return an ActiveRecord relation, therefore it doesn't make sense to put that in a scope.

Always try positive and negative cases, whether its code you wrote yourself, or suggested by AI. Recall the positive case seemed to work, but unexpected results were encountered in the negative case.

While ChatGPT can improve developer productivity, it may not fully understand the frameworks and libraries you're using, resulting in the introduction of subtle bugs. For now, any code it generates requires careful double-checking before committing.

The [Rails Guides](https://guides.rubyonrails.org/) and [API docs](https://api.rubyonrails.org/) are fantastic resources. If you ever run into seemingly "weird" behaviour with Rails, there's a good chance you'll find an explanation here.
