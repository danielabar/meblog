---
title: "Use Ruby to Parse Command Line Output"
featuredImage: "../images/chain-ruby-one-liners-karine-avetisyan-ipuiM-36tAg-unsplash.jpg"
description: "Chain Ruby one-liners to parse command line output and execute system commands."
date: "2022-03-01"
category: "ruby"
related:
  - "Rails Feature Test Solved by Regex"
  - "Solving a Python Interview Question in Ruby"
  - "How I Setup my Terminal"
---

This post will show you how to chain together multiple Ruby one-liners to parse command line output from system commands, and execute further system commands using the output from the previous command. Why would you want to do this? Consider the following scenario.

Our team is using [Nomad](../nomad-tips-and-tricks) to deploy a Rails application which runs with multiple instances of Puma and a Sidekiq server for background jobs. Each of these runs in Docker containers, all orchestrated by Nomad. We frequently need to run a shell in one of the containers to perform some troubleshooting. This requires running two commands.

The first command gets the status of the Nomad job that runs Puma and Sidekiq. This command displays a list of allocations, which can be used to get at the Docker containers running the multiple instances of Puma and Sidekiq. Then a second command is needed to run a shell in a container, which requires the allocation ID of the container to run in. It looks like this:

```bash
### FIRST COMMAND ###
# Get status of job `myapp` which runs Puma and Sidekiq
$ nomad job status myapp

# Output of the status command
Name          = myapp
Type          = service
Status        = running
...

Allocations
ID        Node ID   Task Group  Version  Desired  Status   Created    Modified
1afe229e  3008ce71  puma        123      run      running  2d20h ago  2d20h ago
ff39a003  3008ce71  puma        123      run      running  2d20h ago  2d20h ago
9bd5fa5d  5163a6cb  puma        123      run      running  2d20h ago  2d20h ago
e5353169  3008ce71  sidekiq     123      run      running  2d20h ago  2d20h ago

### SECOND COMMAND ###
# Run a shell in the sidekiq container, given Allocation ID from the previous command
$ nomad alloc exec -i -t -task sidekiq e5353169  /bin/bash

# Now we're in the sidekiq container
root@d60b9bcf4827:/myapp#
```

## The Problem

Not only does this require two commands, but it also requires visually scanning the output of the status command to find the Allocation ID of the sidekiq container, then copying it to paste into the second command to run a shell in this container.  If this was required only once in a while, it would be fine to leave as is. But this is a task everyone on our team has to do frequently, and the manual effort was getting tedious. Since we're a Ruby shop, it was a natural fit to use Ruby to help with automating this.

## Script Solution

Here is the script that allows the above workflow to be completed in one step, with no copy/pasting. It's placed in the `script` directory in the project root. Don't worry if it seems hard to understand, all will be explained.

```bash
#!/bin/bash

# USAGE: ./script/run-nomad-shell.sh

# Parse sidekiq allocation ID from status output, storing it in $id variable
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))

# Run a shell in sidekiq allocation parsed from previous step
nomad alloc exec -i -t -task sidekiq $id /bin/bash
```

The first line uses a chain of ruby one-liners to execute the `nomad status` command, and parse it with regex to capture the sidekiq container allocation ID. The result of the regex capture group gets stored in a script variable `id`. This variable is then used in the second command to run a shell in the container.

The second command is fairly straightforward, but the first command looks a little hairy, let's break it down.

### Ruby One Liners

First thing you might notice in this line from the script is that ruby is being executed, but with a `-e` flag:

```bash
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))
```

Normally when running a Ruby program, the file name containing the source code is passed to the `ruby` command line:

```
ruby my_program.rb
```

However, for short programs (aka one liners), the `-e` flag can be used to pass some code directly as an argument:

```
ruby -e "puts 'One Liner!'"
# Outputs: One Liner!
```

Further reading on Ruby [one liners](https://learnbyexample.github.io/learn_ruby_oneliners/one-liner-introduction.html).

### System Commands

Another thing to notice in this line from the script is the use of backticks surrounding `nomad status myapp`:

```bash
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))
```

Backticks are used in Ruby to run system commands. For example, the `date` command in *nix displays the system date and time:

```bash
$ date
# Outputs something like: Mon 21 Feb 2022 10:51:36 EST
```

This can also be run within a Ruby program, to try it out, launch an IRB console:

```ruby
`date`
=> "Mon 21 Feb 2022 10:53:56 EST\n"
```

Notice the output of the system command is a string ending with the newline character `\n`.

This technique can also be used in a one-liner with the `-e` flag, but in this case, the backticks must be escaped, otherwise it will result in a syntax error:

```
ruby -e "\`date\`"
```

Unlike when running in IRB, there is no output from the above. This is because the Ruby code passed via the `-e` flag is not running any command that would output something to the console like `puts`. If you wanted to see the output of the system `date` command returned to the console:

```
ruby -e "puts \`date\`"
# Outputs something like: Mon 21 Feb 2022 11:09:13 EST
```

### Regex

Next we're going to focus on what the first Ruby one liner is executing in the script:

```bash
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))
```

In the previous step, we learned that surrounding a system command with escaped backticks will run that command and return the string output of that command. In the case of the `nomad status myapp` command, this will be a multi-line string containing all of the job information and list of allocations.

The next part of the command is the `=~` operator. This is the pattern matching operator in Ruby. It takes a string and a regular expression, and returns the index of the first occurrence where the regular expression matches in the string, or `nil` if there is no match. In Ruby, a regular expression can be denoted with forward slashes. So the general form of the `=~` operator is:

```ruby
some_string =~ /some_regex/
```

Let's look at a simple example. Suppose `some_string` contains just a single line from the `nomad status myapp` command, the line that lists the sidekiq allocation ID. Run the following from an IRB console:

```ruby
some_string = "d5353168  2008ce70  sidekiq     191      run      running  2d20h ago  2d20h ago"
some_string =~ /sidekiq/
=> 20
# 20 is the index of the first occurrence of the match `sidekiq` in some_string
```

Ultimately, we want to be able to extract the value of the allocation ID, which is the first sequence of letters and numbers in this string. The first thing to understand is that we can also match on [Shorthand Character Classes](https://www.regular-expressions.info/shorthand.html).

For example, the `\w` shorthand will match on any letter, number or underscore. The `\s` shorthand will match on any whitespace including tabs, space character and newlines.

Continuing in the IRB console with the previous example:

```ruby
some_string =~ /\w/
=> 0
# some_string starts with a `d` which is a letter so first match is 0
some_string =~ /\s/
=> 8
# first occurrence of a space character in some_string is at position 8
```

### Capture Group

To extract a particular value from a string, we need to use a capture group. The syntax is to enclose the "captured" portion of the regex in parenthesis. The captured value is then available in a special variable `$1` (if there are multiple capture groups within a regex, then second value is available in special variable `$2` etc.). For example, to capture the first letter or number from our example string:

```ruby
some_string =~ /(\w)/
=> 0
$1
=> "d"
```

<aside class="markdown-aside">
Retrieving the result of a capture group using the $1, $2 etc. special variables is fine for simple one-liners as in this example. However, if your program is more complicated, it's recommended to use the match method instead of the =~ operator, and use the resulting <a class="markdown-link" href="https://rubyapi.org/3.1/o/matchdata">MatchData</a> object that is returned.
</aside>

To capture the first "chunk" of letters and numbers, up until a non letter/number character is encountered, add the `+` modifier to the shorthand character class which means match one or more:

```ruby
some_string =~ /(\w+)/
=> 0
$1
=> "d5353168"
```

This looks like what we need, the allocation ID of the sidekiq task. However, recall we set `some_string` to just one line within the output for demonstration purposes. The actual full output of the `nomad status myapp` command will be a larger string, composed of multiple lines separated by newline characters `\n`.

Something like this - I've split it up into separate lines for legibility but it would actually be one big string:

```
"Name          = myapp\nType          = service\nStatus        = running\n
Allocations\nID        Node ID   Task Group  Version  Desired  Status   Created    Modified\n
0afe229d  2008ce70  puma        191      run      running  2d20h ago  2d20h ago\n
fa39a002  2008ce70  puma        191      run      running  2d20h ago  2d20h ago\n
8bd5fa5c  4163a6ca  puma        191      run      running  2d20h ago  2d20h ago\n
d5353168  2008ce70  sidekiq     191      run      running  2d20h ago  2d20h ago\n"
```

This means the regex to capture only the sidekiq allocation id is a little more complicated. Describing it in English would read like:

Find a line that starts with a series of letters and numbers, followed by a series of space characters, followed by another series of letters/numbers, followed by a series of space characters, followed by the word sidekiq, followed by any number of any characters, and then capture the first series of letters and numbers.

To express this as a regex, let's break down that sentence into sections and write down the portion of the regex just for that part:

* Find a line that starts with a series of letters and numbers: `^\w+` (caret `^`matches start of string)
* Followed by a series of space characters: `\s+`
* Followed by another series of letters/numbers: `\w+`
* Followed by a series of space characters: `\s+`
* Followed by the word sidekiq: `sidekiq`
* Followed by any number of any characters: `.*` (dot `.` means any character, `*` means 0 or more times)
* And then capture the first series of letters and numbers: Add parents to first part: `^(\w+)`

Putting this all together results in the following regex to be used in the script:

```ruby
/^(\w+)\s+\w+\s+sidekiq.*/
```

Want to learn more about Ruby and Regex? Checkout this fantastic [tutorial](https://www.rubyguides.com/2015/06/ruby-regex/).

### Chaining  Multiple One Liners

Remember that to retrieve the result of a capture group requires a second line of code, to access the special variable `$`:

```ruby
some_string =~ /(\w+)/
=> 0
$1
=> "d5353168"
```

To get this effect in our script will require chaining together multiple `ruby -e` commands. The first command will execute the system command `nomad status myapp` and match it against the regex explained in the previous section. The second command will simply use the ruby `puts` command to output the value of the capture group in the `$1` special variable to the console. The dollar portion of the special variable must be escaped when run via `ruby -e`:

```
ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"
# Outputs value in capture group, which is the sidekiq allocation ID: d5353168
```

### Converting to Script Variable

Now that the value of the sidekiq allocation ID has been output to the console, it has to get stored in a script variable. In other words, we're going to exit Ruby land and go back to Bash.

The first step is to wrap the chain of ruby one liners in `echo $(...)` which runs it in a subshell and returns the value. Finally wrap that whole expression in another `$(...)` and assign the result to the `id` variable, which can then be used for the second command which is to run a shell in the sidekiq container:

Putting this all together:

```bash
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))
nomad alloc exec -i -t -task sidekiq $id /bin/bash
```

Finally, save these lines in a file with a shebang, usage, and comments. Remember to make the file executable:

```bash
#!/bin/bash

# USAGE: ./script/run-nomad-shell.sh

# Parse sidekiq allocation ID from status output, storing it in $id variable
id=$(echo $(ruby -e "\`nomad status myapp\` =~ /^(\w+)\s+\w+\s+sidekiq.*/" -e "puts \$1"))

# Run a shell in sidekiq allocation parsed from previous step
nomad alloc exec -i -t -task sidekiq $id /bin/bash
```

Note that the `$1` is not a bash script variable, that's the result of the capture group from matching on the regex with ruby.

## Generalizing the Example

The example in this post went into detail on my specific use case which was to capture a specific allocation ID from a Nomad status command, and then use that to launch a shell in that container. But this technique can be applied more generally anytime you want to run a system command, and then use the output from that command as input to a further command. The steps are:

* Run the first system command at your usual shell and write a regex with capture group that will capture the value you want from the output.
* Use `ruby -e` to run the first system command, matching on the regex you wrote in the previous step.
* Chain it with a second `ruby -e` to output the result of the capture group using the `$1` special variable.
* Wrap it with $(...), echo it, then one more $(...) wrap and assign to a script variable.
* Use the script variable in the next system command.

## Conclusion

This post has covered how Ruby can be used to run and parse system command output to automate tedious tasks where multiple commands and copy/pasting values are required. I hope you'll be able to apply this technique to speed up your workflows.