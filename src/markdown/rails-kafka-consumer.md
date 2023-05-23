---
title: "Add a Kafka Consumer to Rails"
featuredImage: "../images/tbd.jpg"
description: "Learn how to integrate a Kafka consumer into a Rails application"
date: "2023-10-01"
category: "rails"
related:
  - "Rails CORS Middleware For Multiple Resources"
  - "Fix Rails Blocked Host Error with Docker"
  - "Add Rubocop to an Existing Rails Project"
---

This post will walk through how to integrate a Kafka consumer into a Rails application in a maintainable and testable way. Why would you need to do this? Consider the following scenario: You're working on an e-commerce system that has been developed with Rails. You'd like to enhance the product details page to show whether the current product is in stock, out of stock, or only has small number of items left (eg: "Only 3 left in stock!"). The inventory information comes from a legacy inventory management system that has been written in a different programming language. This system is responsible for updating the inventory count based on events, such as product purchases, returns, or stock replenishments.

In order to display this inventory information in the Rails e-commerce app, it needs the ability to communicate with the legacy inventory system. There are many [solutions](https://en.wikipedia.org/wiki/Enterprise_Integration_Patterns) for enabling different systems to communicate, each with tradeoffs to consider. For this post, I will show you how Kafka can be used to solve this problem. Apache Kafka is a distributed streaming platform that enables high-throughput, fault-tolerant, and real-time event data streaming for building scalable and event-driven applications.

## TODO
* Aside/assumption basic knowledge of Rails and Kafka
* Inventory info is updated based on business events -> makes it a good fit to integrate with Kafka, which is designed for event-driven systems.
* Sometimes get large bursts of inventory events, useful to have these persisted in a Kafka topic, and the Rails app, via a Kafka consumer will process these when it can -> i.e. don't have to worry about lost messages like you would the a service oriented REST solution.
* Featured image prompt wip: A vibrant and interconnected network of train tracks merging seamlessly with a stream of messages represented as large colorful soap bubbles
* Maybe architecture diagram showing legacy inventory system, produces inventory messages to Kafka topic, consumed by the Rails e-commerce app.
* Scaffold a demo Rails app with product model and integrate Karafka, add a consumer, model/validations, service, topic name `product_inventory_updates"`
* Link to demo app on Github
* Explain Rails product model
* Introduce Karafka gem, explain benefits over direct Ruby bindings to Kafka
* Show basic config and routing for a single consumer/topic
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
