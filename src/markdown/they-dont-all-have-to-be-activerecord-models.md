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

There's also plenty of online tutorials and courses that will cover creating a Rails application from start to finish for other domains besides a blogging application so you can get a sense of how it can be used to represent just about any domain where you want to expose CRUD operations on a relational data model.

However, all of the learning materials that I have seen make an assumption that there is always a one to one relationship between each form field that will be displayed in the web view, and the underlying database table that will be persisted. But what often happens in a real application is that the interface presented in the web view does not exactly match the database table.

For example, consider an application that should have a new user registration form like this:

TBD visual

Notice the two fields for "Password" and "Confirm Password"...

## TODO
* link CRUD to good definition, wikipedia if exists
* link to few other courses I've taken with example other domains
* create some visual showing UI of Article with title and body, Model with the same fields, and database table with same fields
* create similar visual for User model showing how password and confirm_password fields in UI do not match password_digest field in database table `users`
* build companion project `not_all_activerecord` and push to Github
* consider starting from Rails generated scaffold, them modifying it to introduce UserForm model that includes ActiveModel::Model
* explain code snippets from `projects/meblog-projects/active-model-eg/notes.md` from user migration, user model, introducing UserForm model, controller, and erb
