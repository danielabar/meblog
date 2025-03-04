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

This post will explain how to quickly setup a Rails-like console environment, for a plain Ruby project.

Here is my project structure (ignoring documentation and tests folders). Aside from the `main.rb` entrypoint, all the code is organized in the `lib` folder, with some sub-folders as well:
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

## Setting Up a Console in a Plain Ruby Project

To replicate Rails console behavior, we can define an environment file that loads all dependencies and application files, then create an  executable script to launch an interactive Ruby (IRB) session.

### 1. Define `config/environment.rb`

This file ensures all project dependencies and source files are loaded:

```ruby
# frozen_string_literal: true

# Load all dependencies from Gemfile or standard Ruby library
require "tty-table"
require "yaml"

# Load all project source files
Dir.glob(File.expand_path("../lib/**/*.rb", __dir__)).each { |file| require file }
```

TODO: tech details explain what glob, expand path do

### 2. Create `bin/console`

This script initializes IRB with the full application environment. If you don't already have it, create a `bin` directory in the project root, then create a new file named `console` and make it executable

```bash
mkdir bin
touch bin/console
chmod +x bin/console
```

The contents of `console` are as follows:

```ruby
#!/usr/bin/env ruby

require_relative "../config/environment"
require "irb"

IRB.start
```

### 3. Use the Console

Now, you can start an interactive session with:

```sh
bin/console
```

All project classes will be loaded, so you can experiment with them directly. Intellisense support is also available. For example:

TODO: screenshot with intellisense

```ruby
Tax::ReverseIncomeTaxCalculator.new.calculate(40_000, "ONT")
=> ...
Tax::IncomeTaxCalculator.new.calculate(amt_from_tx, "ONT")
=> ...
```

### Bonus: Use `config/environment.rb` for Tests and Main Entry Point

Instead of manually requiring files in multiple places, you can include `config/environment.rb` in your main script (`main.rb`) and spec helper to keep things DRY.

This approach provides a lightweight, Rails-like console experience for any Ruby project, making interactive debugging and exploration just as easy as when using Rails.

TODO: show it in my main.rb and spec helper (assuming using rspec for testing).

## TODO
* intro para
* main content
* organize headings/sub-headings
* conclusion para
* edit
