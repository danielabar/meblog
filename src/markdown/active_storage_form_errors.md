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

## Demo Project Setup

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

## Happy Path

Let's explore how Active Storage works as part of the form submission when all is well.

Since the scaffold generator also added the standard CRUD routes for the `ExpenseReport` model, we can start the Rails server, and navigate to `http://localhost:3000/expense_reports/new` to create a new expense report:

![active storage new expense report](../images/active-storage-new-expense-report.png "active storage new expense report")

Here's the form filled in with valid values and an attachment selected for the receipt:

![active storage new expense report filled](../images/active-storage-new-expense-report-filled.png "active storage new expense report filled")

TODO: Explain that's the native file picker as a result of `file_field` form helper, clicking "Choose File" launches a file selection dialog on the user's computer.

Submitting the form will pause on the `debugger` breakpoint in the `ExpenseReportsController#create` method, just after the model has been successfully saved. You should see something like the following in the terminal where the Rails server was started:

![active storage debug create success](../images/active-storage-debug-create-success.png "active storage debug create success")

In the debug session, we can inspect the `blob` which is the file details associated with the expense report `receipt` attachment. Notice it has `id`, `key`, and `filename` attributes. Also notice we can invoke the `signed_id` method on it (you'll see why this is important shortly):

TODO: Also explain attached? and persisted?

```ruby
@expense_report.receipt.blob
# <ActiveStorage::Blob:0x000000012657eb18
#  id: 1,
#  key: "6081val5vwpz691v8ukv8tc4zma0",
#  filename: "receipt-1.pdf",
#  content_type: "application/pdf",
#  metadata: {"identified" => true, "analyzed" => true},
#  service_name: "local",
#  byte_size: 7171,
#  checksum: "PnVMB8Sc/us7Jy4wxuy07w==",
#  created_at: "2025-03-21 12:46:13.604118000 +0000">

@expense_report.receipt.blob.signed_id
# "eyJfcmFpbHMiOnsiZGF0YSI6MSwicHVyIjoiYmxvYl9pZCJ9fQ==--42eb19d188a21278e0c6add2449a511283e28afe"

@expense_report.receipt.attached?
# true

@expense_report.receipt.persisted?
# false

# let the request continue to get out of debug session
continue
```

Since the `@expense_report` model was saved successfully, the controller redirects to the show view for this expense report. The show view has a link to edit, which navigates to `http://localhost:3000/expense_reports/1/edit`. This renders the shared form partial `app/views/expense_reports/_form.html.erb`, which now renders a download link for the receipt we just attached:

![active storage edit expense report](../images/active-storage-edit-expense-report.png "active storage edit expense report")

Recall we modified the form partial earlier to show the download link if one is attached with this code:

```erb
<!-- app/views/expense_reports/_form.html.erb -->
<% if expense_report.receipt.attached? %>
  <div class="mt-2">
    <strong class="block font-medium mb-1">Current Receipt:</strong>
    <%= link_to expense_report.receipt.filename, expense_report.receipt, class: "text-gray-700 underline hover:no-underline" %>
  </div>
<% end %>
```

If you right-click on the download link and select "Copy Link Address", it looks like this - notice the part just before the file name is the same value as what was returned from the `signed_id` method earlier in our debug session:
`http://localhost:3000/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MSwicHVyIjoiYmxvYl9pZCJ9fQ==--42eb19d188a21278e0c6add2449a511283e28afe/receipt-1.pdf`

Now let's start a database session with `bin/rails db` and see what got saved in the active storage database tables:

```
sqlite> select id, key, filename, content_type from active_storage_blobs;
id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf

sqlite> select * from active_storage_attachments;
id  name     record_type    record_id  blob_id  created_at
--  -------  -------------  ---------  -------  --------------------------
1   receipt  ExpenseReport  1          1        2025-03-21 12:46:13.604834

sqlite> select id, amount, description, incurred_on from expense_reports;
id  amount  description                incurred_on
--  ------  -------------------------  -----------
1   123.45  Uber trip to the airport.  2025-03-21
```

That `id`, `key`, and `filename` in the `active_storage_blobs` table matches what we saw in the debug session when inspecting `@expense_report.receipt.blob`.

The `active_storage_attachments` associates that blob to the expense report record with id of `1`, which we can see is the expense report we just created.

But where is the actual file? The answer to this can be found in `config/storage.yml`. This file automatically got created earlier when running `rails new...`:

```yml
test:
  service: Disk
  root: <%= Rails.root.join("tmp/storage") %>

local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

# amazon:
#   service: S3
#   access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
#   secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
#   region: us-east-1
#   bucket: your_own_bucket-<%= Rails.env %>

# other cloud storage providers...
```

Since we're running locally, the uploaded files can be found in the `storage` directory in the project root. When using sqlite3, Rails also happens to store the development and test databases in this directory. To view only the active storage contents, we can use [tree](https://formulae.brew.sh/formula/tree#default) and filter out the database files:

```
tree storage -I "*.sqlite3*|*sqlite3*|*/.*" --prune

storage
└── 60
    └── 81
        └── 6081val5vwpz691v8ukv8tc4zma0
```

That leaf entry `6081val5vwpz691v8ukv8tc4zma0` is the actual pdf file. Notice that the file name matches the `key` stored in `active_storage_blobs` table. It's also the `key` value we saw when inspecting `@expense_report.receipt.blob` earlier in the debug session.

Going through this happy path has demonstrated that in order for an Active Storage attachment to be saved successfully, the following three things must be true:

1. File uploaded to storage service (locally, this is the `storage` directory in the project root).
2. New record inserted in database table `active_storage_blobs` with the `key` matching the file name uploaded to storage.
3. New record inserted in database table `active_storage_attachments` that associated the model (which also got saved in the database) to the blob, which represents the file.

## Model Validation Errors

Now that we understand what Active Storage does in the success case, it's time to look at what happens when things go wrong. Specifically, what happens when the form is submitted with an attachment, but with one or more validation errors in the other form fields?

For this demo, the `debugger` statement is moved to the `else` clause in the `ExpenseController#create` method, so we can inspect what the receipt blob looks like when the model failed validation:

```ruby
class ExpenseReportsController < ApplicationController
  # ...

  def create
    @expense_report = ExpenseReport.new(expense_report_params)

    respond_to do |format|
      if @expense_report.save
        format.html { redirect_to @expense_report, notice: "Expense report was successfully created." }
      else
        debugger # === ADDED BREAKPOINT HERE ===
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end
  # ...
end
```

Since the `ExpenseReport` model requires the description field to be filled in, let's try to submit another expense report with another attachment `receipt-2.pdf`, leaving description blank:

![active storage new expense report description empty](../images/active-storage-new-expense-report-description-empty.png "active storage new expense report description empty")

Once again submitting the form will launch us into a debug session, but this time, `@expense_report.save` returned `false` due to a validation error (because `description` is required, but was not provided).

TODO: Move this to **Observations:** section just after the debug output (and do the same with previous debug session)

This time we can see that there is a blob with a `key` in memory, and it has a reference to the `filename` the user uploaded. However it's not persisted - notice the `id` and `created_at` attributes are `nil`. Also notice if we try to invoke the `signed_id` method on the blob, an error is raised that it's not possible to have a signed_id on a new record. We'll see why this is important shortly when observing what happens in the UI.

Another interesting observation is that `@expense_report.receipt.attached?` returns `true` even though the blob isn't actually persisted. So this just means that the user is attempting to attach a file.

```ruby
@expense_report.receipt.blob
<ActiveStorage::Blob:0x00000001247b3890
 id: nil,
 key: "6pyvo9nv8tl81rh8wl3ykkcu6d5e",
 filename: "receipt-2.pdf",
 content_type: "application/pdf",
 metadata: {"identified" => true},
 service_name: "local",
 byte_size: 42223,
 checksum: "IO+1GEvBwGHnvuy0kYIpzw==",
 created_at: nil>

@expense_report.receipt.blob.signed_id
# eval error: Cannot get a signed_id for a new record
# nil

@expense_report.receipt.attached?
# true

@expense_report.receipt.persisted?
# false

# let the request continue to get out of debug session
continue
```

Before turning our attention to what happens in the UI, let's launch another database session `bin/rails db` and observe that there are no new entries in the active storage tables:

```
# No new blobs - this is the previous happy path
sqlite> select id, key, filename, content_type from active_storage_blobs;
id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf

# No new expense reports - this is the previous happy path
sqlite> select id, amount, description, incurred_on from expense_reports;
id  amount  description                incurred_on
--  ------  -------------------------  -----------
1   123.45  Uber trip to the airport.  2025-03-21

# No new attachments - since there's no new blob or expense report to associate
# This record is from the previous happy path
sqlite> select * from active_storage_attachments;
id  name     record_type    record_id  blob_id  created_at
--  -------  -------------  ---------  -------  --------------------------
1   receipt  ExpenseReport  1          1        2025-03-21 12:46:13.604834
```

We can also check the `storage` directory in the project root and observe that there are no new files uploaded, even though the user did attempt to upload a new file `receipt-2.pdf`:

```
tree storage -I "*.sqlite3*|*sqlite3*|*/.*" --prune

storage
└── 60
    └── 81
        └── 6081val5vwpz691v8ukv8tc4zma0
```

Normally when there is a model validation error on create, the expected result is that the new view renders the form again, displaying the validation errors. Any data the user had entered into the form fields is preserved. However, in this case, an error page is displayed:

![active storage new expense report error](../images/active-storage-new-expense-report-error.png "active storage new expense report error")

The Rails server output also shows the error:

```
ActionView::Template::Error (Cannot get a signed_id for a new record)
Caused by: ArgumentError (Cannot get a signed_id for a new record)

Information for: ActionView::Template::Error (Cannot get a signed_id for a new record):
    40:     <% if expense_report.receipt.attached? %>
    41:       <div>
    42:         <strong>Current Receipt:</strong>
    43:         <%= link_to expense_report.receipt.filename, expense_report.receipt %>
    44:       </div>
    45:     <% end %>
    46:   </div>

app/views/expense_reports/_form.html.erb:43
```

We saw in the debug session that `expense_report.receipt.attached?` is truthy, even though the attachment didn't actually get associated to the model. This means the view code will attempt to generate a download link `<%= link_to expense_report.receipt.filename, expense_report.receipt %>`. But in order to do this, it needs a `signed_id` for the file, which isn't available because the file isn't actually uploaded or associated with the model.

The next sections will walk through how to solve this.

## 1. Check Persisted

The most immediate problem to be solved is to not render the 500 Server Error page, so at the very least, the user can continue to interact with the form. From our earlier debug session, we saw that while `expense_report.receipt.attached?` returned true when an attachment had been attempted but the form had not been saved, `expense_report.receipt.persisted?` returned false.

Let's switch the portion of the form partial that attempts to render a download link to the receipt to check for `persisted?` rather than `attached?`:

```erb
<%= form_with(model: expense_report, class: "contents") do |form| %>
  <!-- form fields... -->

  <!-- Receipt Attachment -->
  <div>
    <%= form.label :receipt %>
    <%= form.file_field :receipt %>

    <%# Display to user their current attachment if there is one %>
    <%# === CHANGE CHECK TO PERSISTED HERE === %>
    <% if expense_report.receipt.persisted? %>
      <div>
        <strong>Current Receipt:</strong>
        <%= link_to expense_report.receipt.filename, expense_report.receipt %>
      </div>
    <% end %>
  </div>

  <!-- submit -->
<% end %>
```

Now we can again try to create a new expense report, with a receipt, and blank description. This time when the form is submitted, it will render in an error state, showing that the Description must be provided, i.e. classic Rails CRUD behavior. And it will not attempt to render a download link to the receipt because there isn't one:

![active storage new expense report upload lost](../images/active-storage-new-expense-report-upload-lost.png "active storage new expense report upload lost")

But this exposes a new problem - the user's upload has been lost. This is unlike the other form fields that Rails was able to remember what user previously filled in (amount and incurred_on date). In order to proceed, the user needs to fill in the Description field *and* select the receipt from their file system again. It would be nice if we could remember the file they were trying to upload, just like all the other form fields that were remembered.

## 2. Direct Upload

This leads us to the next part of the solution. By default when using Active Storage, all the activity, including uploading the file to the storage service, and writing the corresponding records in the active storage tables is initiated in a single request from user submitting the form.

However, there is an alternative approach which is to enable [Direct Uploads](https://guides.rubyonrails.org/active_storage_overview.html#direct-uploads). In this case, when a form with an attachment is submitted, client side JavaScript will be used to upload the file to the storage service. It will also write the corresponding record in the `active_storage_blobs` table for this file.

TODO: Confusing wording
TODO: Add something about 2 of the 3 things that need to be in place are done by Direct Upload, even if form validation has failed.

This means that even if the model doesn't get saved due to a validation error, the file upload will have completed successfully. Although it won't be associated with the model (i.e. there won't be any new record in `active_storage_attachments`), this means the `signed_id` is available. This means it can be submitted as a hidden field in the form, and the next time the user submits the form successfully (i.e. fixes their validation errors), then Rails will be able to associate the attachment with the model, without the user having to select it from their file system again.

Next up:
* Explain since direct upload is a javascript feature, enabling it depends on what build system/asset pipeline etc you're using. Link to two doc sources (details in `expense_tracker/docs/notes.md`)
* Show how I did it on Rails 8.0.2 with propshaft and importmaps
* Demo submitting form with upload and validation error
  * this time debug session try ot call signed_id - it works!
  * also notice new file in storage and `active_storage_blobs`
* Now we're in a good position because we have the signed_id
* Lead to part 3 of solution to submit hidden field signed_id when attached but not persisted (which means user attempted an upload but it didn't get associated to the model because model save had validation errors)

## TODO
* WIP main content
* conclusion para
* edit
* verify all links
* aside/assumption: reader knows what active storage is, link to guides, also reader is familiar with rails concepts such as database migrations, models, views, and controllers
* link to demo repo on GitHub
* active storage config: by default, development uses the local file system which will be at `storage` dir in project root (contents are gitignored), for production and other deployed environments, would configure a service such as AWS S3 or Cloudflare R2
* aside: a real application would have user authentication to ensure each user only has access to their own expense reports
* link to scaffold generator for those unfamiliar - very useful to quickly get end to end functionality for a given model, try to find official rails guides/docs on this.
* aside: using tailwindcss but have removed classes from erb snippets to focus on attachment issue
* aside: debug gem included by default in Rails projects (or you can add it if don't already have it), reference: https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
* aside when debugging: use `bin/rails s` rather than `bin/dev` - reason?
* better definition of `blob`
* explanation of `signed_id` when showing right-click -> copy link address on file download link
* aside in direct uploads section - good practice in any case to avoid slow clients typing up a puma thread
* aside in direct uploads section for purging unattached blobs which could happen if user abandons the form after validation error: https://guides.rubyonrails.org/v7.2/active_storage_overview.html#purging-unattached-uploads
* replace `UI` with user interface or form or view or something like that
* bonus section about sqlite and pretty format, default query output is hard to read, solution:
```bash
# create sqlite config file in home directory
touch ~/.sqliterc

# edit it with your editor of choice, I'm using VSCode
c ~/.sqliterc
```
Enter the following:
```
.headers on
.mode column
```
