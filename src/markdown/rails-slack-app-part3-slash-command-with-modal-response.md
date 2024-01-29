---
title: "Build a Rails App with Slack Part 3: Slash Command with Modal Response"
featuredImage: "../images/slack-feat-img-part2-john-towner-p-rN-n6Miag-unsplash.jpg"
description: "Learn how to build a Slack application with Rails in this comprehensive multi-part series. Part 3 covers configuring and handling a Slack Slash Command to perform a business action and responding with a modal form response in the channel."
date: "2024-06-03"
category: "rails"
related:
  - "Understanding ActiveRecord Dependent Options"
  - "ActiveRecord JSON Column with MySQL and MariaDB"
  - "Roll Your Own Search with Rails and Postgres: Search Engine"
---

Welcome to the third installment of this multi-part series on building a Slack application with Rails. This series will guide you through the process of creating a Slack application with Rails and is structured as follows:

* [Part 1: Rails new, Slack, and OAuth](../rails-slack-app-part1-oauth)
* [Part 2: Slack Slash Command with Text Response](../rails-slack-app-part2-slash-command-with-text-response)
* Part 3: Slack Slash Command with Modal Response (You Are Here)
* [Part 4: Slack Action Modal Submission](../rails-slack-app-part4-action-modal-submission)
* [Part 5: Slack Slash Command with Block Kit Response](../rails-slack-app-part5-slash-block-kit-response)

Feel free to jump to a specific part of interest using the links above or follow along sequentially. You can also checkout the [source code on Github](https://github.com/danielabar/retro-pulse) for the application we'll be building.

This post assumes the reader has at least a beginner level familiarity with Ruby on Rails. It's also assumed the reader has used [Slack](https://slack.com/) as an end user with basic interactions such as joining channels, sending messages, and participating in conversations.

Part 1 of this series introduced [Retro Pulse](../rails-slack-app-part1-oauth#introducing-retro-pulse), a Slack app built with Rails for agile teams to manage their retrospectives entirely with Slack. Part 2 explained how to implement a Slack Slash command to open a retrospective and return a markdown text response to the same Slack channel that initiated the request. Now in Part 3, we will learn how to implement another slash command `/retro-feedback` that will respond with a modal form, allowing the user to enter some feedback for the retrospective such as something the team should keep on doing, or stop doing, or something new to try.

The interaction starts with a user entering the `/retro-feedback` slash command in a Slack workspace where the [Retro Pulse](../rails-slack-app-part1-oauth#introducing-retro-pulse) app has been added:

![slack app demo retro feedback slash hint](../images/slack-app-demo-retro-feedback-slash-hint.png "slack app demo retro feedback slash hint")

After hitting <kbd class="markdown-kbd">Enter</kbd>, the app responds with a modal:

![slack-app-demo-retro-feedback-modal](../images/slack-app-demo-retro-feedback-modal.png "slack-app-demo-retro-feedback-modal")

The modal has a dropdown for Category:

![slack app demo feedback modal](../images/slack-app-demo-feedback-modal.png "slack app demo feedback modal")

After selecting a category, the user can enter a multi-line comment containing their feedback, optionally check the Anonymous option if they don't want their Slack username shown alongside their feedback, and Submit the form.

We'll be looking at handling the form submission in a future post. This post is focused on generating the modal response.

## Create Slash Command in Slack

The first step in implementing this is to navigate to [Your Apps](https://api.slack.com/apps) on Slack, select the "Retro Pulse" app you created in [Part 1 of this series](../rails-slack-app-part1-oauth#create-slack-app), and then select "Slash Commands" from the Features section:

![slack app feature slash](../images/slack-app-feature-slash.png "slack app feature slash")

Then click on the "Create New Command" button, and fill in the form as follows:

**Command:** `/retro-feedback`. This is what the user will type into a Slack message to initiate an interaction with the Retro Pulse Rails app.

**Request URL:** For example: `https://12e4-203-0-113-42.ngrok-free.app/api/slack/command`. This is where Slack will send an HTTP POST request when the user submits this slash command from Slack. The hostname is your ngrok forwarding address that you got from starting [ngrok in part 1 of this series](../rails-slack-app-part1-oauth#ngrok). The route `/api/slack/command` is defined in the `slack-ruby-bot-server` gem that we included as part of our [Rails app in part 1 of this series](../rails-slack-app-part1-oauth#create-rails-app).

**Short Description:** `Provide some feedback for what's going well, or what to stop doing, or try`. This will be displayed as the user types in the slash command.

**Usage Hint:** Leave blank.

**Escape Channels:** Leave this unchecked. Turning this on will modify the parameters sent with a command by a user such as  wrapping URLs in angle brackets and translating channel or user mentions into their correlated IDs. It's not necessary for this app. See the [Slack docs](https://api.slack.com/interactivity/slash-commands) if your app needs this option.

Then click the "Save" button which appears all the way at the bottom right hand corner.

## Receive Slash Command in Rails

In Part 2 of this series, we learned how to add a [handler to receive slash commands](../rails-slack-app-part2-slash-command-with-text-response#receive-slash-command-in-rails) using the [slack-ruby-bot-server-events](https://github.com/slack-ruby/slack-ruby-bot-server-events) gem. Let's add another one to handle the `/retro-feedback` command.

Start by adding a new file in the `bot/slash_commands` directory named `retro_feedback.rb`. The structure will be similar to the `/retro-open` command handler we added in Part 2, except this time, there will be no `command[:text]` because the `/retro-feedback` command does not accept any arguments. Instead, we will make use of the `trigger_id` that Slack sends in the request. The `trigger_id` is a unique identifier generated by Slack when a user interacts with an interactive element (e.g., slash command, button click). It's used to open modals or perform other interactive actions in response to a user's command:


```ruby
# bot/slash_commands/retro_feedback.rb
SlackRubyBotServer::Events.configure do |config|

  # Essentially this is saying to the SlackRubyBotServer,
  # If a "/retro-feedback" slash command is received from Slack,
  # then execute this block.
  config.on :command, "/retro-feedback" do |command|
    # Use `command[:team_id]` from request parameters sent to us
    # by Slack to find the Team model persisted in the database
    team_id = command[:team_id]
    team = Team.find_by(team_id:)

    # Instantiate a slack client with the team token
    # so we can communicate back to the channel
    slack_client = Slack::Web::Client.new(token: team.token)

    # This is the Slack channel we need to respond back to
    channel_id = command[:channel_id]

    # Use `command[:trigger_id]` from request parameters sent to us Slack
    # This will be needed to generate the modal response.
    trigger_id = command[:trigger_id]

    command.logger.info "=== COMMAND: retro-feedback, Team: #{team.name}, Channel: #{channel_id}"

    # == Do SOMETHING with trigger_id and slack_client ===

    # Return `nil`, otherwise the slack-ruby-bot-server-events gem
    # replies to the channel with a message "true"
    nil
  end
end
```

At this point, if you restart the Rails server, and then enter `/retro-feedback` in any channel in a Slack workspace with the Retro Pulse app has been installed, you should see some info logging in the Rails server output displaying your team name and the channel id. Of course, nothing will happen on the Slack side because the code isn't responding yet. The next section explains how to generate a modal response.

## Respond with Example Modal

In order to send back a modal response from the slash command, we'll make use of Slack [Modals](https://api.slack.com/surfaces/modals) and [Block Kit](https://api.slack.com/block-kit/building).

**Modal:** The Slack app equivalent of an alert box, pop-up, or dialog box. Modals capture and maintain focus within Slack until the user submits or dismisses the modal.

**Block Kit:** A framework provided by Slack for building rich and interactive messages within the Slack platform. It allows developers to create visually appealing messages containing various elements such as text, buttons, images, and input fields. Think of Block Kit as a set of building blocks for crafting dynamic user interfaces directly within Slack conversations.

This will make more sense with a simple example. In the following code snippet, the `views_open` method from the Slack API is used to trigger the opening of a modal in response to the `/retro-feedback` command. This method accepts a hash that represents the modal contents. The modal includes a title "Example Modal", a submit button, a cancel button, and an input block for users to enter some text:

```ruby
# bot/slash_commands/retro_feedback.rb
SlackRubyBotServer::Events.configure do |config|
  config.on :command, "/retro-feedback" do |command|
    team_id = command[:team_id]
    team = Team.find_by(team_id:)
    slack_client = Slack::Web::Client.new(token: team.token)
    channel_id = command[:channel_id]
    trigger_id = command[:trigger_id]
    command.logger.info "=== COMMAND: retro-feedback, Team: #{team.name}, Channel: #{channel_id}"

    modal_payload = {
      trigger_id: trigger_id,
      view: {
        type: "modal",
        callback_id: "feedback_form",
        title: {
          type: "plain_text",
          text: "Example Modal",
          emoji: true
        },
        submit: {
          type: "plain_text",
          text: "Submit",
          emoji: true
        },
        close: {
          type: "plain_text",
          text: "Cancel",
          emoji: true
        },
        blocks: [
          {
            type: "input",
            block_id: "comment_block",
            element: {
              type: "plain_text_input",
              action_id: "comment_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Enter some text"
              }
            },
            label: {
              type: "plain_text",
              text: "Comment"
            }
          }
        ]
      }
    }

    slack_client.views_open(modal_payload)
    nil
  end
end
```

Notes:
* `trigger_id` was extracted from the Slack request sent to the Rails app when the user entered `/retro-feedback`, we need to send it back to Slack as part of the request to open a modal so that Slack can "connect" the original user's request with this modal response.
* `title` will be displayed at the top of the modal.
* The `submit` and `close` attributes are optional. That is to say, Slack will always generate these buttons, but you can optionally define them in the payload to override the default text that is displayed on the buttons.
* The `blocks` section is required. It contains an array of Slack block elements that make up the modal content. In this simple example, we only have a single element, a multi-line input with some placeholder text and a label. See the Slack docs on [Reference Blocks](https://api.slack.com/reference/block-kit/blocks) for all supported elements and options.

After restarting the Rails server, go to your Slack workspace, enter `/retro-feedback` in any channel and hit <kbd class="markdown-kbd">Enter</kbd>, you should be presented with a modal like this:

![slack app example modal](../images/slack-app-example-modal.png "slack app example modal")

## Respond with Retro Feedback Modal

Now that we understand the basics of generating a modal response, we're ready to start building the actual modal we want to send back to collect feedback on the retrospective. Recall this is what we need to generate:

![slack-app-demo-retro-feedback-modal](../images/slack-app-demo-retro-feedback-modal.png "slack-app-demo-retro-feedback-modal")

Some of this we've already seen how to do including generating the title, a multi-line text input, and the Cancel and Submit buttons. The new parts are the dropdown value for Category (keep, stop, and try), and the optional checkbox for submitting the feedback anonymously.

The Slack docs on static select explain the expected structure of a dropdown with a static list of options, which is exactly what we need. Focusing on only the `blocks` section of the modal payload:

```ruby
# bot/slash_commands/retro_feedback.rb
SlackRubyBotServer::Events.configure do |config|
  config.on :command, "/retro-feedback" do |command|
    # ...

    modal_payload = {
      view: {
        type: "modal",
        callback_id: "feedback_form",
        # ...
        blocks: [
          {...},
          {
            type: "input",
            block_id: "comment_block",
            element: {
              type: "plain_text_input",
              action_id: "comment_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Enter some text"
              }
            },
            label: {
              type: "plain_text",
              text: "Comment"
            }
          }
        ]
      }
    }

    slack_client.views_open(modal_payload)
    nil
  end
end
```

```ruby
[
  {
    "type": "section",
    "block_id": "section678",
    "text": {
      "type": "mrkdwn",
      "text": "Pick an item from the dropdown list"
    },
    "accessory": {
      "action_id": "text1234",
      "type": "static_select",
      "placeholder": {
        "type": "plain_text",
        "text": "Select an item"
      },
      "options": [
        {
          "text": {
            "type": "plain_text",
            "text": "*this is plain_text text*"
          },
          "value": "value-0"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "*this is plain_text text*"
          },
          "value": "value-1"
        },
        {
          "text": {
            "type": "plain_text",
            "text": "*this is plain_text text*"
          },
          "value": "value-2"
        }
      ]
    }
  }
]
```

However, before doing that, there's a problem that needs to be addressed. If you're using Rubocop, you're probably getting a violation of `Metrics/BlockLength` on `bot/slash_commands/retro_feedback.rb`. Even with the simple modal example, the code quickly gets too long, and this will only get worse as we add more block elements such as the category dropdown. This issue can be addressed similarly to what was done in Part 2 of this series, where we [refactored the overly long command handler](../rails-slack-app-part2-slash-command-with-text-response#refactor), by moving the business logic into an interactor named `InitiateFeedbackForm`.

The `InitiateFeedbackForm` interactor will receive the trigger_id and slack_client from the command handler, build the modal response, and send it back to the slack channel.



## TODO

* figure out in what order to show select options, anon checkbox, vs refactoring to interactor because its getting too long?
* In intro section, add one more screenshot showing the filled out form and user hovering over submit button. Eg: To try, Github plugin to send automated reminders about stale PRs still awaiting reviews.
* Image showing on one side the Example Modal, and on the other side, the code containing modal payload and arrows between each attribute and modal visual
* Reference slack static select: https://api.slack.com/reference/block-kit/block-elements#select
* Update rdoc comments on ALL interactors in original code and this series to proper format as per: https://github.com/ruby/rdoc/blob/master/ExampleRDoc.rdoc?plain=1
