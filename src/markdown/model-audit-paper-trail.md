---
title: "Efficient Model Auditing with PaperTrail"
featuredImage: "../images/paper-trail-maksim-shutov-H8vhhepiiaU-unsplash.jpg"
description: "tbd"
date: "2024-01-01"
category: "rails"
related:
  - "Understanding ActiveRecord Dependent Options"
  - "Rails Enums with MySQL or Postgres"
  - "Rails Strong Params for GET Request"
---

Model auditing plays a important role in tracking changes within a Rails application. While several gems are available to implement this functionality, today we'll delve into the benefits of using [PaperTrail](https://github.com/paper-trail-gem/paper_trail). By default, PaperTrail consolidates all model audit records into a single `versions` table, which could lead to performance and scaling challenges when dealing with numerous audited models. Fortunately, there's a better approach. This post will walk through the steps to configure PaperTrail to create separate `_versions` tables for each model, such as `product_versions`, `order_versions`, `customer_versions`, etc. This optimization can improve performance and organization in your application's auditing process.

## TODO
* explain initial project setup - keep it simple with a single `Product` model for demonstration purposes, add devise so we can have logged in authenticated users to populate `whodunnit`.
* install papertrail gem and run the generator as per instructions - show the two migrations it generates
* one step at a time explain what needs to change to create separate audit tables per model
* maybe: Additionally, we'll discuss why using JSON columns to store the object and object_changes is a superior choice compared to YAML or text.
* Link to demo repo: https://github.com/danielabar/audit_demo
* Add meta description
