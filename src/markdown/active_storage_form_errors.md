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

Rails' Active Storage is a powerful, built-in solution for handling file uploads, providing integration with cloud storage and automatic attachment management. It works out of the box, making it easy to associate files with models. However, when a form includes an attachment and validation errors occur, the uploaded file is lost when the form re-renders to display the validation errors, forcing users to select their file again.

This happens because Active Storage only associates a file with a model after a successful save. If the model fails validation, the attachment is not persisted, and the file selection is lost.

This post will provide a step-by-step solution using direct uploads, hidden signed IDs, and a better file input with Stimulus. By the end, you'll have a robust way to ensure users never lose their file uploads due to form validation errors.

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
    <%= link_to expense_report.receipt.filename, expense_report.receipt %>
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

## Validation Errors

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
<%= form_with(model: expense_report) do |form| %>
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

However, an alternative approach is to enable [Direct Uploads](https://guides.rubyonrails.org/active_storage_overview.html#direct-uploads). In this case, when a form with an attachment is submitted, client side JavaScript will be used to upload the file to the storage service. It will also write the corresponding record in the `active_storage_blobs` table for this file.

Since Direct Uploads is a JavaScript feature, the steps to enable it depend on what build system your project is using. The demo project is using Rails 8 with Propshaft and Importmaps so the steps are to add an entry to the import maps and initialize Active Storage in the application's JavaScript:

```ruby
# config/importmap.rb
pin "@rails/activestorage", to: "activestorage.esm.js"
```

```javascript
// app/javascript/application.js
import * as ActiveStorage from "@rails/activestorage";
ActiveStorage.start();
```

Instructions for other setups can be found in the [Rails Guide on Active Storage](https://guides.rubyonrails.org/active_storage_overview.html#direct-uploads) and the [API Documentation](https://api.rubyonrails.org/files/activestorage/README_md.html).

With that in place, we can specify `direct_upload: true` when using the `file_field` helper in the form partial:

```erb
<%= form_with(model: expense_report) do |form| %>
  <!-- form fields... -->

  <!-- Receipt Attachment -->
  <div>
    <%= form.label :receipt %>

    <!-- === USE DIRECT UPLOAD HERE === -->
    <%= form.file_field :receipt, direct_upload: true %>

    <%# Display to user their current attachment if there is one %>
    ...
  </div>

  <!-- submit -->
<% end %>
```

After restarting the Rails server, we can once again attempt to submit an expense with `receipt2.pdf` attachment, but description field left blank:

![active storage new expense report description empty](../images/active-storage-new-expense-report-description-empty.png "active storage new expense report description empty")

Recall we still have a breakpoint in the failure case - which it will stop on because the model is invalid:

```ruby
class ExpenseReportsController < ApplicationController
  # ...

  def create
    @expense_report = ExpenseReport.new(expense_report_params)

    respond_to do |format|
      if @expense_report.save
        format.html { redirect_to @expense_report, notice: "Expense report was successfully created." }
      else
        debugger # === BREAKPOINT WHEN MODEL INVALID ===
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end
  # ...
end
```

Here we are in the debug session after submitting the form. This time when inspecting the receipt blob, there's a significant difference from before direct upload was enabled: The blob has an `id` and we can invoke the `signed_id` method on it successfully!

```ruby
# === HAS AN ID! ===
@expense_report.receipt.blob
#<ActiveStorage::Blob:0x000000016341c800
#  id: 2,
#  key: "8gxcs3hkovtiapbmrjx0f32ejqhy",
#  filename: "receipt-2.pdf",
#  content_type: "application/pdf",
#  metadata: {"identified" => true},
#  service_name: "local",
#  byte_size: 42223,
#  checksum: "IO+1GEvBwGHnvuy0kYIpzw==",
#  created_at: "2025-03-25 13:01:01.188138000 +0000">

# === SIGNED_ID WORKS! ===
@expense_report.receipt.blob.signed_id
# "eyJfcmFpbHMiOnsiZGF0YSI6MiwicHVyIjoiYmxvYl9pZCJ9fQ==--cb69cfd5043d24d8af9c289739183e40974271c6"

@expense_report.receipt.attached?
# true

@expense_report.receipt.persisted?
# false
```

In a database session `bin/rails db` - this time, `receipt-2.pdf` has been added to `active_storage_blobs` with `id` of `2`, which matches what was shown in the debug session for `@expense_report.receipt.blob`. There are no new records in `active_storage_attachments` or `expense_reports` because the model wasn't saved, but at least, the receipt blob did get saved:

```
=== NEW BLOB GOT SAVED ===
sqlite> select id, key, filename, content_type from active_storage_blobs;

id  key                           filename       content_type
--  ----------------------------  -------------  ---------------
1   6081val5vwpz691v8ukv8tc4zma0  receipt-1.pdf  application/pdf
2   8gxcs3hkovtiapbmrjx0f32ejqhy  receipt-2.pdf  application/pdf
```

The `storage` directory, shows a new file with the `receipt-2.pdf` key of `8gxcs3hkovtiapbmrjx0f32ejqhy` was uploaded:

```
tree storage -I "*.sqlite3*|*sqlite3*|*/.*" --prune
storage
├── 60
│   └── 81
│       └── 6081val5vwpz691v8ukv8tc4zma0
└── 8g
    └── xc
        └── 8gxcs3hkovtiapbmrjx0f32ejqhy
```


Recall earlier when walking through the Happy Path, we learned that three things need to be true for an attachment to be successfully saved:

1. File uploaded to storage service (locally, this is the `storage` directory in the project root).
2. New record inserted in database table `active_storage_blobs` with the `key` matching the file name uploaded to storage.
3. New record inserted in database table `active_storage_attachments` that associated the model (which also got saved in the database) to the blob, which represents the file.

By enabling Direct Uploads, the first two of these have completed, even when the model couldn't be saved due to validation errors, this is progress!

Back in the UI, it still displays the same error message as before wrt missing Description, and the user still needs to select their file again, but now we're in a good position to resolve this. This is described in the next step.

## 3. Hidden Signed ID

After enabling Direct Uploads, we learned that the attachment blob was created and we had access to it's `signed_id`. This means that the form can be modified to submit this `signed_id` as a hidden field, and if present, Rails will associate the previously uploaded file to the ExpenseReport model upon the next successful form submission. This means the user only needs to correct their validation error (missing Description in our case), but they don't need to select the file from their file system again.

However, we only want to submit this hidden field in the case where `attached?` is true (meaning there was an attempt to attach a file), but `persisted?` is false, meaning the attachment wasn't associated to the model.

To implement this logic, add the following to the form partial:

```erb
<%= form_with(model: expense_report) do |form| %>
  <!-- other fields... -->

  <%= form.label :receipt %>
  <%= form.file_field :receipt, direct_upload: true %>

  <%# If the receipt is attached but not persisted it means user previously attempted to upload but encountered form validation errors %>
  <%# Let's hang on to that id for them in a hidden field so file will be persisted on next successful form submission %>
  <%# This works to reference signed_id because of enabling Active Storage Direct Uploads, the blob is there in the database and in the file system %>
  <% if expense_report.receipt.attached? && !expense_report.receipt.persisted?%>
    <%= form.hidden_field :receipt, value: expense_report.receipt.signed_id %>
  <% end %>

  <!-- submit. -->
<% end %>
```

Once again let's try the test case of submitting the form with an attachment, but description left blank. It will render with validation errors as expected, but this time, inspecting the DOM will show a hidden field is rendered containing the `signed_id` of the receipt upload:

```htm
<input
  value="eyJfcmFpbHMiOnsiZGF0YSI6MiwicHVyIjoiYmxvYl9pZCJ9fQ==--cb69cfd5043d24d8af9c289739183e40974271c6"
  autocomplete="off"
  type="hidden"
  name="expense_report[receipt]"
  id="expense_report_receipt">
```

As far as the user is concerned, the file upload still looks "lost" because the native file picker still displays "No file chosen". But things are different this time because we actually have a reference to the file upload via the hidden `signed_id` field:

![active storage new expense report upload hidden id](../images/active-storage-new-expense-report-upload-hidden-id.png "active storage new expense report upload hidden id")

We'll address the user display in the next step. But for now, if we update the description field with some value and submit the form again, it will be saved successfully, including associating to the file the user previously uploaded:

![active storage expense report saved with attachment after fix validation error](../images/active-storage-expense-report-saved-with-attachment-after-fix-validation-error.png "active storage expense report saved with attachment after fix validation error")

Checking in the database shows that the second expense report was saved (because we fixed the validation error), and it used the hidden `signed_id` field to associate the expense report with the `receipt-2.pdf` attachment user previously uploaded:

```
select * from active_storage_attachments;
id  name     record_type    record_id  blob_id  created_at
--  -------  -------------  ---------  -------  --------------------------
1   receipt  ExpenseReport  1          1        2025-03-21 12:46:13.604834
2   receipt  ExpenseReport  2          2        2025-03-21 12:50:14.151515

-- Earlier we saw that active_storage_blob with id of 2 is for receipt-2.pdf
```

At this point, we have the ability to hold on to a user's previously uploaded file and ensure it gets saved on the next successful form submission. But there's a UX issue - the native file picker displays as if no file is selected. This would confuse the user into thinking they need to select it again. The next section will cover how to solve this.

## 4. Custom File Input

The problem we need to solve now is that the form shows "No file chosen" beside the "Choose File" button, even when we do actually have the user's previous upload saved.

![active storage native file input no file chosen](../images/active-storage-native-file-input-no-file-chosen.png "active storage native file input no file chosen")

Earlier in a debug session, we saw that we do have access to the filename via the `@expense_report` model, even if it the model itself wasn't saved due to the validation error:

```ruby
# === FILE NAME IS POPULATED ===
@expense_report.receipt.blob
#<ActiveStorage::Blob:0x000000016341c800
#  id: 2,
#  key: "8gxcs3hkovtiapbmrjx0f32ejqhy",
#  filename: "receipt-2.pdf",
#  content_type: "application/pdf",
# ...
```

It would be nice if we could programmatically set the file selector's value in the form, since it's available via `@expense_report.receipt.blob.filename`. However, this won't work, because this is the native file picker.

Earlier when using the scaffold generator, we passed `receipt:attachment` as one of the model fields. Since we told Rails that receipt is an attachment, it used the [file_field](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-file_field) helper method inside of the [form_with](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-form_with) block in the form partial to generate an input for choosing a file:

```erb
<%= form_with(model: expense_report) do |form| %>
  <!-- other fields... -->

  <%= form.label :receipt %>
  <%= form.file_field :receipt, direct_upload: true %>

  <!-- submit -->
<% end %>
```

This renders markup as follows:

```htm
<form enctype="multipart/form-data" action="/expense_reports" method="post">
  <!-- other fields... -->

  <label for="expense_report_receipt">Receipt</label>
  <input type="file" name="expense_report[receipt]" id="expense_report_receipt">

  <!-- submit -->
</form>
```

`<input type="file"...>` is the browser native file picker. The MDN docs: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file have details on how it works. For our purposes, the important points to understand are:

* The file input type has a `value` attribute which defaults to an empty string.
* When `value` is empty, then "No file chosen" is displayed in the browser.
* After user has selected a file, the `value` attribute of the input is populated with the file name, and then the input updates to display the file name in the browser.
* The file information is also available in a `files` attribute which is a `FileList`.
* The `value` cannot be set programmatically to anything other than an empty string. It also has no effect when populated in the markup.

For example, trying to do something like this in JavaScript throws an exception:

```javascript
const input = document.querySelector("input[type=file]");
input.value = "receipt-2.pdf"

// Uncaught InvalidStateError:
//  Failed to set the 'value' property on 'HTMLInputElement':
//    This input element accepts a filename, which may only be
//    programmatically set to the empty string.
```

If user clicks the Choose File button and selects a file from their file system, then the input is populated as follows:

```javascript
// Use the UI to select a file, then run in Console tab of browser dev tools:
const input = document.querySelector("input[type=file]");

// Value always preceded with `fakepath` rather than actual file system path for security
input.value
//  'C:\\fakepath\\receipt-2.pdf'

// FileList is array-like object with a single entry for file user just selected
input.files
// FileList {0: File, length: 1}

// That FileList expanded looks something like this:
{
  0: File {
    name: "receipt-2.pdf",
    type: "application/pdf",
  },
  length: 1
}
```

This means that we'll have to hide the native file input (although keep it functional), and instead display a custom button and label to control the file name display. The button click will delegate to the native file input to perform the file selection. The display requirements are as follows:

1. If user has not selected a file, then display "No file chosen".
2. If user clicks the custom "Choose file" button and selects a file from their file system, then display the selected file name (i.e. same as native behaviour).
3. If the form renders with an attached, but not persisted receipt, then display the filename from the model: `expense_report.receipt.blob.filename`.

Let's modify the form partial for the additional markup needed:

```erb
<%= form_with(model: expense_report, class: "contents") do |form| %>
  <!-- other fields... -->

  <!-- receipt attachment-->
  <%= form.label :receipt %>

  <!-- logic we added earlier to preserve file if necessary -->
  <% if expense_report.receipt.attached? && !expense_report.receipt.persisted? %>
    <%= form.hidden_field :receipt, value: expense_report.receipt.signed_id %>
  <% end %>

  <!-- wrapper div for native file input and custom controls -->
  <div class="relative w-full">

    <!-- hide the native file input from display with css -->
    <!-- make it take up full width of container so it receives clicks -->
    <%= form.file_field :receipt,
          direct_upload: true,
          class: "opacity-0 absolute w-full" %>

    <!-- add a placeholder div to display "No file chosen" or selected file -->
    <div>
      <!-- will be filled in by JavaScript -->
    </div>

    <!-- button to display instead of hidden file input -->
    <button type="button">Choose File</button>
  </div>

  <!-- submit -->
<% end %>
```

**Explanation:**

* The native file picker is still present in the DOM but hidden from display with css
* A placeholder div has been added to display the file picker selection (which can "No file chosen" or filename user has selected or has saved from previous form submission with validation errors). This isn't functional at the moment, we'll get there soon.
* A button has been added with text "Choose File" to mimic the native file picker.
* A wrapper div is introduced with some css to allow the native file input to take up the full width of the container - this means even though it's hidden, it will receive the click event when the custom button is clicked.

At this point, the form looks like this:

![active storage markup for custom file input](../images/active-storage-markup-for-custom-file-input.png "active storage markup for custom file input")

Clicking the custom "Choose File" button launches the system file selector because it's rendered on top of the hidden native file input. However, the custom div to display either "No file chosen" or the selected filename isn't functional yet. And if the form is submitted with a validation error, that custom div isn't showing the file name user previously selected.

To make the custom file input functional, we'll need to add some JavaScript. [Stimulus](https://stimulus.hotwired.dev/handbook/introduction) is a minimal JavaScript framework integrated into Rails that helps enhance server-rendered pages. To get started, run the following command to generate a new Stimulus controller:

```bash
bin/rails generate stimulus file_upload
```

This generates the following JavaScript file:

```javascript
// app/javascript/controllers/file_upload_controller.js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="file-upload"
export default class extends Controller {
  connect() {
  }
}
```

Then update it to add the following code, explanation to follow:

```javascript
import { Controller } from "@hotwired/stimulus";

// Connects to: data-controller="file-upload"
export default class extends Controller {
  static targets = ["input", "fileNameContainer"];

  static values = {
    fileSelectionText: { type: String, default: "No file chosen" },
  };

  connect() {
    this.updateFileName();
  }

  updateFileName() {
    this.fileNameContainerTarget.textContent = this.fileSelectionTextValue;
  }

  // When user selects a new file, update the display based on the native file input selection
  handleNewFileSelection() {
    if (this.inputTarget.files.length > 0) {
      this.fileNameContainerTarget.textContent = this.inputTarget.files[0].name;
    } else {
      this.updateFileName(); // Reset display if no file selected
    }
  }
}
```

Here are the corresponding changes to the form partial, adding in data-dash attributes to connect it to the Stimulus controller:

```erb
<%= form_with(model: expense_report, class: "contents") do |form| %>
  <!-- other fields... -->

  <%# If a file is attached but not persisted, it means user submitted the form with a selected file but also had validation error(s) %>
  <%# If that's the case, we update the custom file input label with the file name from the model so user realizes we still have their file %>
  <div class="my-5"
      data-controller="file-upload"
      data-file-upload-file-selection-text-value="<%= expense_report.receipt.attached? && !expense_report.receipt.persisted? ? expense_report.receipt.blob.filename : "No file chosen" %>">
    <%= form.label :receipt %>

    <%# If the receipt is attached but not persisted it means user previously attempted to upload but encountered form validation errors %>
    <%# Let's hang on to that id for them in a hidden field so file will be persisted on next successful form submission %>
    <%# This works to reference signed_id because of enabling Active Storage Direct Uploads, the blob is there in the database and in the file system %>
    <% if expense_report.receipt.attached? && !expense_report.receipt.persisted? %>
      <%= form.hidden_field :receipt, value: expense_report.receipt.signed_id %>
    <% end %>

    <div >
      <%# Native file input (hidden but still functional) %>
      <%= form.file_field :receipt, direct_upload: true,
            data: { file_upload_target: "input", action: "change->file-upload#handleNewFileSelection" },
            class: "absolute w-full opacity-0" %>

      <%# Custom file input selector that will render on top of the hidden native file input %>
      <%# This allows us to target it with JavaScript to pre-populate a file name if user previously selected one %>
      <%# and then submitted the form with validation errors %>
      <div data-file-upload-target="fileNameContainer">
        <%# Label population is handled by JavaScript: app/javascript/controllers/file_upload_controller.js  %>
      </div>
      <button type="button" data-file-upload-target="button">
        Choose File
      </button>
    </div>

    <%# Display to user their current attachment if there is one %>
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

**Explanation:**

1. **File Name Display:** When the form is first rendered, we show "No file chosen" if no file is selected, or the name of the file that was previously selected.
2. **User Selection:** When the user selects a file using the hidden file input (triggered by clicking the custom "Choose File" button), the controller will update the display to show the selected file’s name.
3. **Handling Validation Errors:** If the form is re-rendered due to validation errors (e.g., the form failed to save), the controller will display the previously uploaded file’s name (from the model), or "No file chosen" if there was no file selected.

We accomplish this by using **Stimulus targets** to reference the parts of the page that need to be updated and **Stimulus values** to store the default text for the file name ("No file chosen"). When the user selects a file, we update the displayed file name accordingly.

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
* aside when debugging: use `bin/rails s` rather than `bin/dev` - reason? Procfile, debug port?
* better definition of `blob`
* explanation of `signed_id` when showing right-click -> copy link address on file download link
* better definition of what direct upload does?
* maybe show the ajax requests when direct upload is enabled and form is submitted
* aside in direct uploads section - good practice in any case to avoid slow clients typing up a puma thread
* aside in direct uploads section for purging unattached blobs which could happen if user abandons the form after validation error: https://guides.rubyonrails.org/v7.2/active_storage_overview.html#purging-unattached-uploads
* aside: beyond scope of this post to go in depth on stimulus, if not familiar, see my previous post on stimulus - link...
* replace `UI` with user interface or form or view or something like that
* fix erb comments - consistency
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
