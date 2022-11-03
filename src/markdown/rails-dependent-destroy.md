---
title: "A Deep Dive on ActiveRecord Dependent Options"
featuredImage: "../images/enum-jake-hills-0hgiQQEi4ic-unsplash.jpg"
description: "TBD..."
date: "2023-03-01"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

Rails makes defining relationships between models using Active Record associations super easy. Simply add a macro style declaration such as `has_one`, `has_many`, `belongs_to` etc. to your model and Rails will take care of maintaining the relationship. However, some thought is required when it comes to *removing* data from the database, while maintaining data integrity such as foreign key constraints. All the Rails courses and tutorials I've done so far cover adding associations, but none have covered what happens when a record with associations needs to be removed.

Many years ago, before the likes of GDPR and privacy concerns, the "solution" was to never remove any data or use logical, a.k.a [soft delete](https://stackoverflow.com/questions/378331/physical-vs-logical-hard-vs-soft-delete-of-database-record). But with increased privacy regulations and the [right to be forgotten](https://en.wikipedia.org/wiki/Right_to_be_forgotten), applications need the ability to safely remove certain data.

The Rails Guide on [Active Record Associations](https://guides.rubyonrails.org/association_basics.html) does cover deletion options. However, since there are so many options besides just for deletion, found myself scrolling up and down through the docs and losing track of which side of the association was being referred to. Also, since different options can be specified on each side of an association, it can be tricky to reason about what would happen with various *combinations* of options.

A further complexity is that there are two different ways to remove an ActiveRecord model in rails: Delete and Destroy. They sound similar but do slightly different things (more on this later). If you add that into the mix of removal options, the number of scenarios grows even further.

In the vein of "a picture is worth a thousand words", I decided to build a sample Rails application and do a deep dive on all the removal options for some commonly used associations and how they behave when deleting or destroying a record. This post will walk through the results of this.

## Project Setup

I started by scaffolding a new Rails project with Ruby 3 and Rails 7, using the default SQLite database:

```
rbenv install 3.1.2
rbenv local 3.1.2
gem install rails -v 7.0.4
rails new learn-associations
cd learn-associations
```

I added the [annotate](https://github.com/ctran/annotate_models) gem to add the corresponding table schema as code comments above each model class:

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

Here are the commands to generate the models, which also generate the migrations to create the tables. I also generated a `Post` model that is not associated with anything, to demonstrate the difference between destroy and delete in a simple case where there are no associated models.

```bash
# simple model with no associations to demonstrate difference between destroy and delete
bin/rails generate model post title:string body:text

# models with associations
bin/rails generate model author name:string
bin/rails generate model book title:string published_at:date author:references
```

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

## Delete vs Destroy

Now I wanted to understand what would happen when attempting to remove various Author or Book records from the database with respect to their associations. However, there's an additional complexity in that there's two different methods to remove a record, which sound similar, but do slightly different things. From the [Rails API Documentation](https://api.rubyonrails.org/):

* [delete](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-delete): Deletes the record in the database and freezes this instance to reflect that no changes should be made (since they can't be persisted). Returns the frozen instance. The row is simply removed with an SQL `DELETE` statement on the record's primary key, and no callbacks are executed.
* [destroy](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-destroy): Deletes the record in the database and freezes this instance to reflect that no changes should be made (since they can't be persisted). There's a series of callbacks associated with destroy. If the `before_destroy` callback throws `:abort` the action is cancelled and destroy returns `false`.
* [destroy!](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-destroy-21): Similar to `destroy`, except raises `ActiveRecord::RecordNotDestroyed` rather than returning false if the record is not destroyed.

To summarize the difference, `delete` immediately invokes SQL to remove the record from the database, whereas `destroy/destroy!` first invokes the model's `before_destroy` callback which can potentially stop the deletion. I'm assuming this could be a place for any extra cleanup code could be added.

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

## Dependent Options Matrix

Recall we have Books that `belong_to` an Author, and Author's `have_many` books. Let's start by looking at the dependent options for [belongs_to](https://guides.rubyonrails.org/association_basics.html#options-for-belongs-to-dependent):

* `:destroy` when the object is destroyed, destroy will be called on its associated objects.
* `:delete` when the object is destroyed, all its associated objects will be deleted directly from the database without calling their destroy method.

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

And the dependent options for [has_many](https://guides.rubyonrails.org/association_basics.html#dependent):

* `:destroy` causes all the associated objects to also be destroyed
* `:delete_all` causes all the associated objects to be deleted directly from the database (so callbacks will not execute)
* `:nullify` causes the foreign key to be set to NULL. Polymorphic type column is also nullified on polymorphic associations. Callbacks are not executed.
* `:restrict_with_exception` causes an ActiveRecord::DeleteRestrictionError exception to be raised if there are any associated records
* `:restrict_with_error` causes an error to be added to the owner if there are any associated objects

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

Summing up the options, there are 2 dependent options on the `belongs_to` association, plus the "option" to not specify anything which makes 3. And there are 5 dependent options on the `has_many` association, plus the do nothing "option" which makes 6. This means there are 3 * 6 = 18 possible combinations of dependent options:

| Scenario | belongs_to    | has_many                 |
|----------|---------------|--------------------------|
| [1](../rails-dependent-destroy/#scenario-1-no-dependent-options)        | not specified | not specified            |
| 2        | not specified | :destroy                 |
| 3        | not specified | :delete_all              |
| 4        | not specified | :nullify                 |
| 5        | not specified | :restrict_with_exception |
| 6        | not specified | :restrict_with_error     |
| 7        | :destroy      | not specified            |
| 8        | :destroy      | :destroy                 |
| 9        | :destroy      | :delete_all              |
| 10       | :destroy      | :nullify                 |
| 11       | :destroy      | :restrict_with_exception |
| 12       | :destroy      | :restrict_with_error     |
| 13       | :delete       | not specified            |
| 14       | :delete       | :destroy                 |
| 15       | :delete       | :delete_all              |
| 16       | :delete       | :nullify                 |
| 17       | :delete       | :restrict_with_exception |
| 18       | :delete       | :restrict_with_error     |

For each combination, let's call it a scenario, I want to understand what happens given the following:

1. An Author with no books is destroyed.
2. An Author with a single book is destroyed.
3. An Author with multiple books is destroyed.
4. 1 through 3 above but deleted instead of destroyed.
5. A book belonging to an Author that only has that one book is destroyed.
6. A book belonging to an Author that has multiple other books is destroyed.
7. 5 through 6 above but deleted instead of destroyed.

So that's 7 actions * 18 scenarios = 126 actions. Definitely too much work to try out each one in the console, but easily handled by a test framework. I'll use [RSpec](https://rspec.info/) as that's what I'm familiar with, and it automatically resets the database after each example.

## Test Setup

After [adding RSpec to the project](../start-rails-6-project-with-rspec), I added the following tests for the Author and Book models. These are exploratory tests, that is, they're being used to learn what will happen rather than declaring what should happen. That's why there are no expectations, and exceptions are caught and logged. The bang version `destroy!` is used since it raises an exception so its easier to see what went wrong. I'm also logging the beginning and ending of each test to make it clear in the log file what activity is coming from which test. Finally, a test helper is added to show the counts of how many authors and books were deleted at the end of each test:

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

## Scenario 1: No dependent options

In this scenario, we do not specify any `dependent` option on either side of the `belongs_to/has_many` relationship. So the models simply look like this:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Author model #{id} will be destroyed")
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

=== BEGIN TEST Author#delete remove an author with multiple books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author Destroy (0.6ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author Destroy (0.5ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "John Doe"], ["LIMIT", 1]]
  Author Destroy (0.3ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 3]]
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  Author Load (0.2ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author model 2 will be destroyed
  TRANSACTION (0.0ms)  SAVEPOINT active_record_1
  Author Destroy (0.4ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 2]]
  TRANSACTION (0.0ms)  ROLLBACK TO SAVEPOINT active_record_1
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with no books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "John Doe"], ["LIMIT", 1]]
  Author model 3 will be destroyed
  TRANSACTION (0.0ms)  SAVEPOINT active_record_1
  Author Destroy (0.3ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 3]]
  TRANSACTION (0.1ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  Author Load (0.4ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author model 1 will be destroyed
  TRANSACTION (0.1ms)  SAVEPOINT active_record_1
  Author Destroy (0.5ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
  TRANSACTION (0.0ms)  ROLLBACK TO SAVEPOINT active_record_1
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  Book Load (0.2ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 4]]
  Author Count (0.0ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  TRANSACTION (0.0ms)  SAVEPOINT active_record_1
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 4]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.0ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  TRANSACTION (0.0ms)  SAVEPOINT active_record_1
  Book Destroy (0.2ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.0ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

Test Log Summary:

* Author (i.e. model on the `has_many` side of the relationship) with one or more books cannot be removed. Both `destroy!` and `delete` methods raise `ActiveRecord::InvalidForeignKey`.
* Author with no books can be successfully removed with either `destroy!` or `delete` methods.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

If your system never needs to delete any instance of the model on the `has_many` side, then not specifying any `dependent` options is ok, otherwise, consider one of the other scenarios.

## Scenario 2: Belongs to not specified and Has Many Destroy

In this case, we leave the Book model with no dependent option, and specify `destroy` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :destroy
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Author model #{id} will be destroyed")
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
  Author Load (0.5ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "John Doe"], ["LIMIT", 1]]
  TRANSACTION (0.1ms)  SAVEPOINT active_record_1
  Book Load (0.4ms)  SELECT "books".* FROM "books" WHERE "books"."author_id" = ?  [["author_id", 3]]
  Author model 3 will be destroyed
  <span class="rails-log-delete">Author Destroy (0.5ms)  DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  TRANSACTION (0.1ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.4ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  TRANSACTION (0.1ms)  SAVEPOINT active_record_1
  Book Load (0.3ms)  SELECT "books".* FROM "books" WHERE "books"."author_id" = ?  [["author_id", 2]]
  Book model 4 will be destroyed
  Book Destroy (0.5ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 4]]
  Author model 2 will be destroyed
  Author Destroy (0.3ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 2]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
  TRANSACTION (0.0ms)  SAVEPOINT active_record_1
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."author_id" = ?  [["author_id", 1]]
  Book model 1 will be destroyed
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  Book model 2 will be destroyed
  Book Destroy (0.0ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 2]]
  Book model 3 will be destroyed
  Book Destroy (0.0ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 3]]
  Author model 1 will be destroyed
  Author Destroy (0.1ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.0ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "John Doe"], ["LIMIT", 1]]
  Author Destroy (0.5ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 3]]
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  Author Load (0.3ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  Author Destroy (0.7ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
  Author Destroy (0.5ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  Book Load (0.2ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  TRANSACTION (0.1ms)  SAVEPOINT active_record_1
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 4]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.0ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.0ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  TRANSACTION (0.1ms)  SAVEPOINT active_record_1
  Book Destroy (0.5ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  TRANSACTION (0.0ms)  RELEASE SAVEPOINT active_record_1
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book Destroy (1.5ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 4]]
  Author Count (0.3ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  Book Load (0.1ms)  SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book Destroy (0.3ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  Author Count (0.1ms)  SELECT COUNT(*) FROM "authors"
  Book Count (0.1ms)  SELECT COUNT(*) FROM "books"
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===
</code>
</pre>
</details>

Test log summary:

* Calling `destroy/destroy!` on Author model (`has_many` side of relationship) instance works to delete that author *and* also destroys each of the author's books. That is, each associated book has its `before_destroy` callback invoked, and then is deleted from the database with a SQL DELETE statement.
* Calling `delete` on Author model fails on foreign key constraint for author instances that have one or more associated books.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

## Scenario 3: Belongs to not specified and Has Many Delete All

In this case, we leave the Book model with no dependent option, and specify `delete_all` on the Author model:

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Book model #{id} will be destroyed")
  end
end

class Author < ApplicationRecord
  has_many :books, dependent: :delete_all
  before_destroy :one_last_thing
  def one_last_thing
    Rails.logger.warn("  Author model #{id} will be destroyed")
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
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.6ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 2]]
  Author model 2 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Author#destroy! remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Delete All (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."author_id" = ?</span>  [["author_id", 1]]
  Author model 1 will be destroyed
  <span class="rails-log-cyan">Author Destroy (0.1ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 3
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with no books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "John Doe"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 3]]
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 1; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with a single book ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Julian James McKinnon"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 2]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  <span class="rails-log-cyan">Author Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Author#delete remove an author with multiple books ===
  <span class="rails-log-cyan">Author Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?</span>  [["name", "Andrew Park"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Author Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "authors" WHERE "authors"."id" = ?</span>  [["id", 1]]
ActiveRecord::InvalidForeignKey - SQLite3::ConstraintException: FOREIGN KEY constraint failed
  <span class="rails-log-cyan">Author Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 0
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  Book model 4 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#destroy! remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.2ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  Book model 1 will be destroyed
  <span class="rails-log-cyan">TRANSACTION (0.1ms)</span>  <span class="rails-log-magenta">SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">TRANSACTION (0.0ms)</span>  <span class="rails-log-magenta">RELEASE SAVEPOINT active_record_1</span>
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that only has that book ===
  <span class="rails-log-cyan">Book Load (0.3ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Computer Programming Crash Course: 7 Books in 1"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.4ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 4]]
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

=== BEGIN TEST Book#delete remove a book from author that has multiple books ===
  <span class="rails-log-cyan">Book Load (0.1ms)</span>  <span class="rails-log-blue">SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?</span>  [["title", "Python Programming for Beginners"], ["LIMIT", 1]]
  <span class="rails-log-cyan">Book Destroy (0.3ms)</span>  <span class="rails-log-red">DELETE FROM "books" WHERE "books"."id" = ?</span>  [["id", 1]]
  <span class="rails-log-cyan">Author Count (0.1ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "authors"</span>
  <span class="rails-log-cyan">Book Count (0.0ms)</span>  <span class="rails-log-blue">SELECT COUNT(*) FROM "books"</span>
  NUMBER AUTHORS DELETED: 0; NUMBER BOOKS DELETED: 1
=== END TEST ===

</code>
</pre>
</details>

Test log summary:

* Calling `destroy/destroy!` on Author model (`has_many` side of relationship) instance works to delete that author *and* also directly deletes each of the author's books. That is, each associated book will be deleted via SQL DELETE statement but will *not* have its `before_destroy` callback invoked.
* Calling `delete` on Author model fails on foreign key constraint for author instances that have one or more associated books.
* Book instances (`belongs_to` side of relationship) can be destroyed or deleted with no errors and this action only affects the book, not the related author.

## TODO

* Something weird with BOOK COUNT in log - adding markdown-emphasis
* WIP: Starting with belongs_to/has_many pair (common use case, eg: Book belongs to Author, Author has many Books) - run through all scenarios in the matrix
* Nice to have: change margin-bottom amount on detail/summary element depending on open/closed state.
* Information hierarchy?
* Add Rails Guides sentence describing each option before trying it out.
* Cleanup Rails console output to only highlight the relevant parts
* Try to get to "orphaned records" warning as described in guide - what causes this?
* What about all the other association types - maybe too much for one blog post - do a multi part?
* Add aside: passing `-h` or `--help` to any generator command, eg: `bin/rails generate model -h` provides a complete guide to that generator. For example, wondering what are the valid data types for model attributes
* Link to companion project: https://github.com/danielabar/learn-associations
* Summarize all the results like when you want to use each? (maybe too complicated because it depends on requirements...)
* Conclusion para
* Title
* Description
* Related