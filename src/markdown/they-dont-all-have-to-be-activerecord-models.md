---
title: "They Don't All Have To Be ActiveRecord Models"
featuredImage: "../images/not-ar-model-vandan-patel-C63NHsUUR1A-unsplash.jpg"
description: "tbd"
date: "2023-07-01"
category: "rails"
related:
  - "tbd"
  - "tbd"
  - "tbd"
---

Rails makes it easy (relative to other web frameworks) to go from an idea to a working web application. If you follow along with the [Getting Started with Rails](https://guides.rubyonrails.org/getting_started.html) guide, you can see how straightforward it is to go from an idea of a blog application with articles that have that have a title and body text, to creating a database table that stores articles, a model to represent the articles and validation rules, views that render HTML to initiate CRUD operations on articles, and a controller to handle http request/responses, and delegate to the model to perform the CRUD operations.

There's also plenty of online tutorials and courses that will cover creating a Rails application from start to finish for other domains besides a blogging application. Going through any of these will quickly give you a sense of how Rails can be used to represent just about any domain where you want to build a web app to expose CRUD operations on a relational data model.

However, all of the learning materials that I have seen make an assumption that there is always a one to one relationship between each form field that will be displayed in the web view, and the underlying database table that will be persisted. For example...

TODO: Maybe visual from one of my Pluralsight courses? eg: Company/Stock Prices https://github.com/danielabar/user-resource-rails-pluralsight#identifying-entities

But what I've found in the "real world", is that the interface presented in the web view does not exactly match the database table, due to complex business requirements. Then it's not obvious how to make use of all the Rails niceties around form binding to the model, validations and saving. This post will show a technique that can be used anytime you encounter a mismatch between a form presented to a user, and what needs to be persisted in the database.

Consider an example of a back office for some app where admins need to fill out a form to create new customers. The table will persist email, first and last names, but the UI also has a field for the customers age. It's used for validation where customer must be greater than a certain age, but it will not be persisted to table, therefore its not part of customer model. A more complex case might be that the form asks for SIN/SSN to validate against an external service, but this value is not required to be persisted.

Example of new customer form in back office application:

![new customer form](../images/not-all-ar-new-customer.png "new customer form")

Example of customers table schema from database. Notice the "age" field is not part of the table definition:

```sql
CREATE TABLE IF NOT EXISTS "customers"(
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "email" varchar NOT NULL,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "created_at" datetime(6) NOT NULL,
  "updated_at" datetime(6) NOT NULL
);
CREATE UNIQUE INDEX "index_customers_on_email" ON "customers"("email");
```

## TODO
* link CRUD to good definition, wikipedia if exists
* link to few other courses I've taken with example other domains
* create some visual showing UI of Article with title and body, Model with the same fields, and database table with same fields
* WIP create similar visual for Customer model showing `age` field in UI does not exist in database but need to perform validations on it.
* WIP build companion project `not_all_activerecord` and push to Github
* WIP Start from Rails generated scaffold (`bin/rails generate scaffold customer email:string first_name:string last_name:string`), them modifying it to introduce CustomerForm model that includes ActiveModel::Model
* Explain CustomerForm model, controller changes, erb changes for new scenario (leaving edit alone)
* show that the PORO model can be tested, even with shoulda matchers
* mention Rails version and link to companion project on Github when ready
* Intro para more concise
* Conclusion para
* Organize into sub-sections
