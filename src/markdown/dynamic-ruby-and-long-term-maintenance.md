---
title: "Dynamic Ruby And Hidden Maintenance Costs"
featuredImage: "../images/dynamic-ruby-maintenance-karla-hernandez-LrlyZzX6Sws-unsplash.jpg"
description: "This post explores how Ruby's dynamic dispatch and runtime constant resolution can make code elegant but harder to understand and maintain over time."
date: "2026-02-01"
category: "ruby"
related:
  - "Avoid this Bug with Numeric Environment Variables in Ruby"
  - "Rails Console-like Environment for a Plain Ruby Project"
  - "Configurable Retry with Ruby"
---

Ruby makes it incredibly easy to write elegant, dynamic code. The language practically encourages it with features like `constantize`, `classify`, and metaprogramming. When you discover these capabilities, it feels empowering, like you're writing less code that does more.

But there's a hidden cost to elegant abstractions in application code, especially on projects that will be maintained by multiple developers over many years. This post explores a real-world example where a well-intentioned dynamic pattern made the codebase harder to understand and maintain, even though the code itself was technically correct and elegantly written.

## Where Are the Callers?

I was investigating a Sidekiq job called `DataSyncer` that accepts a `class_name` as an argument:

```ruby
class DataSyncer
  include Sidekiq::Worker

  def perform(class_name, id, options = {})
    model = class_name.constantize.find(id)

    case class_name.constantize.model_name.singular.to_sym
    when :product
      # ... sync product data
    when :article
      # ... sync article data
    else
      raise ArgumentError.new("#{ self.class.name } does not support class_name: #{ class_name }")
    end
  end
end
```

The job handles two different model types: `Product` and `Article`. But when I searched the codebase for references to `DataSyncer`, I only found one explicit caller:

```ruby
# app/models/product.rb
class Product < ApplicationRecord
  has_many :line_items
  has_many :orders, through: :line_items

  after_update_commit do
    if saved_change_to_tags?
      DataSyncer.perform_async(self.class.name, id)
    end
  end
end
```

This raised an immediate question: Why does `DataSyncer` have a `:article` handler when only `Product` appears to call it? My first instinct was that this might be dead code left over from a refactoring. I was tempted to remove the unused `:article` branch.

But something made me pause. The code seemed too intentional to be simply forgotten. There had to be a reason for that flexibility.

## Dynamic Job Dispatcher

After some deeper investigation, I discovered the missing piece. The `Article` model had a callback that didn't directly reference `DataSyncer`, but was invoking it indirectly:

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  after_create_commit do
    BackgroundJobDispatcher.new(self.class.name, id).execute
  end
end
```

This led me to the following service class:

```ruby
# app/services/background_job_dispatcher.rb
class BackgroundJobDispatcher
  def initialize(class_name, id)
    @class_name = class_name
    @id = id
  end

  def execute
    raise NotImplementedError unless dispatchable?

    sync_attributes.each do |attribute|
      job_class_for(attribute).perform_async(class_name, id)
    end
  end

  private

  def dispatchable?
    class_name == "Article"
  end

  def job_class_for(attribute)
    [attribute, :syncer].join("_").classify.safe_constantize
  end

  def sync_attributes
    %i[metadata data].freeze
  end

  attr_reader :class_name, :id
end
```

**How it works:**

The `BackgroundJobDispatcher` uses string manipulation to dynamically resolve job class names:

1. For each attribute in `sync_attributes` (`:metadata` and `:data`)
2. It constructs a string by joining the attribute with `:syncer`: `"metadata_syncer"`, `"data_syncer"`
3. It converts these to class names: `"MetadataSyncer"`, `"DataSyncer"`
4. It looks up these classes as constants and calls `.perform_async` on them

So when an `Article` is created, it automatically triggers `MetadataSyncer` and `DataSyncer` jobs without the `Article` model ever explicitly naming those classes.

From a design perspective, this pattern has some appealing qualities:

- **Extensible**: Need to add another syncer? Just add it to `sync_attributes`
- **Convention-driven**: Job names follow a predictable pattern (`{attribute}_syncer`)
- **Decoupled**: The model doesn't need to know about specific job classes

## The Cost of Flexibility

While this code works perfectly from a technical standpoint, it creates significant friction for long-term maintenance.

### Discoverability

When I searched for `DataSyncer` in the codebase, the dynamic dispatch through `BackgroundJobDispatcher` didn't show up. The connection between `Article` and `DataSyncer` was invisible to static analysis tools, grep, and IDE features like "Find Usages."

This made it difficult to:
- Understand the full scope of where `DataSyncer` is called
- Assess the impact of changes to `DataSyncer`
- Know whether code was safe to remove

### Cognitive Load

Every future developer who encounters this code needs to:
1. Discover that `BackgroundJobDispatcher` exists
2. Understand the string manipulation logic
3. Mentally map attributes to their corresponding job classes
4. Remember this pattern exists when making future changes

This isn't complex logic, but it's *surprising*. It requires extra mental energy that compounds over time as more developers join the project.

### Limited Reuse

In this codebase, `BackgroundJobDispatcher` is only used by the `Article` model, which only had two sync operations. The flexibility to handle multiple operations exists, but it's never exercised. The abstraction was built for a level of generality that wasn't actually needed.

## A Simpler Alternative

The same functionality could be achieved with two explicit lines in the `Article` model:

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  after_create_commit do
    MetadataSyncer.perform_async(id)
    DataSyncer.perform_async(id)
  end
end
```

This version:
- Is immediately understandable to any developer
- Shows up in static searches for `DataSyncer`
- Requires no additional service class
- Makes the relationship between `Article` and its syncers explicit

Yes, if you need to add a third syncer, you add a third line. Personally I don't view this as a burden, it's clarity.

## When Dynamic Patterns Make Sense

To be clear, there's nothing inherently wrong with the dynamic job dispatcher pattern. It could be useful as:

- **A documented library or gem** that handles job dispatching across multiple projects
- **A framework-level abstraction** where the benefits of the pattern justify the cognitive overhead

In those contexts, the investment in understanding the abstraction pays dividends because it's used widely and consistently.

But in application code, where the primary goal is to model your specific business logic, explicit is often better than dynamic.

## Lessons for Long-Term Projects

This experience reinforced a few principles for me:

**Optimize for reading, not writing.** Code is read far more often than it's written. The few extra seconds it takes to write explicit job calls is dwarfed by the minutes (or hours) future developers will spend understanding dynamic code.

**Abstractions should pay for themselves.** Before creating an abstraction, ask: "Will this be reused enough to justify the cognitive overhead?" If the answer is unclear, err on the side of explicitness.

**Consider the maintenance context.** On projects that will live for years with multiple developers coming and going, predictable patterns are more valuable than elegant ones. The boring code that future [on-call you can understand at 2am](https://www.pcloadletter.dev/blog/clever-code/) is better than the clever code that present-you is proud of.

## Conclusion

What feels like productivity gains when writing code can become maintenance costs when that code needs to be understood, modified, and debugged by others years later. Ruby gives us powerful tools for abstraction, but on long-lived projects, sometimes the best code is the code that solves the current problem as simply as possible, and doesn't try to be too flexible.

The next time you're tempted to write a dynamic abstraction in your application code, ask yourself: "Will future developers thank me for this, or will they wish I had just written it out explicitly?" The answer might surprise you.

## TODO
* this example is from a Rails project but could apply to any Ruby code
* add aside in lessons learned: In the age of AI assistants they could find it but... code still needs to be understandable by humans, what if the AI is unavailable or costs become excessive etc
* WIP edit
