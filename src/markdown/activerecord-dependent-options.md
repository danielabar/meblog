---
title: "Understanding ActiveRecord Dependent Options"
featuredImage: "../images/activerecord-dep-gary-chan-YzSZN3qvHeo-unsplash.jpg"
description: "A closer look at all the ways to remove ActiveRecord models from the database."
date: "2023-07-01"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

Rails makes defining relationships between models using Active Record associations super easy. Simply add a macro style declaration such as `has_one`, `has_many`, `belongs_to` etc. to your model and Rails will take care of maintaining the relationship. However, some thought is required when it comes to *removing* data from the database, while maintaining data integrity such as foreign key constraints. All the Rails courses and tutorials I've done so far cover adding associations, but none have covered what happens when a record with associations needs to be removed.

Many years ago, before the likes of GDPR and privacy concerns, the "solution" was to never remove any data or use [soft delete](https://stackoverflow.com/questions/378331/physical-vs-logical-hard-vs-soft-delete-of-database-record). But with increased privacy regulations and the [right to be forgotten](https://en.wikipedia.org/wiki/Right_to_be_forgotten), applications need the ability to safely remove certain data.

The Rails Guide on [Active Record Associations](https://guides.rubyonrails.org/association_basics.html) does cover deletion options. However, since there are so many options besides just for deletion, I found myself scrolling up and down through the docs and losing track of which side of the association was being referred to. Also, since different options can be specified on each side of an association, it can be tricky to reason about what would happen with various *combinations* of options.

A further complexity is that there are two different ways to remove an ActiveRecord model in rails: Delete and Destroy. They sound similar but do different things (more on this later). If you add that into the mix of removal options, the number of scenarios grows even further.

In the vein of "a picture is worth a thousand words", I decided to build a sample Rails application and do a deep dive on all the removal options for some commonly used associations and how they behave when deleting or destroying a record. This post will walk through the results of this.

For those in a hurry, you can skip ahead to the [Which Should You Use?](../activerecord-dependent-options/#which-should-you-use) section.

## Project Setup

I started by scaffolding a new Rails project with Ruby 3 and Rails 7, using the default SQLite database:

```
rbenv install 3.1.2
rbenv local 3.1.2
gem install rails -v 7.0.4
rails new learn-associations
```

I added the [annotate](https://github.com/ctran/annotate_models) gem to add the corresponding table schema as code comments above each model class when migrations are run:

```ruby
# Gemfile
group :development do
  gem "annotate"
end
```

I then generated several models to study the `belongs_to` and `has_many` associations. This is a very common use case. For example, in an e-commerce application a Customer has many Orders, and an Order belongs to a single Customer. Or a Product has many Sku variations, and a Sku belongs to a Product. For this sample application, I used the Book and Author models from the [Active Record Associations Guide](https://guides.rubyonrails.org/association_basics.html#the-belongs-to-association):

![association book belongs to author](../images/association-book-belongs-to-author.png "association book belongs to author")

![association author has many books](../images/association-author-has-many-books.png "association author has many books")

I also added a `title` attribute to the `Book` model to make it easier to look up individual books for removal.

<aside class="markdown-aside">
There are many more <a href="https://guides.rubyonrails.org/association_basics.html#the-types-of-associations" class="markdown-link">association types</a> but this post will focus on the <code>belongs_to</code> and <code>has_many</code> as attempting to do more would make it too long. Perhaps a topic for a future blog post.
</aside>

Here are the commands to generate the models, which also generate the migrations to create the tables. I also generated a `Post` model that is not associated with anything, to demonstrate the difference between `destroy` and `delete` in a simple case where there are no associated models.

```bash
# simple model with no associations to demonstrate difference between destroy and delete
bin/rails generate model post title:string body:text

# models with associations
bin/rails generate model author name:string
bin/rails generate model book title:string published_at:date author:references
```

<aside class="markdown-aside">
Passing <code>-h</code> or <code>--help</code> to any generator command, eg: <code>bin/rails generate model -h</code> provides a complete guide to that generator. For example, if you want to know what are all the valid data types for model attributes.
</aside>

Here are the migrations that are generated. Notice that the Book model has a foreign key reference to an Author since each Book belongs to one Author. The Post model is not related to anything:

```ruby
class CreatePosts < ActiveRecord::Migration[7.0]
  def change
    create_table :posts do |t|
      t.string :title
      t.text :body

      t.timestamps
    end
  end
end
```

```ruby
class CreateAuthors < ActiveRecord::Migration[7.0]
  def change
    create_table :authors do |t|
      t.string :name

      t.timestamps
    end
  end
end
```

```ruby
class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title
      t.date :published_at
      t.references :author, null: false, foreign_key: true

      t.timestamps
    end
  end
end
```

After running the migrations, here are the model classes showing that an Author has many Books and a Book belongs to an Author. The Post model has no associations. The schema information was added by the [annotate](https://github.com/ctran/annotate_models) gem:

```ruby
# == Schema Information
#
# Table name: posts
#
#  id         :integer          not null, primary key
#  body       :text
#  title      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Post < ApplicationRecord
end
```

```ruby
# == Schema Information
#
# Table name: authors
#
#  id         :integer          not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Author < ApplicationRecord
  has_many :books
end
```

```ruby
# == Schema Information
#
# Table name: books
#
#  id           :integer          not null, primary key
#  published_at :date
#  title        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  author_id    :integer          not null
#
# Indexes
#
#  index_books_on_author_id  (author_id)
#
# Foreign Keys
#
#  author_id  (author_id => authors.id)
#
class Book < ApplicationRecord
  belongs_to :author
end
```

Let's seed some example Posts, Authors, and Books so that we can test what happens when trying to remove them:

```ruby
# db/seeds.rb

# Post is a simple model with no associations to demonstrate the difference between
# ActiveRecord methods destroy and delete
Post.create!(title: "Hello Post", body: "Learning about destroy and delete in Rails.")
Post.create!(title: "Another Post", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")

# Author with multiple books
author_ap = Author.create!(name: "Andrew Park")

# Author with a single book
author_jjk = Author.create!(name: "Julian James McKinnon")

# Author with no books
Author.create!(name: "John Doe")

# Create 3 books for Andrew Park and just one book for Julian James McKinnon
Book.create!(
  [
    { title: "Python Programming for Beginners", published_at: "2022-07-20", author: author_ap },
    { title: "Machine Learning: 4 Books in 1", published_at: "2020-01-20", author: author_ap },
    { title: "Python for Data Analysis", published_at: "2021-01-20", author: author_ap },
    { title: "Computer Programming Crash Course: 7 Books in 1", published_at: "2021-01-20", author: author_jjk }
  ]
)
```

Run the seeds in both the development and test databases. We'll be using the development database to experiment a little, and later the test database to automate all the experiments:

```
bin/rails db:seed
RAILS_ENV=test bin/rails db:seed
```

If you want to follow along with the project, here is the [source](https://github.com/danielabar/learn-associations) on Github.

## Delete Destroy

I wanted to understand what would happen when attempting to remove various Author or Book records from the database with respect to their associations. However, there's an additional complexity in that there's two different methods to remove a record, which sound similar, but do slightly different things. From the [Rails API Documentation](https://api.rubyonrails.org/):

* [delete](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-delete): Deletes the record in the database and freezes this instance to reflect that no changes should be made (since they can't be persisted). Returns the frozen instance. The row is simply removed with an SQL `DELETE` statement on the record's primary key, and no callbacks are executed.
* [destroy](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-destroy): Deletes the record in the database and freezes this instance to reflect that no changes should be made (since they can't be persisted). There's a series of callbacks associated with destroy. If the `before_destroy` callback throws `:abort` the action is cancelled and destroy returns `false`.
* [destroy!](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-destroy-21): Similar to `destroy`, except raises `ActiveRecord::RecordNotDestroyed` rather than returning false if the record is not destroyed.

To summarize the difference, `delete` immediately invokes SQL to remove the record from the database, whereas `destroy/destroy!` first invokes the model's `before_destroy` callback which can potentially stop the deletion. I'm assuming this could be a place for cleanup code.

To understand this with a simple case, let's modify the `Post` model, which has no associations, to add a `before_destroy` callback. This callback will simply output a message:

```ruby
class Post < ApplicationRecord
  before_destroy :one_last_thing

  def one_last_thing
    puts "Post model #{id} will be destroyed"
  end
end
```

Launch a Rails console with `bin/rails c` and let's see how the removal methods behave:

```ruby
post = Post.find_by(title: "Hello Post")
post.delete
# Post Destroy (3.8ms)  DELETE FROM "posts" WHERE "posts"."id" = ?  [["id", 5]]
post.frozen?
# true

another_post = Post.find_by(title: "Another Post")
another_post.destroy
# Post model 6 will be destroyed
# TRANSACTION (0.1ms)  begin transaction
# Post Destroy (0.5ms)  DELETE FROM "posts" WHERE "posts"."id" = ?  [["id", 6]]
# TRANSACTION (1.1ms)  commit transaction
```

From the above, we can see that `delete` immediately invokes the SQL `DELETE` statement whereas `destroy` first invokes the `before_destroy` callback. Now with this understood, we can move on to removal of records with associations.

<aside class="markdown-aside">
There is one more difference in the behaviour the delete and destroy that isn't documented. When specifying a dependent option on an ActiveRecord association, the logic for that option will only run when the destroy method is invoked, not the delete method. This will be demonstrated in the various test scenarios further in this post.
</aside>

## Options Matrix

Recall we have Books that `belong_to` an Author, and Author's `have_many` books. Let's start by looking at the dependent options for [belongs_to](https://guides.rubyonrails.org/association_basics.html#options-for-belongs-to-dependent):

1. `:destroy` when the object is destroyed, destroy will be called on its associated objects.
2. `:delete` when the object is destroyed, all its associated objects will be deleted directly from the database without calling their destroy method.

For example, to use the `destroy` option, the Book model would look like this to indicate that whenever a Book is destroyed, its associated Author should also be destroyed:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end
```

Here are the dependent options for [has_many](https://guides.rubyonrails.org/association_basics.html#dependent):

1. `:destroy` causes all the associated objects to also be destroyed
2. `:delete_all` causes all the associated objects to be deleted directly from the database (so callbacks will not execute)
3. `:destroy_async` when the object is destroyed, an `ActiveRecord::DestroyAssociationAsyncJob` job is enqueued which will call destroy on its associated objects. Active Job must be set up for this to work.
4. `:nullify` causes the foreign key to be set to NULL. Polymorphic type column is also nullified on polymorphic associations. Callbacks are not executed.
5. `:restrict_with_exception` causes an ActiveRecord::DeleteRestrictionError exception to be raised if there are any associated records
6. `:restrict_with_error` causes an error to be added to the owner if there are any associated objects

For example, to use the `destroy` option, the Author model would look like this to indicate that whenever an Author is destroyed, its Books should also be destroyed:

```ruby
class Author < ApplicationRecord
  has_many :books, dependent: :destroy
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

Summing up the options, there are 2 dependent options on the `belongs_to` association, plus the "option" to not specify anything which makes 3. There are 6 dependent options on the `has_many` association, plus the do nothing "option" which makes 7.

On the `has_many` side, the `restrict_with_error` option behaves similarly to the `restrict_with_exception` except that it populates the `errors` property of the model instead of raising an exception. Similarly, the `destroy_async` option behaves similarly to the `destroy` except it does so via a job. To reduce the number of combinations and avoid the complexity of setting up ActiveJob in this analysis, will only consider `restrict_with_exception` and leave off `destroy_async`.

This means there are 3 * 5 = 15 possible combinations of dependent options:

| Scenario | belongs_to    | has_many                 |
|----------|---------------|--------------------------|
| [1](../activerecord-dependent-options/#1-no-options)        | not specified | not specified            |
| [2](../activerecord-dependent-options/#2-has-many-destroy)        | not specified | :destroy                 |
| [3](../activerecord-dependent-options/#3-has-many-delete-all)        | not specified | :delete_all              |
| [4](../activerecord-dependent-options/#4-has-many-nullify)        | not specified | :nullify                 |
| [5](../activerecord-dependent-options/#5-has-many-restrict-with-exception)        | not specified | :restrict_with_exception |
| [6](../activerecord-dependent-options/#6-belongs-to-destroy)        | :destroy      | not specified            |
| [7](../activerecord-dependent-options/#7-belongs-to-destroy-has-many-destroy)        | :destroy      | :destroy                 |
| [8](../activerecord-dependent-options/#8-belongs-to-destroy-has-many-delete-all)        | :destroy      | :delete_all              |
| [9](../activerecord-dependent-options/#9-belongs-to-destroy-has-many-nullify)       | :destroy      | :nullify                 |
| [10](../activerecord-dependent-options/#10-belongs-to-destroy-has-many-restrict-with-exception)       | :destroy      | :restrict_with_exception |
| [11](../activerecord-dependent-options/#11-belongs-to-delete)       | :delete       | not specified            |
| [12](../activerecord-dependent-options/#12-belongs-to-delete-has-many-destroy)       | :delete       | :destroy                 |
| [13](../activerecord-dependent-options/#13-belongs-to-delete-has-many-delete-all)       | :delete       | :delete_all              |
| [14](../activerecord-dependent-options/#14-belongs-to-delete-has-many-nullify)       | :delete       | :nullify                 |
| [15](../activerecord-dependent-options/#15-belongs-to-delete-has-many-restrict-with-exception)       | :delete       | :restrict_with_exception |

For each combination, I want to understand what happens given the following:

1. An Author with no books is destroyed.
2. An Author with a single book is destroyed.
3. An Author with multiple books is destroyed.
4. 1 through 3 above but deleted instead of destroyed.
5. A book belonging to an Author that only has that one book is destroyed.
6. A book belonging to an Author that has multiple other books is destroyed.
7. 5 through 6 above but deleted instead of destroyed.

So that's 7 actions * 15 scenarios = 105 actions. Definitely too much work to try out each one in the console, but easily handled by a test framework. I'll use [RSpec](https://rspec.info/) as that's what I'm familiar with, and it automatically resets the database after each example.

## Test Setup

After [adding RSpec to the project](../start-rails-6-project-with-rspec), I added the following tests for the Author and Book models. These are exploratory tests, that is, they're being used to learn what will happen rather than declaring what should happen. That's why there are no expectations, and exceptions are caught and logged.

The bang version `destroy!` is used since it raises an exception so its easier to see what went wrong. I'm also logging the beginning and ending of each test to make it clear in the log file what activity is coming from which test. Finally, a test helper is added to show the counts of how many authors and books were deleted at the end of each test:

```ruby
# spec/helpers.rb
# Add `require "./spec/helpers"` to rails_helper.rb after Rails is loaded
module Helpers
  def show_model_counts
    original_author_count = 3
    original_book_count = 4
    Rails.logger.info("  NUMBER AUTHORS DELETED: #{original_author_count - Author.count}; NUMBER BOOKS DELETED: #{original_book_count - Book.count}")
  end
end
```

```ruby
# spec/models/author_spec.rb
require "rails_helper"

describe Author, type: :model do
  before(:each) do |example|
    Rails.logger.info("\n=== BEGIN TEST #{example.metadata[:full_description]} ===")
  end

  after(:each) do
    show_model_counts
    Rails.logger.info("=== END TEST ===\n")
  end

  describe "#destroy!" do
    it "remove an author with no books" do
      author = Author.find_by(name: "John Doe")
      begin
        author.destroy!
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove an author with a single book" do
      author = Author.find_by(name: "Julian James McKinnon")
      begin
        author.destroy!
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove an author with multiple books" do
      author = Author.find_by(name: "Andrew Park")
      begin
        author.destroy!
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end
  end

  describe "#delete" do
    it "remove an author with no books" do
      author = Author.find_by(name: "John Doe")
      begin
        author.delete
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove an author with a single book" do
      author = Author.find_by(name: "Julian James McKinnon")
      begin
        author.delete
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove an author with multiple books" do
      author = Author.find_by(name: "Andrew Park")
      begin
        author.delete
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end
  end
end
```

```ruby
# spec/models/book_spec.rb
require "rails_helper"

describe Book, type: :model do
  before(:each) do |example|
    Rails.logger.info("\n=== BEGIN TEST #{example.metadata[:full_description]} ===")
  end

  after(:each) do
    show_model_counts
    Rails.logger.info("=== END TEST ===\n")
  end

  describe "#destroy!" do
    it "remove a book from author that only has that book" do
      book = Book.find_by(title: "Computer Programming Crash Course: 7 Books in 1")
      begin
        book.destroy!
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove a book from author that has multiple books" do
      book = Book.find_by(title: "Python Programming for Beginners")
      begin
        book.destroy!
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end
  end

  describe "#delete" do
    it "remove a book from author that only has that book" do
      book = Book.find_by(title: "Computer Programming Crash Course: 7 Books in 1")
      begin
        book.delete
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end

    it "remove a book from author that has multiple books" do
      book = Book.find_by(title: "Python Programming for Beginners")
      begin
        book.delete
      rescue StandardError => e
        Rails.logger.error("#{e.class} - #{e.message}")
      end
    end
  end
end
```

## Scenarios

In this next section, each model class will be modified with respect to its dependent option, then the tests will be run and the log files analyzed to understand the behavior of each option.

### 1: No Options

In this scenario, we do not specify any `dependent` option on either side of the `belongs_to/has_many` relationship. So the models simply look like this:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

Let's run the tests with `bundle exec rspec` and then examine the `log/test.log` file:

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (7.6ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.9ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.4ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (3.2ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test Log Summary**

* Author (i.e. model on the `has_many` side of the relationship) with one or more books cannot be removed. Both `destroy!` and `delete` methods raise `ActiveRecord::InvalidForeignKey`.
* Author with no books can be successfully removed with either `destroy!` or `delete` methods.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

If your system never needs to delete any instance of the model on the `has_many` side, then not specifying any `dependent` options is ok, otherwise, consider one of the other scenarios.

### 2: Has Many Destroy

In this case, we leave the Book model with no dependent option, and specify `destroy` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :destroy # causes all the associated objects to also be destroyed
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (1.6ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  Book model 2 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 2]]
  Book model 3 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 3]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy/destroy!` on Author model (`has_many` side of relationship) instance works to delete that author *and* also destroys each of the author's books. That is, each associated book has its `before_destroy` callback invoked, and then is deleted from the database with a SQL DELETE statement. Note that in the case of an Author with multiple Books, the books are deleted one at a time with multiple SQL DELETE statements. This is because each book also must have its callbacks invoked.
* Calling `delete` on Author model fails on foreign key constraint for author instances that have one or more associated books. (`delete` on Author model with no books succeeds).
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

Use the `dependent: :destroy` option to support a cascade style delete where a parent model and all its associations can be removed, with the associated models `before_destroy` callbacks invoked for final cleanup.

### 3: Has Many Delete All

In this case, we leave the Book model with no dependent option, and specify `delete_all` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :delete_all # causes all the associated objects to be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container">
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

</code>
</pre>
</details>

**Test log summary**

* Calling `destroy/destroy!` on Author model (`has_many` side of relationship) instance works to delete that author *and* also directly deletes each of the author's books. That is, each associated book will be deleted via SQL DELETE statement but will *not* have its `before_destroy` callback invoked. Unlike in [Scenario 2](../activerecord-dependent-options/#2-has-many-destroy) where the books were deleted one at a time, in this case, all of an author's books are deleted in a single SQL DELETE statement.
* Calling `delete` on Author model fails on foreign key constraint for author instances that have one or more associated books.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

Use the `dependent: :delete_all` option to support a cascade style delete where a parent model and all its associations can be removed, and where the associated models can be immediately deleted via SQL DELETE, with no need for their `before_destroy` callbacks invoked, i.e. no need for any final cleanup.

### 4: Has Many Nullify

In this case, we leave the Book model with no dependent option, and specify `nullify` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :nullify # causes the foreign key to be set to NULL
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (1.2ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (1.2ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::NotNullViolation - SQLite3::ConstraintException: NOT NULL constraint failed: books.author_id
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.4ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::NotNullViolation - SQLite3::ConstraintException: NOT NULL constraint failed: books.author_id
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.0ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (1.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy!` on an Author with no books invokes its `before_destroy` callback then removes the author from the database.
* Calling `destroy!` on an Author with one or more books fails, but not on a foreign key constraint, rather, an `ActiveRecord::NotNullViolation`. This is because it's attempting to update `author_id` on the associated Book models to `null` which is not allowed due to how the Book migration was defined.
* Calling `delete` on an Author with one or more books fails, raising `ActiveRecord::InvalidForeignKey`.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

The `nullify` option could be useful if the system requirements were that an Author (parent model on the `has_many` side) could be removed from the database, but its associated Books could not be removed. In order for this to work, the Book model (child model on the `belongs_to`) side would need to allow its foreign key`author_id` to be null, i.e. the migration would have to look like this:

```ruby
class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title
      t.date :published_at

      # Original column definition
      # t.references :author, null: false, foreign_key: true

      # Modified column definition to support nullify option on Author model
      t.references :author

      t.timestamps
    end
  end
end
```

With a null `author_id` allowed, the Author destroy tests succeed in removing the Author from the database, *and* updating the Author's associated Books with a null `author_id` as shown in this test log below, focusing only on the Author tests:.

<details class="markdown-details">
<summary class="markdown-summary">
Test log for Author destroy with null FK allowed on Book
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.4ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (1.6ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===
</code>
</pre>
</details>

In a real application, the code that handles or displays Books would have to be flexible enough to handle a null Author rather than assuming it will always be populated.

One thing to watch out with the nullify option, is that calling `delete` on an author simply removes the author via SQL DELETE, but does not update the author's associated books to have a null `author_id`. This leaves the books as orphans, referencing an author that no longer exists, as shown in this snippet of the test log:

<details class="markdown-details">
<summary class="markdown-summary">
Test log for Author delete with null FK allowed on Book
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===
</code>
</pre>
</details>

Lesson learned: When using the `dependent: :nullify`, remember to use the `destroy` method rather than `delete`.

### 5: Has Many Restrict With Exception

In this case, we leave the Book model with no dependent option, and specify `restrict_with_exception` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :restrict_with_exception # ActiveRecord::DeleteRestrictionError exception raised if there are any associated records
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.4ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 3], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (2.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.2ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy!` on an Author with no books invokes its `before_destroy` callback then removes the author from the database.
* Calling `destroy!` on an Author with one or more books fails, but not on a foreign key constraint, rather, an `ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books`. This is the behaviour of `restrict_with_exception`.
* Calling `delete` on an Author with one or more books fails, raising `ActiveRecord::InvalidForeignKey`.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

Use this option if you want to prevent models with dependent models from being removed, but with an explicit exception that can be handled rather than catching a foreign key constraint violation from the database. Note that you have to use the `destroy` method to raise `DeleteRestrictionError`. The `delete` method still raises `ActiveRecord::InvalidForeignKey`.

### 6: Belongs to Destroy

In this case, we update the Book model to specify `destroy` and the Author model is unspecified:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy # when the object is destroyed, destroy will be called on its associated objects
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (2.0ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.5ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (1.6ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (1.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (1.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Author tests behave the same as [Scenario 1](../activerecord-dependent-options/#1-no-options), where any author with an associated book cannot be removed due to foreign key constraint.
* Calling `destroy` on a book that belongs to an author that only has that one book, destroys both the book and the author.
* Calling `destroy` on a book that belongs to an author that has other books as well fails. It attempts to delete the author but then runs into a foreign key constraint because there's still other books in the system that belong to that author. In this case, nothing is deleted.
* Calling delete on a book (whether the author has only that one book or others as well), deletes only that book and does not attempt to go up to the author for further deletion.

Note that the Rails Guides warn not to use this `dependent: :destroy` option in this way:

> You should not specify this option on a belongs_to association that is connected with a has_many association on the other class. Doing so can lead to orphaned records in your database.

The test that attempts to destroy a book belonging to an author that has other books is where this issue could happen. If the associated author had been removed, that would leave the other books "orphaned". With a non nullable foreign key constraint on the Book model, this was not allowed.

However, if the Book migration allowed a nullable foreign key for author:

```ruby
class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title
      t.date :published_at

      # Original column definition
      # t.references :author, null: false, foreign_key: true

      # For experimentation in allowing a nullable foreign key
      t.references :author

      t.timestamps
    end
  end
end
```

Then calling destroy on a book whose author has other books will remove both the book and author from the system, leaving the other books from this author as "orphans" in that they still have their `author_id` property populated, but the referenced author has been removed.

Let's see this in a Rails console:

```ruby
# book by author that has other books
book = Book.find_by(title: "Python Programming for Beginners")

# removing book also removes associated author, even though that author has other books!
book.destroy!
# Book model 1 will be destroyed
# TRANSACTION (0.1ms)  begin transaction
# Book Destroy (0.8ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
# Author Load (0.3ms)  SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?  [["id", 1], ["LIMIT", 1]]
# Author model 1 will be destroyed
# Author Destroy (0.3ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
# TRANSACTION (0.7ms)  commit transaction

# this leaves some books still pointing to the deleted author - these are orphans
orphaned_books = Book.where(author_id: 1)
orphaned_books.count
# => 2
```

The `dependent: :destroy` option on the `belongs_to` side of a relationship could be useful in a 1-1 situation, for example, if an Author specified `has_one` book instead of `has_many`. But otherwise, it doesn't really make sense because either it will lead to orphan records or foreign key constraint errors in some cases.

### 7: Belongs to Destroy Has Many Destroy

In this case, the `destroy` option is specified on both sides of the relationship:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy # when the object is destroyed, destroy will be called on its associated objects
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :destroy # causes all the associated objects to also be destroyed
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

This could be a strange situation as declaring destroy on each side says "when this model is destroyed, also destroy its associated models". This means destroying a book would attempt to destroy its author, but that in turn would attempt to destroy its book(s), could this cause an infinite destroy loop? Let's see what happens with the tests.

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (2.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (8.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::RecordNotDestroyed - Failed to destroy Book with id=4
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::RecordNotDestroyed - Failed to destroy Book with id=1
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.9ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.9ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (2.0ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Book model 2 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::RecordNotDestroyed - Failed to destroy Book with id=1
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy!` on an Author with no books invokes its `before_destroy` callback then removes the author from the database.
* Calling `destroy!` on an Author with one or more books fails, but not on a foreign key constraint, rather, an `ActiveRecord::RecordNotDestroyed - Failed to destroy Book with id={author id}`. In this case it's attempting to destroy the Author's associated book(s) but failing to do so. Interesting that the error message doesn't say why it failed. Recall that in [Scenario 2](../activerecord-dependent-options/#2-has-many-destroy) where the destroy on the has_many side was used by itself, destroying an author with one or more books was successful.
* Calling `delete` on an Author with one or more books fails, raising `ActiveRecord::InvalidForeignKey`.
* Calling `destroy!` on a book belonging to an Author that only has that one book works - both the book and its author are removed from the database, although it does run a query first to see if that author has any other books.
* Calling `destroy!` on a book belonging to an Author that has other books fails with `ActiveRecord::RecordNotDestroyed - Failed to destroy Book with id={book_id}`. In [Scenario 6](../activerecord-dependent-options/#6-belongs-to-destroy), where destroy was only specified on Book but not Author, this case also failed but with a more useful error indicating why the book could not be removed: `ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed`.
* Calling `delete` on a book, regardless of its author having just that book or others, successfully removes that book and does not attempt to remove any authors.

Even though Rails will not go into an infinite loop with `destroy` on both sides of the relationship, this seems like an invalid combination. In a simple application such as this one, it's easy to see the `destroy` on both sides and fix it (choose just one), but in a larger app with more models, it could be tricky to find.

### 8: Belongs to Destroy Has Many Delete All

In this case, the `destroy` option is specified on Book and `delete_all` on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy # when the object is destroyed, destroy will be called on its associated objects
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :delete_all # causes all associated objects to be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (1.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.8ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Delete All (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.0ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Delete All (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy!` an author has the same effect as it did in [Scenario 3](../activerecord-dependent-options/#3-has-many-delete-all), in that it first directly removes all of the author's books via SQL DELETE, then calls the author's `before_destroy` callback, then removes the author from the database.
* Calling `delete` on an author with books fails on a foreign key constraint.
* Calling `destroy` on a book belonging to an author that only has that one book removes both the book and its associated author from the database.
* Calling `destroy` on a book belonging to an author that has other books is the most interesting case - it removes the book from the database, then finds the author, then finds all the other books belonging to this author and removes those as well, then finally, it removes the author.
* Calling `delete` on a book removes just that book.

I wouldn't use this combination as it can produce a surprising result when calling `book.destroy` on a book that belongs to an author that also has other books. It ends up removing not just that book but all the other books written by this author. It's a kind of cascade but starting from a child, going up to the parent, then back down to other children.

### 9: Belongs to Destroy Has Many Nullify

In this case, the `destroy` option is specified on Book and `nullify` on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy # when the object is destroyed, destroy will be called on its associated objects
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :nullify # causes the foreign key to be set to NULL
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

In [Scenario 4](../activerecord-dependent-options/#4-has-many-nullify), we learned that in order for `nullify` to work, the model on the other side of the relationship (Book) needs to allow a nullable foreign key. So we'll run the tests with the database having this migration for the `books` table:

```ruby
class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title
      t.date :published_at
      # t.references :author, null: false, foreign_key: true
      # for experimentation in allowing a nullable foreign key
      t.references :author

      t.timestamps
    end
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.5ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.6ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.7ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.4ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (16.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (1.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Update All (0.1ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.0ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Update All (0.1ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an author with one or more books is successful. It first finds the author's associated books, updates their `author_id` column to `nil`, then SQL DELETEs the author record.
* Calling `delete` on an author is also successful. However, it does not update its associated book models to have a null `author_id`. This will leave book records "orphaned" in that they're referencing an author that no longer exists.
* Calling `destroy` on a book that belongs to an author that only has that one book successfully removes first the book, and then the author from the database.
* Calling `destroy` on a book that belongs to an author that has other books is interesting. The book and author are removed from the database, and also, any other books the author has are updated to have a null `author_id`.
* Calling `delete` on any book executes SQL DELETE to remove just that book and doesn't affect any author or other books.

I wouldn't use this combination because there's a surprising result when calling `destroy` on a book that belongs to an author that has other books. Not only does it remove that book and author, but also updates the author's other books, let's call them siblings to the deleted book, to have a null `author_id`.

### 10: Belongs to Destroy Has Many Restrict With Exception

In this case, the `destroy` option is specified on Book and `restrict_with_exception` on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :destroy # when the object is destroyed, destroy will be called on its associated objects
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :restrict_with_exception # ActiveRecord::DeleteRestrictionError exception raised if there are any associated records
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.3ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 3], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (1.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.9ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 2], ["LIMIT", 1]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Exists? (0.2ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.2ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an author with one or more books fails due to `ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books`. This is the same behaviour observed in [Scenario 5](../activerecord-dependent-options/#5-has-many-restrict-with-exception).
* Calling `delete` on an author with one or more books also fails, but with a `ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed` error raised. Again, the same as [Scenario 5](../activerecord-dependent-options/#5-has-many-restrict-with-exception).
* Calling `destroy` on a book belonging to an author that only has that one book removes both the book and author.
* Calling `destroy` on a book belonging to an author that has other books is interesting - it starts a SQL DELETE to remove the book, then goes up to the author to remove it as well (due to `dependent: :destroy` being specified on Book model), but then the `dependent: :restrict_with_exception` option on Author model kicks in and raises `ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books`. Since all this activity is wrapped in a transaction, it gets rolled back and nothing is removed.
* Calling `delete` on any book executes SQL DELETE to remove just that book and doesn't affect any author or other books.

I wouldn't use this combination as it results in a conflict between the child model Book saying when I'm deleted, delete my parent, and the parent model Author saying, do not delete me if I have children.

### 11: Belongs to Delete

In this case, the `delete` option is specified on Book and the Author model does not specify any dependent option:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :delete # when the object is destroyed, all its associated objects will be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.4ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Similar to [Scenario 6](../activerecord-dependent-options/#6-belongs-to-destroy), when no dependent options are specified on the Author/has_many side of the relationship, trying to either `destroy` or `delete` an author with one or more books fails with `ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed`.
* Calling `destroy` on a Book that belongs to an Author that only has that one book destroys the book (i.e. callbacks and SQL DELETE), and also deletes the Author (i.e. SQL DELETE, no callbacks). This is the effect of the `delete` option specified on Book.
* Calling `destroy` on a Book that belongs to an Author that has other books as well first destroys the book, then attempts to SQL DELETE the author. This fails on a foreign key constraint, since the other books belonging to this Author are still in the database referencing it, and so the entire transaction is rolled back and nothing is removed.
* Calling `delete` on a book invokes SQL DELETE on just that book, no other models are affected.

I wouldn't use this option as the results seem inconsistent with respect to removing child models (on the belongs_to side of the relationship). That is, if removing a book that belongs to an author that only has that one book, then both the child and parent models are removed (with the child model having its destroy callback invoked but the parent model does not). But if a child model belongs to a parent with other children, then nothing is removed.

### 12: Belongs to Delete Has Many Destroy

In this case, the `delete` option is specified on Book and `destroy` option is specified on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :delete # when the object is destroyed, all its associated objects will be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :destroy # causes all the associated objects to also be destroyed
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

Similar to [Scenario 7](../activerecord-dependent-options/#7-belongs-to-destroy-has-many-destroy), this seems like a situation that could lead to an infinite delete/destroy loop with each side of the relationship trying to remove the other. Let's see what happens:

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (1.8ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.9ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (6.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.3ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (2.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an Author with a single book invokes destroy callback on the book and removes it from the database, and then removes the author from the database. Interesting that according to the test log, the SQL DELETE statement to delete the author runs *before* the author's `before_destroy` callback is invoked. This is different than in [Scenario 2](../activerecord-dependent-options/#2-has-many-destroy) in which the `before_destroy` callback is invoked before the SQL DELETE.
* Calling `destroy` on an Author with multiple books, finds all books belonging to this Author, invokes the first book's callback, then executes SQL DELETE on the first book, then SQL DELETE on the author. At that point, it fails on a foreign key constraint because the author still has other books remaining that reference it. Normally the `dependent: :destroy` option on Author performs a cascading delete on all its Books but having `dependent: :delete` on the book prevents this.
* Calling `delete` on an Author with one or more books fails on a foreign key constraint, because `delete` method does not attempt to remove any associated models, and it would be invalid to have a book model referencing an author that no longer exists.
* Calling `destroy` on a Book belonging to an Author that only has that one book successfully removes the book (first invoking its callback), then removes the author via SQL DELETE (no callbacks).
* Calling `destroy` on a Book belonging to an Author that has other books fails on a foreign key constraint when attempting to SQL DELETE the author, because that would leave the other books referencing an author that no longer exists.
* Calling `delete` on a book works to remove just that book.

I wouldn't use this combination of options as the desired cascading delete effect from an Author to its Books won't happen as expected. See [Scenario 2](../activerecord-dependent-options/#2-has-many-destroy) for the expected cascade.

### 13: Belongs to Delete Has Many Delete All

In this case, the `delete` option is specified on Book and `delete_all` option is specified on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :delete # when the object is destroyed, all its associated objects will be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :delete_all # causes all the associated objects to be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

Again a potential loop of deletes in that when a book is removed, it should delete its author, but when an author is removed, it should delete all its books.

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (1.8ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.9ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.4ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (1.0ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.2ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.9ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (1.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an author with a single book first deletes the associated book, then invokes the author's callback, then deletes the author.
* Calling `destroy` on an author with multiple books deletes all its associated books, then invokes the author's callback, then deletes the author.
* Calling `delete` on an author with one or more books attempts to delete just that author, then fails on a foreign key constraint because there still exist books that reference this author.
* Calling `destroy` on a book belonging to an author that only has that one book invokes the book's callback, deletes the book, then finds the associated author and deletes that.
* Calling `destroy` on a book belonging to an author that has other books fails on a foreign key constraint, at the point when attempting to delete the associated author, because there are still other books referencing this author.
* Calling `delete` on a book works to delete just that book.

It looks like these options don't interfere with each other and behave the same as if only one was specified. But having `dependent: :delete` on the belongs_to side of the relationship is still problematic, as was explained in [Scenario 11](../activerecord-dependent-options/#11-belongs-to-delete).

### 14: Belongs to Delete Has Many Nullify

In this case, the `delete` option is specified on Book and `nullify` option is specified on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :delete # when the object is destroyed, all its associated objects will be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :nullify # causes the foreign key to be set to NULL
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

Just like in [Scenario 4](../activerecord-dependent-options/#4-has-many-nullify), in order to observe the effects of `nullify`, the `books` migration needs to allow a nullable reference to `author_id`:

```ruby
class CreateBooks < ActiveRecord::Migration[7.0]
  def change
    create_table :books do |t|
      t.string :title
      t.date :published_at

      # Original column definition
      # t.references :author, null: false, foreign_key: true

      # Modified column definition to support nullify option on Author model
      t.references :author

      t.timestamps
    end
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.2ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.4ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Update All (0.4ms)</span>  <span class="rails-log-yellow">UPDATE "books" SET "author_id" = ? WHERE "books"."author_id" = ?</span>  [["author_id", nil], ["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (1.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.7ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an author with one or more books first updates its associated book's `author_id` to nil, then invokes the author's callback and deletes the author. So no books are removed from the database, but the book records are updated to have a nil author_id.
* Calling `delete` on an author, whether it has 0, 1, or more books deletes the author from the database, and does *not* attempt to remove or update the associated book records. This creates an orphan situation where book records are left in the database referencing an author that no longer exists.
* Calling `destroy` on a book that belongs to an author that only has that one book invokes the book's callback and deletes it. Then it finds the associated author and deletes that as well.
* Calling `destroy` on a book that belongs to an author that has other books deletes both the book and author, leaving the author's other books as orphans, i.e. referencing an author that no longer exists. This is different behaviour than when nullify was used in [Scenario 9](../activerecord-dependent-options/#9-belongs-to-destroy-has-many-nullify), in which case the other books were updated to have a nil author_id.
* Calling `delete` on a book removes just that book.

Most surprising: The nullify option on the has_many side of the relationship behaves differently depending on whether the belongs_to specifies dependent option destroy or delete.

I wouldn't use this combination as there's some surprising results. Specifically calling `destroy` on a book will result in its sibling books being made orphans because their author_id will still be populated, pointing to an author that no longer exists. With the nullify option on the author, it's expected that some books will have a nil author_id, but not that author_id could be populated but invalid.

### 15: Belongs to Delete Has Many Restrict With Exception

In this case, the `delete` option is specified on Book and `restrict_with_exception` option is specified on Author:

```ruby
class Book < ApplicationRecord
  belongs_to :author, dependent: :delete # when the object is destroyed, all its associated objects will be deleted directly from the database
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :restrict_with_exception # ActiveRecord::DeleteRestrictionError exception raised if there are any associated records
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("Author model #{id} will be destroyed")
  end
end
```

<details class="markdown-details">
<summary class="markdown-summary">
View test log
</summary>
<pre class="grvsc-container gatsby-highlight-monokai" data-language>
<code class="grvsc-code">

=== BEGIN TEST Author#destroy! remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.4ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.4ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 3], ["LIMIT", 1]]
  Author model 3 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Exists? (0.1ms)</span>  <span class="rails-log-blue">SELECT 1 AS one FROM "books" WHERE "books"."author_id" = ? LIMIT ?</span>  [["author_id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (7.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.8ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.5ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 2], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (2.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?</span>  [["id", 1], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-red">ROLLBACK TO SAVEPOINT active_record_1</span>
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.5ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (1.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (1.2ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

**Test log summary**

* Calling `destroy` on an author with no books removes it (callback + SQL DELETE). But for an author with one or more books, an error is raised: `ActiveRecord::DeleteRestrictionError - Cannot delete record because of dependent books`.
* Calling `delete` on an author with one or more books fails on a foreign key constraint.
* Calling `destroy` on a book that belongs to an author with just that one book removes the book (callback + SQL DELETE), then deletes the author.
* Calling `destroy` on a book that belongs to an author with other books fails to remove anything. This is because a foreign key constraint exception is raised when trying to delete the author, that would leave its other book records with invalid references.
* Calling `delete` on a book works and only removes that book.

The combination of `dependent: :delete` on `belongs_to` and `dependent: :restrict_with_exception` on `has_many` behave the same as if each option was specified independently and the other side was not specified.

## Which Should You Use?

### Requirements

The answer, as in nearly all things tech is... it depends. Firstly, it depends on the business and/or legal requirements of the application. Which models need to be removed? For example, should a customer be able to click a button to remove their account? If so, what should happen to all other models that may refer to this customer record? For an e-commerce or SaaS application, the customer's shipping addresses and payment methods should probably be removed which would be a good use case for `has_many :shipping_addresses, dependent: :destroy` option on the Customer model.

But what about the customer's orders, would removing those affect reporting and financial systems? How about any product reviews the customer may have written? This might be a good use case for allowing nullable foreign keys and using `has_many: product_reviews, dependent: :nullify` if the review content is considered the company's content, not the customers. All these questions need to be answered.

### Performance

Both `dependent: :destroy` and `dependent: :delete_all` on the has_many side will perform a cascade style delete. But the `:destroy` option will execute multiple SQL DELETE statements, one for each associated model to be removed because its callbacks are also being invoked. Whereas the `:delete_all` option will remove all associated models in a single SQL DELETE statement. If the parent model is expected to have a lot of children, using `:destroy` could be noticeably slower than `:delete_all`. If the callbacks absolutely have to be executed, consider the `:destroy_async` option.

### Surprises

Another factor to consider is the [principle of least surprise](https://en.wikipedia.org/wiki/Principle_of_least_astonishment). For example, the combination of `dependent: :destroy` on the belongs_to side and `dependent: :nullify` on the has_many side results in siblings having their foreign key references set to nil when one of them is destroyed. We saw this in [Scenario 9](activerecord-dependent-options/#9-belongs-to-destroy-has-many-nullify) where having nullify on the has_many side causes the `belongs_to: :destroy` to go from a book, up to its author for removal, and then back to all the other books to nullify their author_id foreign keys.

We also encountered surprising results in [Scenario 8](../activerecord-dependent-options/#8-belongs-to-destroy-has-many-delete-all), with the combination of `dependent: :destroy` on belongs_to and `dependent :delete_all` on has_many. In this case, removing a book that belongs to an author that has other books resulted in all of these books being removed. I would avoid combinations of options that produce surprising results.

### Consistency

Another thing to consider is consistency. It's one thing to allow nullable foreign keys, but in [Scenario 14](../activerecord-dependent-options/#14-belongs-to-delete-has-many-nullify), the combination of `dependent: :delete` on the belongs_to side, and `dependent: :nullify` on the has_many side can result in books referencing an author that no longer exists. That is, their foreign key is not null, but specifies an author_id that no longer exists. Although ActiveRecord can handle this by simply returning `nil` when referencing `book.author`, it could result in inconsistencies if using direct SQL statements for a reporting system.

This inconsistency can also happen when using `dependent: :nullify` as we learned in [Scenario 4](../activerecord-dependent-options/#4-has-many-nullify) when invoking the `delete` method on the model with the `has_many` rather than the `destroy` method.

### Combinations

Proceed with caution when *combining* options. From this exercise, we've learned that the same option can behave differently depending on what option if any is specified on the other side of the relationship. For example, when `dependent: :destroy` is used on the has_many side by itself as in [Scenario 2](../activerecord-dependent-options/#2-has-many-destroy), an author with one or more books can be successfully destroyed and all its books are also destroyed. But when this option is combined with `dependent: :destroy` on the belongs_to side as in [Scenario 7](../activerecord-dependent-options/#7-belongs-to-destroy-has-many-destroy), then the destroy method on an Author with one or more books fails. Even stranger, when this option is combined with `dependent: :delete` on the belongs_to side as in [Scenario 12](../activerecord-dependent-options/#12-belongs-to-delete-has-many-destroy), then an Author with a single book can be destroyed, but its before_destroy callback gets invoked after the SQL DELETE statement to remove it. And trying to destroy an Author with multiple books fails.

### Orphans

Consider the advice in the Rails Guides, specifically the warning not to use `dependent: :destroy` on the `belongs_to` side of a one-to-many relationship due to possibility of orphan records. We tried this in a few scenarios, starting with [Scenario 6](../activerecord-dependent-options/#6-belongs-to-destroy). This case did not result in orphan records (as long as a nullable foreign key was not allowed) but trying to remove a book belonging to an author that had other books failed on a foreign key constraint. In this case ActiveRecord prevents orphan records, but will result in more complex code that needs to handle some entities can be removed and some cannot due to how many other entities their parent has. Scenarios [7](../activerecord-dependent-options/#7-belongs-to-destroy-has-many-destroy), [8](../activerecord-dependent-options/#8-belongs-to-destroy-has-many-delete-all), [9](../activerecord-dependent-options/#9-belongs-to-destroy-has-many-nullify), and [10](../activerecord-dependent-options/#10-belongs-to-destroy-has-many-restrict-with-exception) are other variations on using `dependent: :destroy` on the `belongs_to` side and all had some problems or possibly unintended consequences.

### Removal Method

A final thing to be aware of is when using any of the dependent options to affect related entities: This behaviour only kicks in when invoking the `destroy` or `destroy!` methods on the model instance. The `delete` method only invokes direct SQL on the model on which it is called and does not attempt to affect any of its associations.

## Conclusion

This post has used [exploratory tests](https://github.com/danielabar/learn-associations) to understand how ActiveRecord dependent options function in a one to many relationship to remove (or fail to remove) records from the database when used only on one, or both sides of the relationship. It has also explored differences in the `delete` vs `destroy` methods. It then covered some factors to consider in choosing which dependent option(s) to use.
