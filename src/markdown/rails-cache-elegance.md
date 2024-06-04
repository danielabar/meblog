---
title: "Some Elegance with Rails Caching"
featuredImage: "../images/rails-cache-elegance-frankie-lopez-hKSJiRZ-ngk-unsplash.jpg"
description: "Explore the elegance of Rails caching using the 'fetch' method to optimize performance and easily handle slow operations."
date: "2024-06-01"
category: "rails"
related:
  - "Understanding ActiveRecord Dependent Options"
  - "A VS Code Alternative to Postman"
  - "They Don't All Have To Be ActiveRecord Models"
---

I was recently reviewing a pull request (PR) for a Rails project that was introducing Rails caching. Specifically, low-level caching for results of a known slow operation that needed to be called frequently. The initial code looked like the typical caching implementation I've seen in other languages: `read` from the cache, if the value is already there, use it, if not, call the slow operation, `write` the results to the cache, then use the results.

However, a read through the [Rails Guides on Caching](https://guides.rubyonrails.org/caching_with_rails.html) revealed a more elegant way of doing this. There's a `fetch` method that allows you to retrieve data from the cache, and provide an optional block to handle populating the cache if the value isn't there. Let's see how this works.

## Read & Write

Suppose the `Product` model has a method to retrieve prices from competitors sites so that it can compare if its own price is better. The call to find the competitors prices makes some external API requests, so its slow. In the example below, it's simulated with a `sleep(3)`, i.e. sleep for 3 seconds before returning some hard-coded results, for this simple demo:

```ruby
# app/models/product.rb
class Product < ApplicationRecord
  validates :name, :description, :price, presence: true

  # Calls slow operation `find_competing_prices` every time
  def better_than_competition?
    competitors_prices = find_competing_prices
    competitors_prices.all? { |_, competitor_price| price < competitor_price }
  end

  # Here we simulate a slow operation with `sleep(3)`.
  # In a real app, this would be in a service that's responsible
  # for making an external API call and returning the result.
  def find_competing_prices
    logger.info("Looking up competing prices for product #{id}...")
    sleep(3)
    {
      competitor_a: 29.99,
      competitor_b: 31.49,
      competitor_c: 29.55
    }
  end
end
```

Now let's introduce caching for the results of the slow operation `find_competing_prices`. Using a typical approach, which is to make calls to first `read` from the cache, and then `write` to the cache if the value isn't already cached. The `cache_key` method will be explained shortly.

```ruby
# app/models/product.rb
class Product < ApplicationRecord
  validates :name, :description, :price, presence: true

  def better_than_competition?
    # Check if the competing prices for this product have already been cached
    competitors_prices = Rails.cache.read("#{cache_key}/competing_prices")

    # If not, call the slow operation, and then save results to cache
    if competitors_prices.blank?
      competitors_prices = find_competing_prices
      Rails.cache.write("#{cache_key}/competing_prices", competitors_prices)
    end

    # Now we can use the results, whether from cache, or just retrieved
    competitors_prices.all? { |_, competitor_price| price < competitor_price }
  end

  # Slow operation
  def find_competing_prices
    # ...
  end
end
```

The above code works, but Rails provides a more elegant method to handle caching.

## Cache Fetch

In addition to `read` and `write` methods, Rails provides a `fetch` method on the cache. Here's how it works:

```ruby
result = Rails.cache.fetch('my_key') do
  expensive_data_fetching_method
end
```

The `fetch` method first checks if `my_key` is in the cache. If it's not, it automatically executes the block provided, which is the `expensive_data_fetching_method` in the above example. The result is then stored in the cache under the `my_key` key. If `my_key` is already in the cache, then `fetch` simply returns the cached result, making it an elegant way to handle caching in Rails.

Let's update the `better_than_competition?` method in the `Product` model to use `fetch` rather than making separate calls to `read` and `write`:

```ruby
# app/models/product.rb
class Product < ApplicationRecord
  validates :name, :description, :price, presence: true

  def better_than_competition?
    # Read from or write to cache
    competitors_prices = Rails.cache.fetch("#{cache_key}/competing_prices") do
      find_competing_prices
    end
    competitors_prices.all? { |_, competitor_price| price < competitor_price }
  end

  # Slow operation
  def find_competing_prices
    # ...
  end
end
```

## Cache Keys

Another nice feature that Rails provides is automatic construction of the cache keys for models. All the previous examples referenced a `cache_key` method, for example:

```ruby
# In any model method
Rails.cache.fetch("#{cache_key}/competing_prices")
```

But we didn't have to define `cache_key` in the model class. The [cache_key](https://api.rubyonrails.org/classes/ActiveRecord/Integration.html#method-i-cache_key) method is part of ActiveRecord. It returns a concatenation of the model name and its primary key. We can explore this in the Rails console `bin/rails c`:

```ruby
product = Product.first
=> #<Product:0x00000001080c9618 id: 1, name: "whatever"...

product.cache_key
=> "products/1"
```

So when any caching code runs such as:

```ruby
# In any instance method in Product class
Rails.cache.fetch("#{cache_key}/competing_prices")
```

What its doing is looking in the cache for a key like `products/1/competing_prices`.

## Cache Invalidation

You've probably heard that cache invalidation is one of the hard things in computer science ([jokes](https://www.martinfowler.com/bliki/TwoHardThings.html)). Rails can help with this problem. In addition to the `cache_key` method, it also provides the [cache_key_with_version](https://api.rubyonrails.org/classes/ActiveRecord/Integration.html#method-i-cache_key_with_version) method, which incorporates the model's `updated_at` timestamp.

Let's see how this works in the Rails console:

```ruby
Product.select(:id, :name, :updated_at).first
=> #<Product:0x0000000113bb3848 id: 6, name: "whatever", updated_at: Sun, 12 Nov 2023 16:35:53.983721000 UTC +00:00>

# Notice this incorporates both the product id and updated_at timestamp
product.cache_key_with_version
=> "products/6-20231112163553983721"

# Updating the price also updates the model's `updated_at`
product.update!(price: 32.99)
=> true

# Now we have a different cache key because updated_at has changed
product.updated_at
=> Tue, 04 Jun 2024 12:00:49.561587000 UTC +00:00

product.cache_key_with_version
=> "products/6-20240604120049561587"
```

This is useful if you need the cache to be populated with fresh data, anytime a model gets updated, then looked up in the cache again. In this case, our caching could be updated to use the `cache_key_with_version` method instead of `cache_key`:

```ruby
def better_than_competition?
  # Read from or write to cache using a timestamped key
  # If the product has been updated since the last time it was cached,
  # this will be considered a cache miss and a new entry will be
  # populated in the cache.
  competitors_prices = Rails.cache.fetch("#{cache_key_with_version}/competing_prices") do
    find_competing_prices
  end
  competitors_prices.all? { |_, competitor_price| price < competitor_price }
end
```

<aside class="markdown-aside">
This is not to suggest that the problem of cache invalidation is completely solved. This is a very large topic that's outside the scope of this post. While the "cache_key_with_version" method in Rails can assist with constructing cache keys and incorporating model versioning through "updated_at", cache invalidation remains a nuanced challenge and this may not cover every use case.
</aside>

## Conclusion

The Rails cache `fetch` method and automatic cache key construction are just a few examples of the many developer niceties that Rails offers. It's thoughtful details such as these that make Rails a go-to choice for web developers looking to be productive and enjoy their work. For those who regard this as too much "magic", there's always the classic `read` and `write` methods. You can also define your own cache key/version methods if you need different behaviour than what Rails provides. See the [Rails Guides: Caching](https://guides.rubyonrails.org/caching_with_rails.html) and the [API Docs](https://api.rubyonrails.org/classes/ActiveRecord/Integration.html#method-i-cache_key) for more details.

If you'd like to explore the code examples in this post, they are available on [GitHub](https://github.com/danielabar/cache-demo). Feel free to check out the repository and try out the examples for product caching.
