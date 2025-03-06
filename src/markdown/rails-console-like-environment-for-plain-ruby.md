---
title: "Rails Console-like Environment for a Plain Ruby Project"
featuredImage: "../images/rails-console-plain-ruby-chad-greiter-qvksnJCsjyw-unsplash.jpg"
description: "If you're working on a plain Ruby project and need an interactive console for debugging and exploration, this post covers how to set one up. A console allows quick experimentation with project classes, making it easier to test calculations, inspect data, and validate logic without writing temporary scripts. The setup is simple and provides a Rails-like experience for loading and interacting with the code."
date: "2025-06-01"
category: "ruby"
related:
  - "Use Ruby to Parse Command Line Output"
  - "Configurable Retry with Ruby"
  - "Avoid this Bug with Numeric Environment Variables in Ruby"
---

I've been working on a Ruby project without Rails. It's a CLI tool that simulates retirement drawdown strategies for Canadians (I'll write a future blog post with more details on that). While building it, I found myself missing the convenience of the Rails console (`bin/rails console`), which loads all application code, including models and services, allowing interactive exploration and debugging.

For example, in my project, I have both a tax calculator and a reverse tax calculator. Aside from formal unit tests, it's useful to experiment with these classes interactively. Similarly, I have market return sequence generators that I may want to inspect directly. A console enables exploratory coding — it's not a replacement for tests but is great for quickly validating ideas.

This post will explain how to setup a Rails-like console environment, for a plain Ruby project.

## Project Structure

Here is my project structure (ignoring documentation and test folders). Aside from the `main.rb` entrypoint, all the code is organized in the `lib` folder, with sub-folders under that:
```
.
├── Gemfile
├── Gemfile.lock
├── README.md
├── lib
│   ├── account.rb
│   ├── app_config.rb
│   ├── first_year_cash_flow.rb
│   ├── numeric_formatter.rb
│   ├── output
│   │   ├── console_plotter.rb
│   │   └── console_printer.rb
│   ├── return_sequences
│   │   ├── base_sequence.rb
│   │   ├── constant_return_sequence.rb
│   │   ├── geometric_brownian_motion_sequence.rb
│   │   ├── mean_return_sequence.rb
│   │   └── sequence_selector.rb
│   ├── run
│   │   ├── app_runner.rb
│   │   ├── simulation_detailed.rb
│   │   └── simulation_success_rate.rb
│   ├── simulation
│   │   ├── simulation_evaluator.rb
│   │   └── simulator.rb
│   ├── strategy
│   │   ├── rrif_withdrawal_calculator.rb
│   │   ├── rrsp_to_taxable_to_tfsa.rb
│   │   └── withdrawal_planner.rb
│   ├── tax
│   │   ├── income_tax_calculator.rb
│   │   └── reverse_income_tax_calculator.rb
│   ├── withdrawal_amounts.rb
│   └── withdrawal_rate_calculator.rb
└── main.rb
```

WIP:
On any Ruby project (and also Rails projects), you can always run `irb` at the terminal, to get into an interactive Ruby session. `irb` is a default gem of Ruby so no need to install it, if you've installed Ruby, then you already have `irb`. However, by default, it doesn't know about any of your custom code in your project.

Reference: [IRB Overview](https://ruby.github.io/irb/#label-Overview)

You could manually execute `require_relative ...` lines in the irb session to load your code, for example:

TODO: Show this without customized prompt

```ruby
# TODO example manually loading tax calculator
```

But this is tedious to have to do every time you want to experiment with some of your project code. It would be nice if all the project code was always available, any time you ran `irb` form your project root.

TODO: Transition sentence...

## Define `config/environment.rb`

The first step is to create a `config` directory, and an `environment.rb` file in that directory:

```bash
mkdir config
touch config/environment.rb
```

Edit `config/environment.rb` to load all project dependencies from the Gemfile, and all source files in the `lib` directory:

```ruby
# frozen_string_literal: true

# Load all dependencies from Gemfile or standard Ruby library
require "descriptive_statistics"
require "tty-progressbar"
require "unicode_plot"
require "tty-table"
require "yaml"

# Load all project source files from lib dir
Dir.glob(File.expand_path("../lib/**/*.rb", __dir__)).each { |file| require file }
```

TODO: tech details explain what glob, expand path do

## Create Project Specific `.irbrc`

The next step is to create a `.irbrc` file in the project directory, to customize the behaviour of [irb](https://ruby.github.io/irb/) when started in your project.

TODO: explain about default config in home dir, but it can be overridden on a project level because irb will look in the current directory. Reference [Configuration File Path Resolution](https://ruby.github.io/irb/Configurations_md.html#label-Configuration+File+Path+Resolution).

Edit the project level `.irbrc` file so it has the following. Note that any valid Ruby can be placed in this file:

```ruby
# Load all the project source
require_relative "config/environment"
puts "Loaded application"

# Optionally customize the prompt
IRB.conf[:PROMPT][:APP] = {
  PROMPT_I: "drawdown_simulator> ",  # Standard input prompt
  PROMPT_N: "drawdown_simulator* ",  # Multiline input
  PROMPT_S: "drawdown_simulator%l ", # String continuation
  PROMPT_C: "drawdown_simulator? ",  # Indentation level
  RETURN: "=> %s\n" # Format of return value
}

IRB.conf[:PROMPT_MODE] = :APP # Set custom prompt
```

## Launch custom irb

Now when you run `irb` at the terminal, it will first run all the code in `.irbrc` in the project root. It will look like this:

```
Loaded application
drawdown_simulator>
```

All project classes will be loaded, so you can now interact with them, without having to explicitly load them. [Autocompletion](https://ruby.github.io/irb/#label-Automatic+Completion) is also available for the project namespaces and classes. For example:

TODO: screenshot with intellisense

```ruby
Tax::ReverseIncomeTaxCalculator.new.calculate(40_000, "ONT")
=> ...
Tax::IncomeTaxCalculator.new.calculate(amt_from_tx, "ONT")
=> ...
```

## Optionally Create `bin/console`

TODO: Only if you're used to convenience of `bin` scripts

Next, create a `bin` directory and a `console` file in that directory, which needs to be executable:

```bash
mkdir bin
touch bin/console
chmod +x bin/console
```

Edit `bin/console` as follow:

```ruby
#!/usr/bin/env ruby

require "irb"

# This will use project level `.irbrc` so no need to load config/environment here.
IRB.start
```

Now, you can start an interactive session with:

```sh
bin/console
```

It will behave the same as having run `irb`.

### Bonus: Use `config/environment.rb` for Tests and Main Entry Point

Instead of manually requiring files in multiple places, you can include `config/environment.rb` in your main script (`main.rb`) and spec helper to keep things DRY.

This approach provides a lightweight, Rails-like console experience for any Ruby project, making interactive debugging and exploration just as easy as when using Rails.

TODO: show it in my main.rb and spec helper (assuming using rspec for testing).

## TODO
* alternative is to load project-specific source files in `.irbrc` in project directory, then could just run irb, but if you're used to the convenience of bin scripts, this might feel more natural.
* reference: [irb](https://ruby.github.io/irb/)
* intro para
* main content
* organize headings/sub-headings
* conclusion para
* edit
