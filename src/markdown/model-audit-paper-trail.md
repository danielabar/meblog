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

Model auditing plays a important role in tracking changes within a Rails application. While several gems are available to implement this functionality, today we'll delve into the benefits of using [PaperTrail](https://github.com/paper-trail-gem/paper_trail). By default, PaperTrail consolidates all model audit records into a single `versions` table, which could lead to performance and scaling challenges when dealing with numerous audited models. Fortunately, there's a better approach. This post will walk through the steps to configure PaperTrail to create separate `{model}_versions` tables for each model, such as `product_versions`, `order_versions`, `customer_versions`, etc. This optimization can improve performance and organization in your application's auditing process.

## Project Setup

We'll start with a simple project that just has a single `Products` model to demonstrate how to audit any changes to products, but the process will apply to any number of models in a real application. This project uses a Postgres database, which supports the json column type and is useful for representing model changes. We'll also add the [devise](https://github.com/heartcombo/devise) gem so we can have different users log in and make changes to products. I'm using Ruby 3.2 and Rails 7.0.6 but you can check the [PaperTrail Compatibility](https://github.com/paper-trail-gem/paper_trail#1a-compatibility) for older versions support.

```bash
# Create a new Rails project using a Postgres database
rails new audit_demo -d postgresql
cd audit_demo

# Initialize an empty database
bin/rails db:create

# Generate product model, database migration, controller, views, and routes,
bin/rails g scaffold Product name:string code:string price:decimal inventory:integer description:text

# Create the `products` table
bin/rails db:migrate
```

Add [devise](https://github.com/heartcombo/devise) to the Gemfile so we can have user logins, to later demonstrate how PaperTrail can keep track of *who* made a change. While you're here, also add the [faker](https://github.com/faker-ruby/faker) gem to the development and test sections, we'll use this later to generate sample data:

```ruby
# Gemfile

# User authentication
gem "devise"

group :development, :test do
  # Generate realistic looking data
  gem "faker"
end
```

Run `bundle install` to add these new gems to the project.

Run the Devise generators:

```bash
# Installs config/initializer for devise
bin/rails generate devise:install

# Generate user model, migration, modules, and routes
# for user registration and session management.
bin/rails generate devise User

# Migrate database so we now have a `users` table
bin/rails db:migrate
```

Update the routes file to set the products listing view as the root route:

```ruby
Rails.application.routes.draw do
  # CRUD for products (generated from earlier scaffold command).
  resources :products

  # Added by devise generator to expose login and registration routes.
  devise_for :users

  # Set the default route: Devise needs to know where to redirect
  # users after successful login.
  root "products#index"
end
```

Now let's seed the database with a few example users and products. I'm using the [faker](https://github.com/faker-ruby/faker) gem to quickly generate some realistic looking product data. To keep the `db/seeds.rb` file clean, I've split up the user and product seeds into separate files. For a small project like this, they could go all in the same file, but it quickly gets messy as the project grows, so I like to get in the habit of splitting up the seeds files right from the start:

```ruby
# db/seeds.rb
if Rails.env.development?
  load Rails.root.join("db/seeds/users.rb")
  load Rails.root.join("db/seeds/products.rb")
  Rails.logger.info("Seeding completed!")
else
  Rails.logger.info("Seeding skipped. Not in development environment.")
end
```

```ruby
# db/seeds/users.rb
User.create!(email: "test1@example.com", password: "Password1")
User.create!(email: "test2@example.com", password: "Password1")
```

```ruby
# db/seeds/products.rb
20.times do
  Product.create!(
    name: Faker::Commerce.product_name,
    code: "#{Faker::Alphanumeric.alpha(number: 4).upcase}#{Faker::Number.number(digits: 4)}",
    price: Faker::Commerce.price(range: 0..100.0),
    inventory: rand(0..50),
    description: Faker::Lorem.sentence(word_count: 3, random_words_to_add: 4)
  )
end
```

Finally let's load the seeds into the database, I'm using the `replant` task which first truncates all the model tables. This makes it fast to re-run any time you want to reseed the database:

```bash
bin/rails db:seed:replant
```

At this point, you should be able to start a Rails server with `bin/rails s`, navigate to [http://localhost:3000](http://localhost:3000), get redirected to [http://localhost:3000/users/sign_in](http://localhost:3000/users/sign_in), login as one of the example users from the seeds such as `test1@example.com/Password1`. You'll then be redirected to the product listing view which shows all products. You can click "Show product" on any product, then click "Edit" and make any changes.

## Add PaperTrail

Now that we have a functioning project with authenticated users that can edit products, it's time to add model auditing. To start, add PaperTrail to the Gemfile, then run `bundle install` to install it:

```ruby
# Gemfile

# Model auditing
gem "paper_trail"
```

Next run the PaperTrail generator to generate the database migrations to add an audit table. I'm using the `--with-changes` column to ensure the model diffs will be persisted:

```bash
bundle exec rails generate paper_trail:install --with-changes
```

This generates two migration files as shown below - do NOT run these yet, we're going to be making a number of changes:

```ruby
# db/migrate/20230806120211_create_versions.rb
class CreateVersions < ActiveRecord::Migration[7.0]
  TEXT_BYTES = 1_073_741_823

  def change
    create_table :versions do |t|
      t.string   :item_type, null: false
      t.bigint   :item_id,   null: false
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions, %i[item_type item_id]
  end
end
```

```ruby
# db/migrate/20230806120212_add_object_changes_to_versions.rb
class AddObjectChangesToVersions < ActiveRecord::Migration[7.0]
  TEXT_BYTES = 1_073_741_823

  def change
    add_column :versions, :object_changes, :text, limit: TEXT_BYTES
  end
end
```

The PaperTrail instructions then say to update any model classes that require auditing with the `has_paper_trail` macro. This will populate the `versions` table with a change record any time a model is updated (also persists model creation and deletion). For example, the `Product` model would get updated as follows:

```ruby
class Product < ApplicationRecord
  # Don't add this - we'll do it differently soon
  has_paper_trail
end

class SomeOtherWidget < ApplicationRecord
  has_paper_trail
end

# etc. for all model classes that need to be audited
```

The above migrations and code change show that the default PaperTrail behavior is to generate a single `versions` table that will store *all* model audit records. Now let's go through the changes required to have a `product_versions` table specifically for persisting changes to the `Product` model.

## Migration Changes

Make the following changes to the migration file:

* Change the file name from `db/migrate/{timestamp}_create_versions.rb` to `db/migrate{timestamp}_create_product_versions.rb`.
* Modify the migration class name from `CreateVersions` to `CreateProductVersions`.
* Modify the table and index names from `versions` to `product_versions`.
* Add the `object_changes` column from the `..._add_object_changes_to_versions.rb` migration to `..._create_product_versions.rb` and delete the second generated migration (there's no need to maintain a second migration file just to add the column).
* Change the `object` and `object_changes` columns to be of type `json` (or `jsonb` if using Postgres) rather than `text`.
* Remove the `TEXT_BYTES` constant as we're using json rather than text columns.

Here is the resulting migration file after making the above changes:

```ruby
# db/migrate/20230806120211_create_product_versions.rb
class CreateProductVersions < ActiveRecord::Migration[7.0]
  def change
    create_table :product_versions do |t|
      t.string   :item_type, null: false
      t.bigint   :item_id,   null: false
      t.string   :event,     null: false
      t.string   :whodunnit
      t.json     :object
      t.json     :object_changes
      t.datetime :created_at
    end

    add_index :product_versions, %i[item_type item_id]
  end
end
```

## Model Changes

By default, PaperTrail assumes all model changes are being persisted in a single `versions` table. We've updated the migration to create a product-specific versions table, but there are some code changes to be made as well to configure PaperTrail so it knows about this change.

The first change is to specify the `versions` option on the `has_paper_trail` macro for the `Product` model, to indicate the class that represents the product versions (this class doesn't exist yet, we'll get to that next):

```ruby
# app/models/product.rb
class Product < ApplicationRecord
  has_paper_trail versions: {
    class_name: "ProductVersion"
  }
end
```

Now add a new model class `ProductVersion` that inherits from `PaperTrail::Version` and specify the table name from the modified migration:

```ruby
# app/models/product_version.rb
class ProductVersion < PaperTrail::Version
  self.table_name = :product_versions
end
```

Finally, since all the audited models will be persisted in custom versions tables and the default `versions` table will not exist in this app, we need to tell PaperTrail that the base `ApplicationVersion` class is abstract. Add it as follows:

```ruby
# app/models/application_version.rb
class ApplicationVersion < ActiveRecord
  include PaperTrail::VersionConcern
  self.abstract_class = true
end
```

TODO: Change to populate whodunnit...

## TODO
* one step at a time explain what needs to change to create separate audit tables per model
* demo user login edit a model, show Rails server output populating `product_versions` table with `update` event, also show what it looks like in Rails console.
* maybe: Additionally, we'll discuss why using JSON columns to store the object and object_changes is a superior choice compared to YAML or text.
* Link to demo repo: https://github.com/danielabar/audit_demo
* Add meta description
* Aside: My project has some changes from the default postgres setup in that postgres is running on Docker, not critical to this demo but if you also want to run Postgres in Docker instead of directly on your laptop, see this post (todo link)
* Aside: There's a lot more complexity to configuring Devise but out of scope for this post, link to docs/wiki/etc for more details
* Aside: For more in depth on rails routing syntax, link to excellent post: https://www.akshaykhot.com/understanding-rails-router-why-what-how/
* Aside: json vs jsonb out of scope for this post, link to a ref like Postgres docs explaining differences
* Aside: Not adding product validations as this post is focused on auditing, a real app would have validation rules (and associated db constraints)
* What is/explain `PaperTrail::Version`
* By default, PaperTrail stores `object` and `object_changes` as YAML format in text database columns (longtext for MySQL). You can specify an alternate serializer such as JSON. Even more convenient, when using Postgres and specifying either `json` or `jsonb` as column types in migration, PaperTrail will automatically use the JSON serializer, therefore no need to explicitly configure it.
* Related to above: maybe mention benefits of json vs text in that it opens up some of the PaperTrail query APIs in finding a specific change?
