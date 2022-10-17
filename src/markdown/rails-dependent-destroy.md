---
title: "A Deep Dive on ActiveRecord Dependent options"
featuredImage: "../images/enum-jake-hills-0hgiQQEi4ic-unsplash.jpg"
description: "TBD..."
date: "2023-03-01"
category: "rails"
related:
  - "Use UUID for primary key with Rails and Postgres"
  - "Fix Rails Blocked Host Error with Docker"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

[ref](https://guides.rubyonrails.org/association_basics.html#options-for-belongs-to-dependent)

## Setup

Try latest releases of [rails](https://rubygems.org/gems/rails/versions/7.0.4) and [Ruby](https://www.ruby-lang.org/en/downloads/releases/) as of 2022-10-13

```
rbenv install 3.1.2
rbenv local 3.1.2
gem install rails -v 7.0.4
rails new learn-associations
```

## Models

```bash
# simple model with no associations to demonstrate difference between destroy and delete
bin/rails generate model post title:string body:text

# models with associations
bin/rails generate model author name:string
bin/rails generate model book title:string published_at:date author:references
```

Seeds.rb:

```ruby
# Post is a simple model with no associations to demonstrate the difference between
# ActiveRecord methods destroy and delete
Post.create!(title: "Hello Post", body: "Learning about destroy and delete in Rails.")
Post.create!(title: "Another Post", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")

# Authors with at least one book each
author_ap = Author.create!(name: "Andrew Park")
author_jjk = Author.create!(name: "Julian James McKinnon")

# Author with no books in the system
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

p "Created #{Post.count} posts"
p "Created #{Author.count} authors"
p "Created #{Book.count} books"
```

```
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed
```

## Destroy vs Delete

One concept to clear up first. When looking at the various `dependent` options, the words "destroy" and "delete" show up in different options. These words sound the same but there is an important difference. Let's understand this with a simple model with no associations before moving on to more complicated cases.

Given a simple `Post` model:

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
  before_destroy :one_last_thing

  def one_last_thing
    puts "Post model #{id} will be destroyed just after this runs"
  end
end
```

TODO: Try without the destroy callback first - both methods appear to behave the same. Then add destroy callback to observe the difference.

TODO: Tidy up Rails console output to focus on the important concept.

```ruby
irb(main):001:0> p1 = Post.first
  Post Load (0.4ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."id" ASC LIMIT ?  [["LIMIT", 1]]
=>
#<Post:0x000000010b7a02e0
...
irb(main):002:0> p2 = Post.second
  Post Load (0.2ms)  SELECT "posts".* FROM "posts" ORDER BY "posts"."id" ASC LIMIT ? OFFSET ?  [["LIMIT", 1], ["OFFSET", 1]]
=>
#<Post:0x000000010ade95f8
...
irb(main):003:0> p1.destroy
Post model 1 will be destroyed just after this runs
  TRANSACTION (0.1ms)  begin transaction
  Post Destroy (0.7ms)  DELETE FROM "posts" WHERE "posts"."id" = ?  [["id", 1]]
  TRANSACTION (1.4ms)  commit transaction
=>
#<Post:0x000000010b7a02e0
 id: 1,
 title: "Hello Post",
 body: "Learning about destroy and delete in Rails.",
 created_at: Sun, 16 Oct 2022 11:46:36.164680000 UTC +00:00,
 updated_at: Sun, 16 Oct 2022 11:46:36.164680000 UTC +00:00>
irb(main):004:0> p2.delete
  Post Destroy (1.5ms)  DELETE FROM "posts" WHERE "posts"."id" = ?  [["id", 2]]
=>
#<Post:0x000000010ade95f8
 id: 2,
 title: "Another Post",
 body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 created_at: Sun, 16 Oct 2022 11:46:36.168748000 UTC +00:00,
 updated_at: Sun, 16 Oct 2022 11:46:36.168748000 UTC +00:00>
```

## Associations

Let's look at typical use case `belongs_to` and `has_many`. For example, Author has many books, and each book belongs to one author. Putting together all the `dependent` options (including not specifying it at all), yields a matrix:

| Scenario | belongs_to    | has_many                 |
|----------|---------------|--------------------------|
| 1        | not specified | not specified            |
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

### Scenario 1: dependent not specified on either side of relationship

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing

  def one_last_thing
    puts "Book model #{id} will be destroyed"
  end
end
```

```ruby
class Author < ApplicationRecord
  has_many :books
  before_destroy :one_last_thing

  def one_last_thing
    puts "Author model #{id} will be destroyed"
  end
end
```

Console, load an Author, then try to destroy - it calls the before_destroy callback, then attempts to delete the author, but then rolls back the transaction due to the foreign key constraint from books to authors:

```ruby
irb(main):001:0> a = Author.find_by(name: "Andrew Park")
  Author Load (0.2ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
=>
#<Author:0x00000001155b8130
...
irb(main):002:0> a.destroy
Author model 1 will be destroyed
  TRANSACTION (0.1ms)  begin transaction
  Author Destroy (0.8ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
  TRANSACTION (0.7ms)  rollback transaction
/Users/dbaron/.rbenv/versions/3.1.2/lib/ruby/gems/3.1.0/gems/sqlite3-1.5.3-x86_64-darwin/lib/sqlite3/statement.rb:108:in `step': SQLite3::ConstraintException: FOREIGN KEY constraint failed (ActiveRecord::InvalidForeignKey)
```

Trying to delete author with `a.delete` leads to same error, except it doesn't call the `before_destroy` callback.

How about destroy/delete a book? No problem - book records can be removed from the database with no errors.

```ruby
irb(main):001:0> b1 = Book.first
  Book Load (0.1ms)  SELECT "books".* FROM "books" ORDER BY "books"."id" ASC LIMIT ?  [["LIMIT", 1]]
=>
#<Book:0x0000000106951aa8
...
irb(main):002:0> b2 = Book.second
  Book Load (0.3ms)  SELECT "books".* FROM "books" ORDER BY "books"."id" ASC LIMIT ? OFFSET ?  [["LIMIT", 1], ["OFFSET", 1]]
=>
#<Book:0x0000000105ee27c0
...
irb(main):003:0> b1.destroy
Book model 1 will be destroyed
  TRANSACTION (0.1ms)  begin transaction
  Book Destroy (0.4ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  TRANSACTION (1.3ms)  commit transaction
=>
#<Book:0x0000000106951aa8
 id: 1,
 title: "Python Programming for Beginners",
 published_at: Wed, 20 Jul 2022,
 author_id: 1,
 created_at: Mon, 17 Oct 2022 10:38:06.070095000 UTC +00:00,
 updated_at: Mon, 17 Oct 2022 10:38:06.070095000 UTC +00:00>
irb(main):004:0>
irb(main):005:0> b2.delete
  Book Destroy (1.7ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 2]]
=>
#<Book:0x0000000105ee27c0
 id: 2,
 title: "Machine Learning: 4 Books in 1",
 published_at: Mon, 20 Jan 2020,
 author_id: 1,
 created_at: Mon, 17 Oct 2022 10:38:06.074186000 UTC +00:00,
 updated_at: Mon, 17 Oct 2022 10:38:06.074186000 UTC +00:00>
```

### Scenario 2: belongs_to not specified, has_many destroy

```ruby
class Author < ApplicationRecord
  has_many :books, dependent: :destroy
  before_destroy :one_last_thing
  def one_last_thing
    puts "Author model #{id} will be destroyed"
  end
end
```

```ruby
class Book < ApplicationRecord
  belongs_to :author
  before_destroy :one_last_thing
  def one_last_thing
    puts "Book model #{id} will be destroyed"
  end
end
```

Destroy author with multiple books - first destroys all the author's books, then destroys author. `author.delete` behaves similarly except doesn't invoke `before_destroy` callback.

Notice it deletes the author's books one DELETE statement at a time because its going to invoke `before_destroy` callback for each. Even if the Book model did not declare a `before_destroy` callback, it will still execute multiple DELETE statements, one for each associated model. Think about this for performance.

```ruby
irb(main):001:0> a = Author.find_by(name: "Andrew Park")
  Author Load (0.2ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
=> #<Author:0x000000010c5f1600 id: 1, name: "Andrew Park", created_at: Sun, 16 Oct 2022 12:03:39.787684000 UTC +00:00, updated_at: Sun, 16 Oct 2022 12:03:39.787684000 UTC +00:00>
irb(main):003:0> a.destroy
Book model 1 will be destroyed just after this runs
  TRANSACTION (0.1ms)  begin transaction
  Book Destroy (0.5ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
Book model 2 will be destroyed just after this runs
  Book Destroy (0.1ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 2]]
Book model 3 will be destroyed just after this runs
  Book Destroy (0.1ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 3]]
Author model 1 will be destroyed just after this runs
  Author Destroy (0.1ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
  TRANSACTION (1.8ms)  commit transaction
```

Destroy a book - only destroys that book:

```ruby
irb(main):001:0> b = Book.first
  Book Load (0.1ms)  SELECT "books".* FROM "books" ORDER BY "books"."id" ASC LIMIT ?  [["LIMIT", 1]]
=>
#<Book:0x00000001134717b0
...
irb(main):002:0> b.author
  Author Load (0.3ms)  SELECT "authors".* FROM "authors" WHERE "authors"."id" = ? LIMIT ?  [["id", 1], ["LIMIT", 1]]
=> #<Author:0x0000000113383fd8 id: 1, name: "Andrew Park", created_at: Sun, 16 Oct 2022 12:08:29.779841000 UTC +00:00, updated_at: Sun, 16 Oct 2022 12:08:29.779841000 UTC +00:00>
irb(main):003:0> b.destroy
Book model 1 will be destroyed just after this runs
  TRANSACTION (0.1ms)  begin transaction
  Book Destroy (0.5ms)  DELETE FROM "books" WHERE "books"."id" = ?  [["id", 1]]
  TRANSACTION (1.4ms)  commit transaction
=>
#<Book:0x00000001134717b0
 id: 1,
 title: "Python Programming for Beginners",
 published_at: Wed, 20 Jul 2022,
 author_id: 1,
 created_at: Sun, 16 Oct 2022 12:08:29.801399000 UTC +00:00,
 updated_at: Sun, 16 Oct 2022 12:08:29.801399000 UTC +00:00>
```

### Scenario 3: belongs_to not specified, has_many delete_all

```ruby
class Author < ApplicationRecord
  has_many :books, dependent: :delete_all
  before_destroy :one_last_thing
  def one_last_thing
    puts "Author model #{id} will be destroyed"
  end
end
```

Book model is the same as before.

Load an author with multiple books and then call `author.destroy`. This time it deletes all the author's books in a single DELETE statement and does not invoke the book model's `before_destroy` callback. It does however invoke the author's `before_destroy` callback because we called `author.destroy`:

```ruby
irb(main):001:0> a = Author.find_by(name: "Andrew Park")
  Author Load (0.2ms)  SELECT "authors".* FROM "authors" WHERE "authors"."name" = ? LIMIT ?  [["name", "Andrew Park"], ["LIMIT", 1]]
=> #<Author:0x00000001124f80b8 id: 1, name: "Andrew Park", created_at: Mon, 17 Oct 2022 10:53:00.772059000 UTC +00:00, updated_at: Mon, 17 Oct 2022 10:53:00.772059000 UTC +00:00>
irb(main):002:0> a.destroy
  TRANSACTION (0.1ms)  begin transaction
  Book Delete All (0.5ms)  DELETE FROM "books" WHERE "books"."author_id" = ?  [["author_id", 1]]
Author model 1 will be destroyed
  Author Destroy (0.1ms)  DELETE FROM "authors" WHERE "authors"."id" = ?  [["id", 1]]
  TRANSACTION (0.9ms)  commit transaction
```

### belongs_to

Each instance of declaring model "belongs to" one instance of the other model.

[Options for belongs_to](https://guides.rubyonrails.org/association_basics.html#options-for-belongs-to) re: `dependent`

* not specified
* `:destroy`, when the object is destroyed, destroy will be called on its associated objects.
* `:delete`, when the object is destroyed, all its associated objects will be deleted directly from the database without calling their destroy method.


### has_one

Skipping this for now to focus on belongs_to/has_many

[Options for has_one](https://guides.rubyonrails.org/association_basics.html#options-for-has-one) re: `dependent`

* not specified
* `:destroy` causes the associated object to also be destroyed
* `:delete` causes the associated object to be deleted directly from the database (so callbacks will not execute)
* `:nullify` causes the foreign key to be set to NULL. Polymorphic type column is also nullified on polymorphic associations. Callbacks are not executed.
* `:restrict_with_exception` causes an ActiveRecord::DeleteRestrictionError exception to be raised if there is an associated record
* `:restrict_with_error` causes an error to be added to the owner if there is an associated object

### has_many

[Options for has_many](https://guides.rubyonrails.org/association_basics.html#options-for-has-many) re: `dependent`

* not specified
* `:destroy` causes all the associated objects to also be destroyed
* `:delete_all` causes all the associated objects to be deleted directly from the database (so callbacks will not execute)
* `:nullify` causes the foreign key to be set to NULL. Polymorphic type column is also nullified on polymorphic associations. Callbacks are not executed.
* `:restrict_with_exception` causes an ActiveRecord::DeleteRestrictionError exception to be raised if there are any associated records
* `:restrict_with_error` causes an error to be added to the owner if there are any associated objects

### has_many :through

### has_one :through

### has_and_belongs_to_many

## TODO

* Intro para: Want to understand all the dependent options on ActiveRecord associations. Before GDPR/privacy days, would just never delete anything, but now, may be legally required therefore have to think about impact of deletion and maintaining referential integrity.
* First, discuss difference between delete and destroy (simple model with no associations) [SO](https://stackoverflow.com/questions/22757450/difference-between-destroy-and-delete)
* Information hierarchy?
* Starting with belongs_to/has_many pair (common use case, eg: Book belongs to Author, Author has many Books) - run through all scenarios in the matrix
* Cleanup Rails console output to only highlight the relevant parts
* Try to get to "orphaned records" warning as described in guide - what causes this?
* What about all the other association types - maybe too much for one blog post - do a multi part?
* Add aside: passing `-h` or `--help` to any generator command, eg: `bin/rails generate model -h` provides a complete guide to that generator. For example, wondering what are the valid data types for model attributes
* Link to companion project: https://github.com/danielabar/learn-associations
* Conclusion para
* Description
* Related