---
title: "Build a Rails App with Slack Part 4: Receive Modal Submission"
featuredImage: "../images/slack-feat-img-4-david-trinks-vHTWOMrQs7k-unsplash.jpg"
description: "Learn how to build a Slack application with Rails in this comprehensive multi-part series. Part 4 covers handling a modal submission action, saving the feedback to the database, and replying to the user with a private DM confirming their submission."
date: "2024-07-04"
category: "rails"
related:
  - "Capybara Webdriver Element not Clickable Resolved"
  - "Understanding ActiveRecord Dependent Options"
  - "Add Rubocop to an Existing Rails Project"
---

Welcome to the fourth installment of this multi-part series on building a Slack application with Rails. This series will guide you through the process of creating a Slack application with Rails and is structured as follows:

* [Part 1: Rails new, Slack, and OAuth](../rails-slack-app-part1-oauth)
* [Part 2: Slack Slash Command with Text Response](../rails-slack-app-part2-slash-command-with-text-response)
* [Part 3: Slack Slash Command with Modal Response](../rails-slack-app-part3-slash-command-with-modal-response)
* Part 4: Slack Action Modal Submission === YOU ARE HERE ===
* [Part 5: Slack Slash Command with Block Kit Response](../rails-slack-app-part5-slash-block-kit-response)

Feel free to jump to a specific part of interest using the links above or follow along sequentially. You can also checkout the [source code on Github](https://github.com/danielabar/retro-pulse) for the application we'll be building.

This post assumes the reader has at least a beginner level familiarity with Ruby on Rails. It's also assumed the reader has used [Slack](https://slack.com/) as an end user with basic interactions such as joining channels, sending messages, and participating in conversations.

Part 1 of this series introduced [Retro Pulse](../rails-slack-app-part1-oauth#introducing-retro-pulse), a Slack app built with Rails for agile teams to manage their retrospectives with Slack. [Part 2](../rails-slack-app-part2-slash-command-with-text-response) explained how to implement a Slack slash command to open a retrospective and return a markdown text response to the same Slack channel that initiated the request. [Part 3](../rails-slack-app-part3-slash-command-with-modal-response) covered how to implement a slash command that responds with a modal form, allowing the user to enter feedback for the retrospective.

Now in Part 4, we will learn how to handle the modal submission, save the user's feedback in the database, and reply back with a DM to the user letting them know their input has been received. The interaction looks like this:

In Part 3 we learned how to build this modal form in response to the `/retro-feedback` slash command:

![slack app demo retro feedback keep](../images/slack-app-demo-retro-feedback-keep.png "slack app demo retro feedback keep")

After submitting the form, the app responds with a direct message (DM) to the user confirming their feedback has been received:

![slack app demo retro feedback received](../images/slack-app-demo-retro-feedback-received.png "slack app demo retro feedback received")

## Comment Model

Before implementing the Slack portion of this, we need to ensure there's a place in the database to save the user's retrospective comments. In Part 2 of this series, we introduced the [Retrospective model](../rails-slack-ap-part2-slash-command-with-text-response#implement-slash-command), with `title` and `status` attributes:

```ruby
# == Schema Information
#
# Table name: retrospectives
#
#  id         :bigint           not null, primary key
#  status     :enum             default("open"), not null
#  title      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_retrospectives_on_title  (title) UNIQUE
#
class Retrospective < ApplicationRecord
  enum status: {
    open: "open",
    closed: "closed"
  }
  # ...
end
```

To save the user's feedback, let's add a `Comment` model that `belongs_to` a `Retrospective`. It has a `text` column to store the content, some columns to store the Slack user information, and a `boolean` to indicate if this comment should be anonymous. Here is the migration:

```ruby
class CreateComments < ActiveRecord::Migration[7.0]
  def change
    create_table :comments do |t|
      t.text :content, null: false
      t.boolean :anonymous, null: false, default: false
      t.string :slack_user_id
      t.string :slack_username
      t.references :retrospective, null: false, foreign_key: true

      t.timestamps
    end
  end
end
```

We also need to know what kind of comment this is, i.e. whether this is something the team should *keep* on doing, *stop* doing, or *try* something new for next time. Let's add a `category` column to the `comments` table as a [Postgres enum](../rails-enum-mysql-postgres):

```ruby
class AddCategoryToComments < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL.squish
      CREATE TYPE comment_category AS ENUM ('keep', 'stop', 'try');
    SQL
    add_column :comments, :category, :comment_category, default: "keep", null: false
  end

  def down
    remove_column :comments, :category
    execute <<-SQL.squish
      DROP TYPE comment_category;
    SQL
  end
end
```

After running the migrations with `bin/rails db:migrate`, the resulting `Comment` model is:

```ruby
# == Schema Information
#
# Table name: comments
#
#  id               :bigint           not null, primary key
#  anonymous        :boolean          default(FALSE), not null
#  category         :enum             default("keep"), not null
#  content          :text             not null
#  slack_username   :string
#  slack_user_id    :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  retrospective_id :bigint           not null
#
# Indexes
#
#  index_comments_on_retrospective_id  (retrospective_id)
#
# Foreign Keys
#
#  fk_rails_...  (retrospective_id => retrospectives.id)
#
class Comment < ApplicationRecord
  belongs_to :retrospective

  enum category: {
    keep: "keep",
    stop: "stop",
    try: "try"
  }
end
```

The retrospective model is also updated to indicate it `has_many` comments. The `dependent: :destroy` option is used because it ensures that when a `Retrospective` record is deleted, all associated `Comment` records belonging to that retrospective are also deleted. This prevents orphaned records by ensuring that comments tied to a specific retrospective are removed when the retrospective is no longer needed:

```ruby
# == Schema Information
#
# Table name: retrospectives
#
#  id         :bigint           not null, primary key
#  status     :enum             default("open"), not null
#  title      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_retrospectives_on_title  (title) UNIQUE
#
class Retrospective < ApplicationRecord
  has_many :comments, dependent: :destroy
  # ...
end
```

<aside class="markdown-aside">
If you want to learn more about all the ActiveRecord dependent options and how they affect removing associated models from the database, checkout this post I wrote on <a href="https://danielabaron.me/blog/activerecord-dependent-options/" class="markdown-link">Activerecord Dependent Options</a>.
</aside>

## Anonymous Enforcement

There's one more thing to handle in the `Comment` model. The requirements of this app are that if the user selects the Anonymous checkbox when filling out the feedback form:

![slack app feedback form callout anon](../images/slack-app-demo-retro-feedback-modal-callout-anon.png "slack app feedback form callout anon")

Then their Slack user id and name *should not* be persisted in the database. Otherwise if the feedback is not anonymous (i.e. user left the Anonymous checkbox unchecked), then their Slack user id and name *should* be persisted in the database. This will be used later when the team wants to discuss the retrospective feedback and the app displays all the feedback that has been submitted:

![slack app demo keep comments callout anon](../images/slack-app-demo-keep-comments-callout-anon.png "slack app demo keep comments callout anon")

To enforce this rule, a combination of `presence` and `absence` options can be passed to the ActiveRecord `validates` macro, together with conditional options:

```ruby
class Comment < ApplicationRecord
  validates :slack_user_id,
    absence: { message: "must be empty when anonymous is true" },
    if: :anonymous

  validates :slack_username,
    absence: { message: "must be empty when anonymous is true" },
    if: :anonymous

  validates :slack_user_id,
    presence: { message: "must be provided when anonymous is false" },
    unless: :anonymous

  validates :slack_username,
    presence: { message: "must be provided when anonymous is false" },
    unless: :anonymous

  # ...
end
```

However, the above validation rules will only be performed at the application level. Someone with direct database access would still be able to insert invalid data. To ensure data integrity at the database level, we can also add a [CHECK CONSTRAINT](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS) to the table. This can be done with the Rails migration method `add_check_constraint`. Here is the migration:

```ruby
class AddCheckConstraintForSlackInfoInComments < ActiveRecord::Migration[7.0]
  def change
    # If a comment is anonymous, then the slack info fields should be null.
    # If a comment is not anonymous, then the slack info fields should be populated.
    add_check_constraint(
      :comments,
      "(anonymous AND slack_user_id IS NULL AND slack_username IS NULL)
      OR
      (NOT anonymous AND slack_user_id IS NOT NULL AND slack_username IS NOT NULL)",
      name: "check_slack_info_if_not_anonymous"
    )
  end
end
```

<aside class="markdown-aside">
Are you interested in learning more about maintaining data correctness and consistency when working with Rails and PostgreSQL? The book <a class="markdown-link"
href="https://pragprog.com/titles/aapsql/high-performance-postgresql-for-rails/">High Performance PostgreSQL for Rails</a> is a comprehensive guide to optimizing your PostgreSQL database for use with Rails. From indexing and partitioning to advanced query optimization and database maintenance.
</aside>

Now that the `Comment` model is implemented, we can move on to handling the Slack form submission.

## Configure Slack Interactivity

When the user clicks the Submit button on the modal form we generated, Slack will send an [interaction payload](https://api.slack.com/messaging/interactivity) to the `request_url` that is configured as part of the Interactivity Settings of the app. We haven't configured this yet so let's go ahead and do that now.

Navigate to [Your Apps](https://api.slack.com/apps/) in Slack, select the "Retro Pulse" application, then select "Interactivity & Shortcuts" from the Features section:

![slack-app-interactivity-feature](../images/slack-app-interactivity-feature.png "slack-app-interactivity-feature")

Enable the interactivity toggle:

![slack app interactivity toggle](../images/slack-app-interactivity-toggle.png "slack app interactivity toggle")

Fill in your ngrok forwarding address in the Request URL field, and then `/api/slack/action`. This is the URL that Slack will POST a message to when the user submits the feedback modal. Recall we setup [ngrok in Part 1](../rails-slack-app-part1-oauth#ngrok) of this series:

![slack app interactivity enter url](../images/slack-app-interactivity-enter-url.png "slack app interactivity enter url")

As soon as you enter a valid URL, it will be saved automatically.

## Receive Form Submission in Rails

Now that the Slack app has been configured to POST the form submission to the Rails app (via Ngrok), we need to write a handler to receive this payload. In Part 2 of this series, we learned how to use the `slack-ruby-bot-server-events` gem to setup a command handler to [receive a slash command](../rails-slack-app-part2-slash-command-with-text-response#receive-slash-command-in-rails). Now we'll do something similar, but for receiving the form submission. The `slack-ruby-bot-server-events` gem calls these [Actions](https://github.com/slack-ruby/slack-ruby-bot-server-events?tab=readme-ov-file#actions).

Starting from the root of the project, create the following directory and files:

```bash
# The `bot` directory was created in Part 2 of this series
touch bot/actions.rb
mkdir bot/actions
touch bot/actions/view_submission.rb
```

You should have a directory structure that looks like this. Note that the `bot` directory is a sibling to the Rails `app` directory, and the `slash_commands` were created in Parts 2 and 3 of this series:

```
.
├── app
└── bot
    ├── actions
    │   └── view_submission.rb
    ├── actions.rb
    ├── slash_commands
    │   ├── retro_feedback.rb
    │   └── retro_open.rb
    └── slash_commands.rb
```

Add the following in `bot/actions.rb` to load all the actions, there's only one for now:

```ruby
# bot/actions.rb
require_relative "actions/view_submission"
```

Fill in the implementation for the `view_submission` action handler. For now, it will only log out the payload it received:

```ruby
# bot/actions/view_submission.rb
SlackRubyBotServer::Events.configure do |config|

  # Essentially this is saying to the SlackRubyBotServer,
  # If a "view_submission" interaction is received from Slack,
  # then execute this block.
  config.on :action, "view_submission" do |action|
    payload = action[:payload]
    action.logger.info "=== ACTION: payload = #{payload}"

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

Then update `config.ru` file in the root of the Rails app to load the action handlers in the `bot` directory. This will ensure the the Slack bot code is loaded when Rails starts:

```ruby
# This file is used by Rack-based servers to start the application.
require_relative "config/environment"

# This line was added in Part 2 of this series
require_relative "bot/slash_commands"

# === NEW: Load Slack action handlers ===
require_relative "bot/actions"

# We added this line previously in Part 1 of this series:
SlackRubyBotServer::App.instance.prepare!

run Rails.application
Rails.application.load_server
```

To see the action handler working, restart the Rails server `bin/dev`. Then in any Slack workspace that has the Retro Pulse app installed, enter the `/retro-feedback` slash command to launch the feedback modal. Fill it in by selecting any Category, enter some test text in the Comment, and check off the Anonymous option:

![slack app modal test](../images/slack-app-modal-test.png "slack app modal test")

Then click the Submit button in Slack, and watch the Rails server output. It will show something like this:

```
Started POST "/api/slack/action" for 34.201.19.177 at 2024-02-06 07:10:16 -0500

INFO -- : === ACTION: payload = {"type"=>"view_submission", "team"=>{"id"=>"your-team-id", ...}
```

**What's going on:**

The above output from the Rails server shows that a POST to `/api/slack/action` is being processed. Recall when we configured Slack interactivity earlier, we told Slack to post payloads to this url. Slack is actually posting to the ngrok url, which forwards to the Rails server running on `localhost:3000`.

To view the "raw" request sent by Slack, open a browser at `http://127.0.0.1:4040`. This is the web interface exposed by ngrok which shows all HTTP requests and responses that were received by ngrok and responded to by the Rails app. For example, the form we just submitted was posted to ngrok as a url-encoded form with the following HTTP headers and body:

```
POST /api/slack/action HTTP/1.1
Host: 05f9-70-51-246-153.ngrok-free.app
User-Agent: Slackbot 1.0 (+https://api.slack.com/robots)
Content-Length: 4137
Accept: application/json,*/*
Accept-Encoding: gzip,deflate
Content-Type: application/x-www-form-urlencoded
X-Forwarded-For: 32.423.15.766
X-Forwarded-Host: 12e4-203-0-113-42.ngrok-free.app
X-Forwarded-Proto: https
X-Slack-Request-Timestamp: 1707220000
X-Slack-Signature: v0=88a...

payload=%7B%22type%22%3A%22view_submission%...
```

The `POST /api/slack/action` is handled by the routing provided by the [slack-ruby-bot-server-events](https://github.com/slack-ruby/slack-ruby-bot-server-events) gem, which takes care of a lot of the boilerplate including providing a controller to parse the raw url-encoded form body, and logic to verify the `X-Slack-Signature` HTTP header.

Then the `slack-ruby-bot-server-events` gem's controller for `/api/slack/action` parses out the specific action name, which it finds in the `type` section of the payload. From this example, the type is `view_submission`. The gem will then run all [callbacks that are registered for that action](https://github.com/slack-ruby/slack-ruby-bot-server-events?tab=readme-ov-file#implement-callbacks).

Since we added `config.on :action, "view_submission"` in `view_submission.rb`, this is how the `slack-ruby-bot-server-events` gem knows it should run our custom logic. The raw url-encoded form data received from Slack has been converted into a hash that's available as `action[:payload]`.

## Saving Feedback

Now that we have communication between Slack and the Rails app working to receive the form submission, we need to parse out the contents of the payload to save the user's retrospective feedback.

The payload contains all the field names and corresponding values submitted by the user for the [custom modal we built in Part 3](../rails-slack-app-part3-slash-command-with-modal-response#respond-with-retro-feedback-modal), along with additional information such as the Slack team, user, trigger ID, and API application ID. Here is a condensed version of the payload for the test we submitted earlier:

```ruby
{"type"=>"view_submission",
 "team"=>{"id"=>"T0-your-team-id", "domain"=>"your-slack-domain"},
 "user"=>{"id"=>"U0-your-slack-user-id", "username"=>"your.slack.user.name"},
 "api_app_id"=>"A0-your-slack-app-id",
 "token"=>"za...",
 "trigger_id"=>"659...",
 "view"=>
  {
   "type"=>"modal",
   "callback_id"=>"feedback_form",
   "blocks"=>[... ],
   "state"=>
    {"values"=>
      {"category_block"=>
        {"category_select"=>
          {"type"=>"static_select",
           "selected_option"=>
            {"text"=>{"type"=>"plain_text", "text"=>"Something we should keep doing"},
             "value"=>"keep"}}},
       "comment_block"=>
        {"comment_input"=>
          {"type"=>"plain_text_input", "value"=>"This is a test of the modal submission action handler in Rails"}},
       "anonymous_block"=>
        {"anonymous_checkbox"=>
          {"type"=>"checkboxes",
           "selected_options"=>[{"text"=>{"type"=>"plain_text", "text"=>"Yes"}, "value"=>"true"}]}}}},
   },
}
```

The payload indicates that it is of type `view_submission` and contains some information about the Slack `team` and `user`.

The `view` section contains a `blocks` section, which is a repetition of the blocks we defined earlier in Part 3 when creating the form, which follows the [Slack Block Kit](https://api.slack.com/block-kit/building) format. We can disregard this section.

The `view` section also contains a `state` section. Here is where we find the actual values the user filled in the modal form. For example, the category option the user selected is available in `payload["view"]["state"]["values"]["category_block"]["category_select"]["selected_option"]["value"]`.

The attributes of the payload need to be parsed out for instantiating and saving a `Comment` model in the Rails app. I find it helpful to create a mapping table before writing the code, to be confident that all the data is available:

| Comment           | Slack Payload Attribute                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| category          | ["view"]["state"]["values"]["category_block"]["category_select"]["selected_option"]["value"]      |
| content           | ["view"]["state"]["values"]["comment_block"]["comment_input"]["value"]                            |
| slack_user_id     | ["user"]["id"]                                                                                    |
| slack_username    | ["user"]["username"]                                                                              |
| anonymous         | ["view"]["state"]["values"]["anonymous_block"]["anonymous_checkbox"]["selected_options"].present? |

To determine whether the user checked off the Anonymous option in the form, we have to check whether the `selected_options` of the checkbox portion of the payload exist. If yes, it means the user checked this option, otherwise, there will be no `selected_options` at all.

Now that we know how to parse the Slack payload to extract what's needed to build a Comment model, we can come back to the `view_submission` action handler, and implement the logic to create a new Comment:

```ruby
# bot/actions/view_submission.rb
SlackRubyBotServer::Events.configure do |config|
  config.on :action, "view_submission" do |action|
    payload = action[:payload]
    action.logger.info "=== ACTION: payload = #{payload}"

    anonymous = payload["view"]["state"]["values"]["anonymous_block"]["anonymous_checkbox"]["selected_options"].present?

    # This comment will be associated with the one and only open Retrospective
    Comment.create!(
      retrospective: Retrospective.find_by(status: Retrospective.statuses[:open]),
      content: payload["view"]["state"]["values"]["comment_block"]["comment_input"]["value"],
      anonymous:,
      category: payload["view"]["state"]["values"]["category_block"]["category_select"]["selected_option"]["value"],
      slack_user_id: anonymous ? nil : payload["user"]["id"],
      slack_username: anonymous ? nil : payload["user"]["username"]
    )

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

To make a better user experience, the app should reply with a DM (direct message) to the user that submitted the feedback, confirming their feedback has been saved. To do this, we'll use the [postMessage API](https://api.slack.com/methods/chat.postMessage) provided by Slack. This was used in Part 2 of this series to send a message to the channel that a [retrospective was opened](../rails-slack-app-part2-slash-command-with-text-response#implement-slash-command). This time, instead of replying to the channel, we want to reply only to the user. This can be done by specifying the Slack user id as the `channel` argument.

Here is the modified view_submission handler, with a DM back to the user:

```ruby
SlackRubyBotServer::Events.configure do |config|
  config.on :action, "view_submission" do |action|
    payload = action[:payload]
    action.logger.info "=== ACTION: payload = #{payload}"

    anonymous = payload["view"]["state"]["values"]["anonymous_block"]["anonymous_checkbox"]["selected_options"].present?

    Comment.create!(
      retrospective: Retrospective.find_by(status: Retrospective.statuses[:open]),
      content: payload["view"]["state"]["values"]["comment_block"]["comment_input"]["value"],
      anonymous:,
      category: payload["view"]["state"]["values"]["category_block"]["category_select"]["selected_option"]["value"],
      slack_user_id: anonymous ? nil : payload["user"]["id"],
      slack_username: anonymous ? nil : payload["user"]["username"]
    )

    # Instantiate a slack_client for this team
    team_id = payload["team"]["id"]
    team = Team.find_by(team_id:)
    slack_client = Slack::Web::Client.new(token: team.token)

    # Send DM to user
    slack_client.chat_postMessage(
      channel: payload["user"]["id"],
      text: "Thank you, your feedback has been saved."
    )

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

After restarting the Rails server `bin/dev`, and submitting the form again from Slack `/retro-feedback`, you should see the following in the Rails server output, indicating that a new Comment has been saved with the payload values. I've added some annotations:

```
=== Log the action payload
INFO -- : === ACTION: payload = {"type"=>"view_submission", "team"=>{"id"=>"T0...}

=== Find the open retrospective to associate the new Comment with:
Retrospective Load (1.6ms)  SELECT "retrospectives".*
                            FROM "retrospectives"
                            WHERE "retrospectives"."status" = $1
                            ORDER BY "retrospectives"."id" ASC LIMIT $2
                            [["status", "open"], ["LIMIT", 1]]

== Insert a new Comment record in the database
== Since Anonymous checkbox was selected, slack info fields are nil
TRANSACTION (1.8ms)  BEGIN
  Comment Create (5.6ms)
    INSERT INTO "comments"
    ("content", "anonymous", "retrospective_id", "created_at", "updated_at", "category", "slack_user_id", "slack_username")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING "id"
    [
      ["content", "This is a test of the modal submission action handler in Rails"],
      ["anonymous", true],
      ["retrospective_id", 31],
      ["created_at", "2024-02-09 12:53:38.577358"],
      ["updated_at", "2024-02-09 12:53:38.577358"],
      ["category", "keep"],
      ["slack_user_id", nil],
      ["slack_username", nil]]
TRANSACTION (2.1ms)  COMMIT
```

And in your Slack workspace, you should see a DM from the Retro Pulse app.

## Refactor

While the current solution works, there are some problems with it:

1. It's getting too long.
2. There's no error handling. For example, the Comment may fail to be saved due to validation rules.
3. Having all the business logic directly in the action handler makes it impossible to test.
4. Having all the form parsing together with the business logic makes the code hard to read.

We'll solve these problems in the same way as was done in [Part2](../rails-slack-app-part2-slash-command-with-text-response#openretrospective-interactor) of this series, by introducing an interactor named `SaveRetrospectiveFeedback`. To keep the interactor clean, we'll also introduce a `SlackFormParser` module for extracting the information needed from the Slack view_submission form.

Here is the `SlackFormParser` module

```ruby
# lib/slack_form_parser.rb
module SlackFormParser
  module_function

  def parse_user_info(payload)
    {
      user_id: payload["user"]["id"],
      slack_user_id: payload["user"]["id"],
      slack_username: payload["user"]["username"]
    }
  end

  def parse_feedback_info(payload)
    view_state = payload["view"]["state"]
    {
      category: view_state["values"]["category_block"]["category_select"]["selected_option"]["value"],
      comment: view_state["values"]["comment_block"]["comment_input"]["value"],
      anonymous: view_state["values"]["anonymous_block"]["anonymous_checkbox"]["selected_options"].present?
    }
  end
end
```

Here is the `SaveRetrospectiveFeedback` interactor:

* It's provided the form `payload` and `slack_client` via `context`.
* It includes the `SlackFormParser` for extracting the attributes for the Comment model.
* It then attempts to create and save a new Comment from the parsed form information.
* If it succeeds, it DMs the user a success message, including the feedback category.
* Otherwise, it DMs the user a failure message, with the reason the Comment could not be saved.
* Finally if anything unexpected happens, it fails the context and logs the error.

```ruby
class SaveRetrospectiveFeedback
  include Interactor
  include ActionView::Helpers::SanitizeHelper
  include SlackFormParser

  def call
    parse_payload
    save_comment
    send_feedback_confirmation
  rescue StandardError => e
    log_error(e)
    context.fail!
  end

  private

  def parse_payload
    @user_info = parse_user_info(context.payload)
    @feedback_info = parse_feedback_info(context.payload)
  end

  def save_comment
    retrospective = Retrospective.find_by(status: Retrospective.statuses[:open])

    comment = Comment.new(
      content: @feedback_info[:comment],
      anonymous: @feedback_info[:anonymous],
      category: @feedback_info[:category],
      retrospective:,
      **slack_fields
    )

    @save_message = if comment.save
                      "Thank you, your `#{@feedback_info[:category]}` feedback has been submitted."
                   else
                      "Could not save your `#{@feedback_info[:category]}` feedback: #{comment.errors.full_messages}"
                   end
  end

  def slack_fields
    if @feedback_info[:anonymous]
      { slack_user_id: nil, slack_username: nil }
    else
      { slack_user_id: @user_info[:slack_user_id], slack_username: @user_info[:slack_username] }
    end
  end

  def send_feedback_confirmation
    context.slack_client.chat_postMessage(
      channel: @user_info[:user_id],
      text: @save_message
    )
  end

  def log_error(error)
    error_message = "Error in SaveRetrospectiveFeedback: #{error.message}"
    backtrace = error.backtrace.join("\n")
    Rails.logger.error("#{error_message}\n#{backtrace}")
  end
end
```

Then the view_submission action handler can be simplified because most of the logic has moved to the interactor:

```ruby
# bot/actions/view_submission.rb
SlackRubyBotServer::Events.configure do |config|
  config.on :action, "view_submission" do |action|
    payload = action[:payload]
    team_id = payload["team"]["id"]
    team = Team.find_by(team_id:)
    slack_client = Slack::Web::Client.new(token: team.token)

    # If app is receiving multiple different form submissions, check callback_id and handle accordingly
    callback_id = payload["view"]["callback_id"]
    action.logger.info "=== ACTION: Team: #{team.name}, callback_id: #{callback_id}"

    SaveRetrospectiveFeedback.call(payload:, slack_client:)
    nil
  end
end
```

**About callback_id:** The `callback_id` attribute in the payload was initially populated in Part 3 of this series when we [specified the modal payload](../rails-slack-app-part3-slash-command-with-modal-response#respond-with-example-modal). It's value was set to `feedback_form` as follows:

```ruby
modal_payload = {
  trigger_id: trigger_id,
  view: {
    type: "modal",
    callback_id: "feedback_form",
    # ...
  }
  # ...
}
```

Populating a `callback_id` is useful for an application that generates many different types of forms, in which case, it would set a unique `callback_id` per form. Slack will send all form submissions to the same URL, which we configured earlier in the [interactivity](../rails-slack-app-part4-action-modal-submission#configure-slack-interactivity) section. Then the application would need the ability to distinguish which kind of form is being submitted, and delegate to an appropriate handler. In this case, Retro Pulse is a simple app with only one form so strictly speaking, `callback_id` isn't necessary, but it doesn't hurt to have it, then the app is ready for adding more forms in the future.

## Next Steps

In this part of the series on building a Slack app with Rails, we've learned how to receive a form submission from Slack, parse it to extract the data the user filled in, save it to the database, and reply with a DM to the Slack user confirming their feedback was saved. At this point, we almost have a complete application working. Read on to the last part in this series, where we'll [build a block kit response to a slash command](../rails-slack-app-part5-slash-block-kit-response), to support the team in discussing all the retrospective feedback that has been submitted.

## TODO

- WIP: edit
