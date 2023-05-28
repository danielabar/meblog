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

These messages will be produced to a Kafka topic named `product_inventory`. When integrating Kafka, it's important for the various development teams involved to agree on the topic name(s) and message formats, essentially agreeing on a "contract". This will ensure that the disparate systems can actually communicate with each other as expected.

<aside class="markdown-aside">
When it comes to Kafka topic naming conventions, there are many different <a class="markdown-link" href="https://cnr.sh/essays/how-paint-bike-shed-kafka-topic-naming-conventions">opinions</a> such as whether to include <a class="markdown-link" href="https://www.kadeck.com/blog/kafka-topic-naming-conventions-5-recommendations-with-examples">version numbers</a> or not. It's beyond the scope of this post to cover this so we'll keep it simple for this demonstration.
</aside>

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

Here is the the corresponding `Product` model:

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
Since the prices are stored as a decimal column in the database, a format method is added to the model, and the inspect method is overridden to use it. This is so when products are displayed in the console for debugging purposes, it will show a price like 47.53 rather than 0.4753e2.
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

Now we need to enhance the Rails application so that it can consume messages from the `product_inventory` Kafka topic. We're going to use the [Karafka](https://karafka.io/docs/) gem to make the integration relatively easy. Some of the benefits of this gem include:
* Abstracts complexities of working directly with the Kafka protocol. For example, you don't need to write your own `poll()` loop and manually manage offsets (although you can do the latter if your app needs more control).
* Leverages [multithreading](https://karafka.io/docs/Concurrency-and-multithreading/) to achieve concurrency and high performance.
* Integrates easily with Rails following [routing](https://karafka.io/docs/Routing/) style conventions, allowing you to make use of existing business logic in your Rails app such as models and services.
* Built in [error handling](https://karafka.io/docs/Dead-Letter-Queue/) and retry logic.
* Testing utilities that make it easy to write [automated tests](https://karafka.io/docs/Testing/) for consumers and producers.
* Provides both an open source and pro version if you need even more [advanced features](https://karafka.io/docs/Pro-Features-List/) (similar to Sidekiq model).

To get started with Karafka, add the following to the `Gemfile`:

```
gem "karafka", ">= 2.0.34"
```

And then run `bundle install`. Next run the karafka installation command which will setup some initial scaffolding:

```
bundle exec karafka install
```

This will generate the main Karafka entrypoint file `karafka.rb` with an example of a topic and consumer.

WIP...

## TODO
* NEXT UP Show basic config and routing for a single consumer/topic
* Write simple consumer that just logs its payload (explain default serialize/deserialize message format in Karafka is JSON)
* Launch Karafka server, explain that behind the scenes, Karafka kicks off all the consumers to run `poll()` loop
* Launch a Rails console and produce a sample message, verify in Karafka server console that the message is displayed.
* Start with business logic in consumer: Simply take inventory_count and product_code from message, and update the product model
* Try it out with a good/happy path case
* What could go wrong? Try sending an invalid product code, Try sending negative inventory count
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
* Simple diagram showing legacy inventory system, produces inventory messages to Kafka topic, consumed by the Rails e-commerce app.
* Link to demo app on Github
* Maybe mention schema validation as an aside?
