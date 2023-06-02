---
title: "Add a Kafka Consumer to Rails"
featuredImage: "../images/rails-kafka-consumer-tom-grunbauer-8_9Rix4OvrM-unsplash.jpg"
description: "Learn how to integrate a Kafka consumer into a Rails application"
date: "2023-10-01"
category: "rails"
related:
  - "Rails CORS Middleware For Multiple Resources"
  - "Fix Rails Blocked Host Error with Docker"
  - "Add Rubocop to an Existing Rails Project"
---

This post will walk through how to integrate a Kafka consumer into a Rails application in a maintainable and testable way. Why would you need to do this? Consider the following scenario: You're working on an e-commerce system that has been developed with Rails. You'd like to enhance the product details page to show whether the current product is in stock, out of stock, or only has small number of items left (eg: "Only 3 left in stock!"). The inventory information comes from a legacy inventory management system that has been written in a different programming language. This legacy system is responsible for updating the inventory count based on events, such as product purchases, returns, or stock replenishments.

In order to display this inventory information in the Rails e-commerce app, it needs the ability to communicate with the legacy inventory system. There are many [solutions](https://en.wikipedia.org/wiki/Enterprise_Integration_Patterns) for enabling different systems to communicate, each with tradeoffs to consider. For this post, I will show you how Kafka can be used to solve this problem. Apache Kafka is a distributed streaming platform that enables high-throughput, fault-tolerant, and real-time event data streaming for building scalable and event-driven applications.

## Big Picture

Conceptually, here is what we'll be building:

TODO: diagram

We'll be focusing on the Rails side of things. Assume that another team is maintaining the inventory management system and they've already modified it to produce JSON formatted messages every time there's an inventory change. Here's an example message showing that the product identified by product code `ABCD1234` now has 23 units left in stock:

```json
{
  "product_code": "ABCD1234",
  "inventory_count": 23
}
```

These messages will be produced to a Kafka topic named `inventory_management_product_updates`. When integrating Kafka, it's important for the various development teams involved to agree on the topic name(s) and message formats, essentially agreeing on a "contract". This will ensure that the disparate systems can actually communicate with each other as expected.

When it comes to Kafka topic naming conventions, there are many different [opinions](https://cnr.sh/essays/how-paint-bike-shed-kafka-topic-naming-conventions) such as whether to include [version numbers](https://www.kadeck.com/blog/kafka-topic-naming-conventions-5-recommendations-with-examples) or not. It's beyond the scope of this post to cover all of these. If your organization has already established a naming convention, use that.

## Rails Product

The Rails application has a `products` table to store the product name, product code, price, and inventory count:

```ruby
# db/migrate/20230524104551_create_products.rb
class CreateProducts < ActiveRecord::Migration[7.0]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.decimal :price, null: false
      t.integer :inventory, null: false, default: 0

      t.timestamps
    end
  end
end
```

Here is the the corresponding `Product` model. I'm using the [annotate](https://github.com/ctran/annotate_models) gem to automatically generate schema information as comments in the model class when migrations are run:

```ruby
# app/models/product.rb
# == Schema Information
#
# Table name: products
#
#  id         :integer          not null, primary key
#  code       :string           not null
#  inventory  :integer          default(0), not null
#  name       :string           not null
#  price      :decimal(, )      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Product < ApplicationRecord
  validates :name, presence: true
  validates :code, presence: true
  validates :price, presence: true
  validates :inventory, presence: true, numericality: { greater_than_or_equal_to: 0 }

  def inspect
    "#<Product id: #{id}, name: #{name}, code: #{code}, price: #{formatted_price}, inventory: #{inventory}>"
  end

  def formatted_price
    format("%.2f", price)
  end
end
```

<aside class="markdown-aside">
Not critical to this demo, but since the prices are stored as a decimal column in the database, a format method is added to the model, and the inspect method is overridden to use it. This is so when products are displayed in the console for debugging purposes, it will show a price like 47.53 rather than 0.4753e2. Also note that for a real application, the precision and scale would be defined such as decimal(10, 2) but this simple demo is using the default SQLite database which doesn't support specifying these.
</aside>

In development, the `products` table is populated with seed data, using the faker gem:

```ruby
# db/seeds.rb
require "faker"

if Rails.env.development?
  Product.destroy_all

  20.times do
    name = Faker::Commerce.product_name
    code = "#{Faker::Alphanumeric.alpha(number: 4).upcase}#{Faker::Number.number(digits: 4)}"
    price = Faker::Commerce.price(range: 0..100.0)
    inventory = rand(0..50)
    Product.create!(
      name:,
      code:,
      price:,
      inventory:
    )
  end
  puts "Seeding completed!"
else
  puts "Seeding skipped. Not in development environment."
end
```

Here are some example products:

```
#<Product id: 41, name: Awesome Wool Gloves, code: JANW7810, price: 47.53, inventory: 10>,
#<Product id: 42, name: Durable Steel Plate, code: BMJG7868, price: 96.25, inventory: 3>,
#<Product id: 43, name: Ergonomic Paper Bag, code: FLMA2165, price: 52.46, inventory: 6>,
...
```

## Install Kafka

Even though we'll be focused on consuming messages in the Rails application, we're going to also need to produce messages to try it out. This means we'll need access to a Kafka cluster, which includes one or more brokers, and Zookeeper to manage the cluster. While you could point to a shared cluster if your organization manages their own or uses Confluent, I prefer to think of this similar to a database. In the same way that every developer working on a Rails application has their own local database installed, Kafka is also a kind of database (specifically, a raw, distributed database). It could get messy if all developers are pointing to a shared cluster, producing test messages that end up getting consumed by other developers running their own tests. It's also useful to have it installed locally for learning and experimentation, otherwise you would have to pay for hosting it somewhere or using a service like Confluent.

The easiest way to set up a Kafka cluster locally is with Docker and docker-compose. Confluent provides these images for free in their [cp-all-in-one](https://github.com/confluentinc/cp-all-in-one) repository. We actually only need to run two containers locally for a minimal cluster - one broker, and one zookeeper instance. Add the following `docker-compose.yml` file to the root of the project:

```yml
---
version: '2'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.2.1
    hostname: zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  broker:
    image: confluentinc/cp-server:7.2.1
    hostname: broker
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9101:9101"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://broker:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_METRIC_REPORTERS: io.confluent.metrics.reporter.ConfluentMetricsReporter
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_CONFLUENT_LICENSE_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_CONFLUENT_BALANCER_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_JMX_PORT: 9101
      KAFKA_JMX_HOSTNAME: localhost
      CONFLUENT_METRICS_REPORTER_BOOTSTRAP_SERVERS: broker:29092
      CONFLUENT_METRICS_REPORTER_TOPIC_REPLICAS: 1
      CONFLUENT_METRICS_ENABLE: 'true'
      CONFLUENT_SUPPORT_CUSTOMER_ID: 'anonymous'
```

To start the containers, run:

```
docker-compose up
```

Give it a few seconds to start, then check on the status in another terminal tab:

```
docker-compose ps
```

If all is well, the output should look something like this, showing that both zookeeper and a single broker are running, with the broker exposed on port 9092:

```
                 Name                              Command            State                       Ports
----------------------------------------------------------------------------------------------------------------------------
karafka_rails_consumer_demo_broker_1      /etc/confluent/docker/run   Up      0.0.0.0:9092->9092/tcp, 0.0.0.0:9101->9101/tcp
karafka_rails_consumer_demo_zookeeper_1   /etc/confluent/docker/run   Up      0.0.0.0:2181->2181/tcp, 2888/tcp, 3888/tcp
```

## Introduce Karafka

Now we need to enhance the Rails application so that it can consume messages from the `inventory_management_product_updates` Kafka topic. We're going to use the [Karafka](https://karafka.io/docs/) gem to make the integration relatively easy. Some of the benefits of this gem include:
* Abstracts complexities of working directly with the Kafka protocol. For example, you don't need to write your own `poll()` loop and manually manage offsets (although you can do the latter if your app needs more control).
* Leverages [multithreading](https://karafka.io/docs/Concurrency-and-multithreading/) to achieve concurrency and high performance.
* Integrates easily with Rails, following [routing](https://karafka.io/docs/Routing/) style conventions, and allowing you to make use of existing business logic in your Rails app such as models and services.
* Built in [error handling](https://karafka.io/docs/Dead-Letter-Queue/) and retry logic.
* Testing utilities that make it easy to write [automated tests](https://karafka.io/docs/Testing/) for consumers and producers.
* Provides both an open source and pro version if you need even more [advanced features](https://karafka.io/docs/Pro-Features-List/) (similar to the Sidekiq model).

To get started with Karafka, add the following to the project's `Gemfile` and then run `bundle install`:

```
gem "karafka", ">= 2.0.34"
```

Next run the karafka installation command which will setup some initial scaffolding:

```
bundle exec karafka install
```

This command will generate the main Karafka entrypoint file `karafka.rb` with some basic configuration, and an example topic and consumer:

```ruby
# karafka.rb
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = { "bootstrap.servers": "127.0.0.1:9092" }
    config.client_id = "example_app"
    config.consumer_persistence = !Rails.env.development?
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
    end
  end
end
```

Modify this file by replacing the `example` topic with the `inventory_management_product_updates` topic in the `routes.draw` block, and the example consumer with `ProductInventoryConsumer` (to be implemented shortly):

```ruby
class KarafkaApp < Karafka::App
  # config block...

  routes.draw do
    topic :inventory_management_product_updates do
      consumer ProductInventoryConsumer
    end
  end
end
```

<aside class="markdown-aside">
For this demo, there's no need to modify the default config block generated by Karafka. Recall the Kafka broker running in a docker container has exposed port 9092 so we'll be able to connect to it. In a real application, you would use an environment variable to specify the location of the bootstrap servers. There are also many more <a href="https://karafka.io/docs/Configuration/" class="markdown-link">configuration options</a> you can explore.
</aside>

Now let's implement the `ProductInventoryConsumer` class. This is a class that inherits from `ApplicationConsumer`, which was also generated from the karafka installation command and inherits from `Karafka::BaseConsumer`.

```ruby
# app/consumers/application_consumer.rb

# This file was automatically generated from the karafka installation command
# Application consumer from which all Karafka consumers should inherit
class ApplicationConsumer < Karafka::BaseConsumer
end
```

The only method that's required to be implemented in your consumer classes is the `consume` method, which will be invoked by Karafka with a batch of messages. For now, we will only log the message payload and offset to confirm messages are being received. The `consume` method also has access to the `topic` so let's log the topic name as well:

```ruby
# app/consumers/product_inventory_consumer.rb
class ProductInventoryConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      Rails.logger.info("ProductInventoryConsumer consuming: Topic: #{topic.name}, " \
      "Message: #{message.payload}, Offset: #{message.offset}")
    end
  end
end
```

To exercise this code, open a new terminal tab and run:

```
bundle exec karafka server
```

This command initializes the Karafka application defined at `karafka.rb`, connects to the Kafka cluster specified by the `bootstrap.servers` config, starts consuming messages from the topics specified in the `routes.draw` block, and invokes the configured consumer classes to process those messages. The server will continuously listen for new messages until the process is terminated. The output of this command should look something like this:

```
Running Karafka 2.1.0 server
See LICENSE and the LGPL-3.0 for licensing details
[00f6800d4770] Polling messages...
[00f6800d4770] Polled 0 messages in 47.48299999954179ms
[00f6800d4770] Polling messages...
[00f6800d4770] Polled 0 messages in 1000.3159999996424ms
...
```

In order to exercise the `ProductInventoryConsumer` code, messages need to be produced to the `inventory_management_product_updates` topic. In production, this will be done by the inventory management system. But for local development, we don't have that system running on our laptops. Fortunately, Karafka can also be used to [produce](https://karafka.io/docs/Components/#producer) messages. Let's try this out by launching a Rails console `bin/rails c` in another terminal tab and then:

```ruby
# Generate a message with the expected attributes in JSON format:
message = {
  product_code: Product.first.code,
  inventory_count: 10
}.to_json
# => "{\"product_code\":\"JANW7810\",\"inventory_count\":10}"

# Produce and send a message to the `inventory_management_product_updates` topic:
Karafka.producer.produce_async(topic: 'inventory_management_product_updates', payload: message)
# [ce1340a60c42] Async producing of a message to 'inventory_management_product_updates' topic took 21.07400000002235 ms
# [ce1340a60c42] {:topic=>"inventory_management_product_updates", :payload=>"{\"product_code\":\"JANW7810\",\"inventory_count\":10}"}
# => #<Rdkafka::Producer::DeliveryHandle:0x0000000114198588>
```

After you submit the producer command, keep an eye on the terminal tab running the Karafka server, you should see some output indicating the message has been consumed from topic `inventory_management_product_updates` and offset `0`:

```
[50b2762f16b2] Consume job for ProductInventoryConsumer on inventory_management_product_updates/0 started
ProductInventoryConsumer consuming: Topic: inventory_management_product_updates, Message: {"product_code"=>"JANW7810", "inventory_count"=>10}, Offset: 0
[50b2762f16b2] Consume job for ProductInventoryConsumer on inventory_management_product_updates/0 finished in 345.4149999995716ms
```

When there's a batch of messages ready to be processed, the `consume` method gets invoked with the `messages`, which can be iterated (in our simple case, there's only one message currently). Each of these is an instance of [Karafka::Messages::Message](https://karafka.io/docs/code/karafka/Karafka/Messages/Message.html). When the `payload` method is invoked on the `message` object, Karafka will deserialize it, which converts the raw Kafka message to a format you can work with in your Ruby code. By default, it uses JSON deserialization, which means it assumes the messages are in JSON format, and they will be deserialized into a Ruby hash. This is what's shown in the console output when we log `message.payload`. The Karafka docs have more details about [deserialization](https://karafka.io/docs/Deserialization/).

<aside class="markdown-aside">
For those keeping count, that's three terminal tabs required to work with this application during development mode: First one to run the Kafka cluster in docker containers, second one to run the Karafka server for consuming messages, and a third one to run a Rails console to produce messages. Later we'll need a fourth one for running tests. If you want to be able to view the output of these all at the same time, a simple way is to use the <a class="markdown-link" href="https://iterm2.com/documentation-one-page.html">Split Panes</a> feature of iTerm or <a class="markdown-link" href="https://github.com/tmux/tmux/wiki">tmux</a> for more advanced features.
</aside>

## Update Product

Now that we know we can produce and consume messages with Kafka, it's time to do the actual work of updating the product inventory. We saw from the previous exercise that a message like `"{\"product_code\":\"JANW7810\",\"inventory_count\":10}"` will get deserialized to a Ruby hash when the `payload` method is invoked on it. The resulting hash looks like this:

```ruby
{
  "product_code" => "JANW7810",
  "inventory_count" => 10
}
```

This means that we can access the product code and inventory count within the consumer as follows:

```ruby
# app/consumers/product_inventory_consumer.rb
class ProductInventoryConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      payload = message.payload

      puts "Product code = #{payload['product_code']}"
      # Product code = JANW7810
      puts "Inventory count = #{payload['inventory_count']}"
      # Inventory count = 10
    end
  end
```

So updating the product inventory count could be done directly in the consumer like this:

```ruby
class ProductInventoryConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      payload = message.payload
      product = Product.find_by(code: payload["product_code"])
      product.update!(inventory: payload["inventory_count"])
    end
  end
end
```

There are some problems with this approach as we'll see shortly, but first, let's exercise this version of the consumer just to see if it works. Back in the Rails console, run this code to check the inventory value of the first product, then produce a message to update it to a different value:

```ruby
# Check what the current inventory value is
Product.first.inventory
# 20

# Produce a message to update it to a different value
message = {
  product_code: Product.first.code,
  inventory_count: 123
}.to_json
Karafka.producer.produce_async(topic: 'inventory_management_product_updates', payload: message)
```

Now keep an eye on the tab that's running the karafka server (that's our consumer polling for messages), it should receive this message and show that the product inventory has been updated:

```
[d886a13043fd] Consume job for ProductInventoryConsumer on inventory_management_product_updates/0 started
  Product Load (0.9ms)  SELECT "products".* FROM "products" WHERE "products"."code" = ? LIMIT ?  [["code", "JANW7810"], ["LIMIT", 1]]
  ↳ app/consumers/product_inventory_consumer.rb:5:in `block in consume'
  TRANSACTION (0.2ms)  begin transaction
  ↳ app/consumers/product_inventory_consumer.rb:6:in `block in consume'
  Product Update (0.4ms)  UPDATE "products" SET "inventory" = ?, "updated_at" = ? WHERE "products"."id" = ?  [["inventory", 123], ["updated_at", "2023-06-02 11:10:00.738034"], ["id", 41]]
  ↳ app/consumers/product_inventory_consumer.rb:6:in `block in consume'
  TRANSACTION (2.1ms)  commit transaction
  ↳ app/consumers/product_inventory_consumer.rb:6:in `block in consume'
[d886a13043fd] Consume job for ProductInventoryConsumer on inventory_management_product_updates/0 finished in 23.927999999839813ms
```

Back in the Rails console, let's fetch the product again and check its inventory count, it should be `123` from the Kafka message we produced earlier:

```ruby
Product.first.inventory
# 123
```

Great it's working! But we're not quite ready to ship...

## What Could Go Wrong?

In the previous section, we saw the happy path working. Now its time to think of things that could go wrong. What happens if the inventory system sends a product code that the Rails e-commerce system doesn't have in its records? Let's try this out. Back in the Rails console, produce a message for a product code that's not in the `products` table:

```ruby
message = {
  product_code: "NO-SUCH-CODE",
  inventory_count: 123
}.to_json
Karafka.producer.produce_async(topic: 'inventory_management_product_updates', payload: message)
```

Keep an eye on the terminal tab running the Karafka server, it will show a stack trace from attempting to consume this message:

```
[d886a13043fd] Consume job for ProductInventoryConsumer on inventory_management_product_updates/0 started
  Product Load (0.5ms)  SELECT "products".* FROM "products" WHERE "products"."code" = ? LIMIT ?  [["code", "NO-SUCH-CODE"], ["LIMIT", 1]]
  ↳ app/consumers/product_inventory_consumer.rb:5:in `block in consume'
Consumer consuming error: undefined method `update!' for nil:NilClass

      product.update!(inventory: payload["inventory_count"])
             ^^^^^^^^
/Users/dbaron/projects/meblog-projects/rails7/karafka_rails_consumer_demo/app/consumers/product_inventory_consumer.rb:6:in `block in consume'
/Users/dbaron/.rbenv/versions/3.1.2/lib/ruby/gems/3.1.0/gems/karafka-2.1.0/lib/karafka/messages/messages.rb:22:in `each'
/Users/dbaron/.rbenv/versions/3.1.2/lib/ruby/gems/3.1.0/gems/karafka-2.1.0/lib/karafka/messages/messages.rb:22:in `each'
/Users/dbaron/projects/meblog-projects/rails7/karafka_rails_consumer_demo/app/consumers/product_inventory_consumer.rb:3:in `consume'
```

What's happening is that `nil` is returned from the `find_by` method, then it errors out attempting to call the `update!` method on the `nil` return:

```ruby
# This line returns `nil` when called with `code: "NO-SUCH-CODE"`
product = Product.find_by(code: payload["product_code"])

# Which results in undefined method `update!` for nil:NilClass here
product.update!(inventory: payload["inventory_count"])
```

If you let the Karafka server keep running, you'll see the stack trace repeat several times, at increasing intervals of time. This is because Karafka's default behaviour is to keep retrying the failed message if an error is raised, according to a back-off strategy.

TODO: Explanation from https://karafka.io/docs/Error-handling-and-back-off-policy/

WIP: While we could use the DLQ and just let Karafka deal with this, it will be cleaner to tidy up the business logic and ensure the system produces useful error messages. Otherwise some poor soul in production support is going to be dealing with a bunch of failed messages and have no idea what's gone wrong.

## TODO
* WIP: What could go wrong? Try sending an invalid product code, Try sending negative inventory count
* Start handling all this in consumer - gets messy
* Explain analogy: Kafka consumers can be thought of like Rails controllers - their primary responsibility is to consume messages from Kafka, and optionally produce messages (eg: may want to produce a message to another topic to indicate message processing was successful). Rails controller is primarily responsible for dealing with HTTP request/response.
* Just like it's not desirable to place business logic in a Rails controller (mixing concerns), it's also not desirable to place business logic in a Kafka consumer.
* Introduce idea of service object and ActiveModel for validations...
* This is a relatively simple example, imagine there could be more business rules, eg: product could have an active flag, and only should update inventory if product is still active.
* Link to Karafka gem
* Link to faker gem
* Link to confluent, briefly explain "Kafka as a service"
* Aside/assumption basic knowledge of Rails and Kafka
* Inventory info is updated based on business events -> makes it a good fit to integrate with Kafka, which is designed for event-driven systems.
* Sometimes get large bursts of inventory events, useful to have these persisted in a Kafka topic, and the Rails app, via a Kafka consumer will process these when it can -> i.e. don't have to worry about lost messages like you would the a service oriented REST solution.
* Simple diagram showing legacy inventory system, produces inventory messages to Kafka topic, consumed by the Rails e-commerce app. Maybe https://mermaid.js.org/syntax/c4c.html and https://plantuml.com/component-diagram ?
* Link to demo app on Github
* Maybe mention schema validation as an aside?
* Mention just barely scratched the surface of what can be done with kafka and karafka, link to docs for more advanced use cases.
* Aside you can also run a multi-broker cluster to experiment with partitions and replicas distributed across brokers, point to multiple setup from my course repo (but for this demo, a simple setup will suffice).
* Better feature image
