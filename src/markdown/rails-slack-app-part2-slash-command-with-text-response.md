---
title: "Build a Rails App with Slack Part 2: Slash Command with Text Response"
featuredImage: "../images/slack-feat-img-part2-john-towner-p-rN-n6Miag-unsplash.jpg"
description: "Learn how to build a Slack application with Rails in this comprehensive multi-part series. Part 2 covers configuring and handling a Slack Slash Command to perform a business action and responding with a markdown text response in the channel."
date: "2024-06-02"
category: "rails"
related:
  - "They Don't All Have To Be ActiveRecord Models"
  - "SQLite Varchar Surprise"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

Welcome to the second installment of this multi-part series on building a Slack application with Rails. This series will guide you through the process of creating a Slack application with Rails. The series is structured as follows:

* [Part 1: Rails new, Slack, and OAuth](../rails-slack-app-part1-oauth)
* Part 2: Slack Slash Command with Text Response (You Are Here)
* [Part 3: Slack Slash Command with Modal Response](../rails-slack-app-part3-slash-modal-response)
* [Part 4: Slack Action Modal Submission](../rails-slack-app-part4-action-modal-submission)
* [Part 5: Slack Slash Command with Block Kit Response](../rails-slack-app-part5-slash-block-kit-response)

Feel free to jump to a specific part of interest using the links above or follow along sequentially. You can also checkout the [source code on Github](https://github.com/danielabar/retro-pulse) for the application we'll be building.

This post assumes the reader has at least a beginner level familiarity with Ruby on Rails. It's also assumed the reader has used [Slack](https://slack.com/) as an end user with basic interactions such as joining channels, sending messages, and participating in conversations.

Part 1 of this series introduced [Retro Pulse](../rails-slack-app-part1-oauth#introducing-retro-pulse), a Slack app built with Rails for agile teams to manage their retrospectives entirely with Slack. Part 2 (this post) will explain how to implement the Slack Slash command to open a retrospective and return a markdown text response to the same Slack channel that initiated the request.

The interaction looks like this:

![slack app demo retro open slash command](../images/slack-app-demo-retro-open-slash-command.png "slack app demo retro open slash command")

After hitting <kbd class="markdown-kbd">Enter</kbd>, the app responds with a confirmation that the retrospective has been opened:

![slack app demo retro open success](../images/slack-app-demo-retro-open-success.png "slack app demo retro open success")

## Create Slash Command in Slack

The first step in implementing this is to navigate to [Your Apps](https://api.slack.com/apps) on Slack, select the "Retro Pulse" app you created in [Part 1 of this series](../rails-slack-app-part1-oauth#create-slack-app), and then select "Slash Commands" from the Features section:

![slack app feature slash](../images/slack-app-feature-slash.png "slack app feature slash")

Then click on the "Create New Command" button, and fill in the form as follows:

**Command:** `/retro-open`. This is what the user will type into a Slack message to initiate an interaction with the Retro Pulse Rails app.

**Request URL:** `https://12e4-203-0-113-42.ngrok-free.app/api/slack/command`. This is where Slack will send an HTTP POST request when the user submits this slash command from Slack. The hostname is your ngrok forwarding address that you got from starting [ngrok in part 1 of this series](../rails-slack-app-part1-oauth#ngrok). The route `/api/slack/command` is defined in the `slack-ruby-bot-server` gem that we included as part of our [Rails app in part 1 of this series](../rails-slack-app-part1-oauth#create-rails-app).

**Short Description:** `Open a new retrospective for comments`. This will be displayed as the user types in the slash command.

**Usage Hint:** `title`. Since this particular slash command requires a parameter, which will be used to create the retrospective, the usage hint is also shown to the user as they type in the slash command.

The filled out form will look something like this:

![slack create new command](../images/slack-create-new-command.png "slack create new command")

Click the "Save" button, which at the time of this writing, appears all the way at the bottom right-hand corner of the screen.

## Receive Slash Command in Rails

The next step is to update the Rails app to handle the HTTP POST to `/api/slack/command` that Slack will send whenever a user submits the `/retro-pulse something` Slash command. Recall that we're using the [slack-ruby-bot-server-events](https://github.com/slack-ruby/slack-ruby-bot-server-events) gem, which takes care of a lot of the boilerplate including providing a controller to parse the body, and logic to verify the `X-Slack-Signature` HTTP header.

Start by creating a `bot` directory in the root of the Rails project as shown below:

```bash
# from root of Rails project
mkdir bot
touch bot/slash_commands.rb
mkdir bot/slash_commands
touch bot/slash_commands/retro_open.rb
```

You should have the following structure:

```
.
├── app
└── bot
    ├── slash_commands
    │   └── retro_open.rb
    └── slash_commands.rb
```

Add the following in `bot/slash_commands.rb` to load all the slash commands, there's only one for now:

```ruby
# bot/slash_commands.rb
require_relative "slash_commands/retro_open"
```

Fill in the implementation for the retro open command handler. For now, it will only log out the text it received, as well as the team name and Slack channel ID the command was called from. The team will be fetched by the `team_id` that is available from the `command` object exposed by the `slack-ruby-bot-server-events` gem. The `channel_id` and `text` are also available from the `command` object:

```ruby
# bot/slash_commands/retro_open.rb
SlackRubyBotServer::Events.configure do |config|

  # Essentially this is saying to the SlackRubyBotServer,
  # If a "/retro-open" slash command is received from Slack,
  # then execute this block.
  config.on :command, "/retro-open" do |command|
    team = Team.find_by(team_id: command[:team_id])
    channel_id = command[:channel_id]

    # If user entered /retro-open foo
    # in Slack, then command_text will be: foo
    command_text = command[:text]
    command.logger.info "=== COMMAND: retro-open, Team: #{team.name}, Channel: #{channel_id}, Title: #{command_text}"

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

Then update `config.ru` file in the root of the Rails app to load the command handlers in the `bot` directory. This will ensure the the Slack bot code is loaded when Rails starts:

```ruby
# This file is used by Rack-based servers to start the application.
require_relative "config/environment"

# === ADD THIS LINE TO LOAD THE SLASH COMMAND HANDLERS ===
require_relative "bot/slash_commands"

# We added this line previously in Part 1 of this series:
SlackRubyBotServer::App.instance.prepare!

run Rails.application
Rails.application.load_server
```

Now we're ready to see this in action. Start the Rails server with `bin/dev`. Then go to your Slack desktop app, and enter the following in any channel in your Slack workspace where this app has been added. Recall that we added the Slack app to a workspace in [part 1 of this series as part of the OAuth flow](../rails-slack-app-part1-oauth#run-the-oauth-flow):

```
# Enter whatever title text you want after the slash command
/retro-open My Project Sprint 1
```

After hitting <kbd class="markdown-kbd">Enter</kbd> in Slack to submit the slash command, the Rails server output will show that the HTTP POST to `/api/slack/command` has been received and processed. Notice it runs a SQL SELECT to find the team, this is as a result of `Team.find_by(team_id: command[:team_id])` in the command handler:

```
Started POST "/api/slack/command"
  Team Load (2.1ms)  SELECT "teams".* FROM "teams"
    WHERE "teams"."team_id" = $1 LIMIT $2
    [["team_id", "the-team-id-from-slack"], ["LIMIT", 1]]
I, INFO -- : === COMMAND: retro-open,
  Team: YourTeamName,
  Channel: the-channel-from-slack,
  Title: My Project Sprint 1
```

The `Title` displayed in the logger INFO should match whatever you typed in as the text following `/retro-open` in Slack.

You may be wondering how is it that the code we wrote at `bot/slash_commands/retro_open.rb` is being run when the HTTP POST is received? This is the work of the `slack-ruby-bot-server-events` gem. When we specified `config.on` in the `SlackRubyBotServer::Events.configure` block, this added our handler as a callback. Then the Grape API endpoint which implements the HTTP POST for `/api/slack/command` parses out the specific command name, then runs all [callbacks that are registered for that command](https://github.com/slack-ruby/slack-ruby-bot-server-events?tab=readme-ov-file#implement-callbacks).

### Inspect Request

One thing that can seem a little "magical" at this point, is that we didn't write a Rails controller to handle the `/api/slack/command` HTTP Request. This is being handled by the `slack-ruby-bot-server-events` gem. Unlike Rails controllers that we write, it doesn't log out the parameters it was called with. However, we can still view the entire HTTP POST request and body using ngrok.

In the terminal tab where ngrok is running, it includes an address for the Web Interface:

```bash
ngrok http 3000

# Output will look something like this, your details will vary:
# Region                        United States (us)
# Latency                       35ms
# Web Interface                 http://127.0.0.1:4040
# Forwarding                    https://12e4-203-0-113-42.ngrok-free.app -> http://localhost:3000
```

Enter `http://127.0.0.1:4040` in a browser. This will allow you to inspect all HTTP requests that were received by ngrok and the corresponding HTTP responses that were sent by the Rails app. At this point, you should have one request for `POST /api/slack/command`. It will look something like this. Your specific Slack details will vary:

![slack ngrok inspect](../images/slack-ngrok-inspect.png "slack ngrok inspect")

This shows all the form parameters that Slack sent in the HTTP `POST /api/slack/command`. You can also view the HTTP headers. These include the `X-Slack-Request-Timestamp` and `X-Slack-Signature` headers that are verified by the `slack-ruby-bot-server-events` gem. If you weren't using a gem for this, you'd have to write this verification code yourself:

![slack ngrok inspect headers](../images/slack-ngrok-inspect-headers.png "slack ngrok inspect headers")

## Implement Slash Command

Now that we can see the communication between Slack and Rails working, the `/retro-open` slash command handler can be enhanced to do the real work of opening a new retrospective, with the title populated from the slash command text.

In order to create a Retrospective, we need to first define a database table to persist `retrospectives` with migrations, and a `Retrospective` model. A retrospective must have a unique title (eg: "Some Project Sprint 3"), a status (either `open` or `closed`), and there should only be one open retrospective at a time.

Here are the migrations to implement these requirements:

```ruby
class CreateRetrospectives < ActiveRecord::Migration[7.0]
  def change
    create_table :retrospectives do |t|
      t.string :title, null: false

      t.timestamps
    end
    add_index :retrospectives, :title, unique: true
  end
end
```

```ruby
class AddStatusToRetrospectives < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL.squish
      CREATE TYPE retrospective_status AS ENUM ('open', 'closed');
    SQL
    add_column :retrospectives, :status, :retrospective_status, default: "open", null: false
  end

  def down
    remove_column :retrospectives, :status
    execute <<-SQL.squish
      DROP TYPE retrospective_status;
    SQL
  end
end
```

Here is the `Retrospective` model with validations, and a scope to find the one and only open retrospective:

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

  validates :title, presence: true, uniqueness: true
  validates :status, presence: true
  validate :only_one_open_retrospective

  scope :open_retrospective, -> { where(status: statuses[:open]) }

  private

  def only_one_open_retrospective
    return unless open? && Retrospective.exists?(status: "open")

    errors.add(:status, "There can only be one open retrospective at a time.")
  end
end
```

Now let's return our attention to the `retro_open.rb` slash command handler. After it has extracted the command text, which is to be the title of the retrospective, it needs to create a new retrospective. If the new retrospective can be successfully saved, then it should post a success message back to the channel from which it was called. Otherwise, it should post an error message.

To post messages to Slack, we'll use an instance of `Slack::Web::Client`, instantiating it with the team's token, that got persisted earlier in the OAuth flow. The [Slack web client](https://github.com/slack-ruby/slack-ruby-client?tab=readme-ov-file#web-client) is provided from the `slack-ruby-client` gem that is included with this project. Note that emoji's and markdown can be included in the message sent back to Slack.

```ruby
# bot/slash_commands/retro_open.rb
SlackRubyBotServer::Events.configure do |config|

  # Essentially this is saying to the SlackRubyBotServer,
  # If a "/retro-open" slash command is received from Slack,
  # then execute this block.
  config.on :command, "/retro-open" do |command|
    team = Team.find_by(team_id: command[:team_id])
    channel_id = command[:channel_id]

    # If user entered /retro-open foo
    # in Slack, then command_text will be: foo
    command_text = command[:text]
    command.logger.info "=== COMMAND: retro-open, Team: #{team.name}, Channel: #{channel_id}, Title: #{command_text}"

    # Instantiate a slack client with the team token
    # so we can communicate back to the channel
    slack_client = Slack::Web::Client.new(token: team.token)

    # Create a new retrospective with title from Slack
    # Status will default to `open`
    retrospective = Retrospective.new(title: command_text)

    # Try to save it
    if retrospective.save
      # If save worked, post a success message to the channel
      slack_client.chat_postMessage(
        channel: channel_id,
        mrkdwn: true,
        text: ":memo: Opened retro `#{retrospective.title}`"
      )
    else
      # If save failed, post the error messages from the model
      slack_client.chat_postMessage(
        channel: channel_id,
        mrkdwn: true,
        text: ":warning: Could not create retro `#{command_text}`, error: #{retrospective.errors.full_messages}"
      )
    end

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

Restart the Rails server `bin/dev` after making these changes. Now you should be able to enter something like `/retro-open My Project Sprint 1` in the Slack workspace and have the app respond with a success message:

![slack app retro open success](../images/slack-app-retro-open-success.png "slack app retro open success")

The Rails server output shows that a new record is inserted in the `retrospectives` table:

```
Retrospective Create (3.1ms)  INSERT INTO "retrospectives"
  ("title", "created_at", "updated_at", "status")
  VALUES ($1, $2, $3, $4) RETURNING "id"
  [
    ["title", "My Project Sprint 1"],
    ["created_at", "2024-01-03 14:10:19.285310"],
    ["updated_at", "2024-01-03 14:10:19.285310"],
    ["status", "open"]
  ]
```

If you try to open another retrospective, for example `/retro-open My Project Sprint 2`, then an error message should be posted back to Slack with an explanation of why the retrospective could not be created:

![slack app retro open fail](../images/slack-app-retro-open-fail.png "slack app retro open fail")

## Refactor

While the `retro_open.rb` slash command handler works, there are some issues to consider:
* The code is getting long and difficult to read.
* It might be a good idea to sanitize the title text from the user before saving it to the database, although adding this will make the code even longer.
* There's some code duplication in the multiple calls to `slack_client.chat_postMessage(...)` where the only thing that varies is the message text.
* There's no (easy) way to test all this logic.

If you compare the command handler framework provided by the `slack-ruby-bot-server-events` gem to a Rails controller, then what we have here is the same problem that can affect any Rails application: Where to put the business logic?

In the case of a Slack application, the command handlers can be thought of as a type of "Slack controller". We would like to have these only focused on extracting the necessary data from the Slack command, and then have the business logic live somewhere else, where it's easier to test. There are a number of different options for organizing business logic in Rails applications. From my experience, here's what I've encountered:

* Leave it in the controller and test it with request (aka integration) tests.
* Put it in ActiveRecord model methods.
* Use ActiveSupport [concerns](https://www.writesoftwarewell.com/how-rails-concerns-work-and-how-to-use-them/).
* Use ActiveRecord callbacks to distribute the logic if some should run before and/or after database updates.
* Introduce POROs (Plain Old Ruby Objects) in the `/app/models` directory and put the business logic in these model methods.
* Introduce a [services layer](https://www.rubyvideo.dev/talks/railsconf-2022-your-service-layer-needn-t-be-fancy-it-just-needs-to-exist-by-david-copeland) (video link).
* Use interactors.

## TODO
* WIP: main content
* WIP: refactor, explain options for where to put business logic and why for this app will go with interactor
* In the "Receive Slash Command in Rails" section: recall the Team model got populated in Part 1 of this series when we ran the OAuth flow to add this app to a Slack workspace.
* Explain about escape option when defining slash command: Turning this on will modify the parameters sent with a command by a user. It will wrap URLs in angle brackets (ie. <http://example.com>) and it will translate channel or user mentions into their correlated IDs. Ref: https://api.slack.com/interactivity/slash-commands   (not important in this app)
* conclusion para
* edit
