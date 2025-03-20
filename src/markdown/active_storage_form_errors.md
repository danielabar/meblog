---
title: "Active Storage & Form Errors: Preventing Lost File Uploads in Rails"
featuredImage: "../images/rails-active-storage-form-validation-errorssteve-johnson-Kr8Tc8Rugdk-unsplash.jpg"
description: "Rails' Active Storage makes file uploads easy, but validation errors can cause attachments to be lost when forms re-render. This guide explains why and walks through a step-by-step solution using direct uploads, signed IDs, and Stimulus for an improved user experience."
date: "2025-07-01"
category: "rails"
related:
  - "Understanding ActiveRecord Dependent Options"
  - "Build a Rails App with Slack Part 1: OAuth"
  - "Some Elegance with Rails Caching"
---

Rails' Active Storage is a powerful, built-in solution for handling file uploads, providing integration with cloud storage and automatic attachment management. It works out of the box, making it easy to associate files with models. However, when a form includes an attachment and validation errors occur, the uploaded file is lost when the form re-renders, forcing users to select it again.

This happens because Active Storage only associates a file with a model after a successful save. If the model fails validation, the attachment is not persisted, and the file selection is lost.

This post will provide a step-by-step solution using direct uploads, signed IDs, and a better file input UI with Stimulus. By the end, you'll have a robust way to ensure users never lose their file uploads due to validation errors.

## Demo Project

To demonstrate the issue, we'll setup a new Rails project (as of this writing, I'm on Rails 8.0.2) for a simple expense tracker application. It will have one model `ExpenseReport` that users are required to fill out to get reimbursed for their expenses. The `ExpenseReport` model will have a single file attachment named `receipt` to allow user's to upload a scanned pdf or image of their expense.

The commands to get started are as follows:

```bash
# Create new rails application (defaults to sqlite database)
rails new expense_tracker

# Install dependencies and initialize database
bin/setup

# Initialize Active Storage
bin/rails active_storage:install
bin/rails db:migrate
```

The Active Storage installation generates a database migration to create two tables: `active_storage_blobs` to store information about the uploaded file, and `active_storage_attachments`, which associates the blob to a model.

TODO ASIDE: This can be any model in your application, which is accomplished via polymorphic association. Reference.

Now we can use the `scaffold` generator to generate a migration, model, controller, views, and route definitions for the `ExpenseReport` model, which has a dollar amount, description, date on which the expense was incurred, and a receipt, which is an attachment:

```bash
bin/rails g scaffold ExpenseReport \
  amount:decimal \
  description:text \
  incurred_on:date \
  receipt:attachment
```

Let's modify the generated migration to add some constraints to ensure amount, description, and incurred_on are always provided:

```ruby
class CreateExpenseReports < ActiveRecord::Migration[8.0]
  def change
    create_table :expense_reports do |t|
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.text :description, null: false
      t.date :incurred_on, null: false

      t.timestamps
    end
  end
end
```

The corresponding `ExpenseReport` model is also updated to have validation rules matching the database constraints:

```ruby
class ExpenseReport < ApplicationRecord
  has_one_attached :receipt

  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :description, presence: true
  validates :incurred_on, presence: true
end
```

Finally, the generated form partial `app/views/expense_reports/_form.html.erb` (which is used for both new and edit actions as per Rails conventions) is modified to display a download link to the attachment, if one exists. This provides a nicer user experience if user needs to edit their expense report, they can see the receipt that is currently attached:

```erb
<%= form_with(model: expense_report) do |form| %>
  <!-- other form fields... -->

  <div>
    <%= form.label :receipt %>
    <%= form.file_field :receipt %>

    <%# Display download link for current attachment if one exists %>
    <% if expense_report.receipt.attached? %>
      <div>
        <strong>Current Receipt:</strong>
        <%= link_to expense_report.receipt.filename, expense_report.receipt %>
      </div>
    <% end %>
  </div>

  <!-- submit -->
<% end %>
```

When the form is submitted for a new expense report, the `create` action in the controller will run. The only change I've made to the code is to add a `debugger` breakpoint just after a successful save. This will allow us to inspect the `@expense_report` model when the model and attachment have been successfully saved so we can understand what it looks like when all goes well:

```ruby
class ExpenseReportsController < ApplicationController
  # ...

  def create
    @expense_report = ExpenseReport.new(expense_report_params)

    respond_to do |format|
      if @expense_report.save
        debugger # === ADDED BREAKPOINT HERE ===
        format.html { redirect_to @expense_report, notice: "Expense report was successfully created." }
      else
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end
  # ...
end
```

Next - demo happy path with screenshots of app at that point in time and debug session of `@expense_report.receipt.blob`: https://github.com/danielabar/expense_tracker/blob/db487f9c8748b1b4ec95c052363801cddb1056d5/app/views/expense_reports/_form.html.erb.

Then show database and local file storage.

Brief mention need to run `bin/rails server` rather than `bin/dev` which uses Procfile, in order for debugger to attach.

## TODO
* WIP main content
* conclusion para
* edit
* aside/assumption: reader knows what active storage is, link to guides, also reader is familiar with rails concepts such as database migrations, models, views, and controllers
* link to demo repo on GitHub
* active storage config: by default, development uses the local file system which will be at `storage` dir in project root (contents are gitignored), for production and other deployed environments, would configure a service such as AWS S3 or Cloudflare R2
* aside: a real application would have user authentication to ensure each user only has access to their own expense reports
* link to scaffold generator for those unfamiliar - very useful to quickly get end to end functionality for a given model, try to find official rails guides/docs on this.
* aside: using tailwindcss but have removed classes from erb snippets to focus on attachment issue
* aside: debug gem included by default in Rails projects (or you can add it if don't already have it), reference: https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
