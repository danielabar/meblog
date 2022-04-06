---
title: "Rails Enums with MySQL or Postgres"
featuredImage: "../images/enum-jake-hills-0hgiQQEi4ic-unsplash.jpg"
description: "Learn how to add enums to a Rails model backed by either MySQL or Postgres."
date: "2022-05-02"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

This post will walk you through the steps to add an enum to a Rails model, backed by either a MySQL or Postgres database. If you're not familiar with enums, an example will be more illuminating than the official definition:

Suppose you're building a recurring subscription service. This will need a `Plan` model that each subscription is associated with.