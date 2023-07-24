---
title: "Maintain Node.js Version Consistency"
featuredImage: "../images/consistent-node-version-jason-leung-FAsrFrWSIqA-unsplash.jpg"
description: "Explore the benefits of using nvm to maintain consistent Node.js versions across team members and effortlessly switch between projects with different Node.js requirements."
date: "2023-12-01"
category: "web development"
related:
  - "Build and Publish a Presentation with RevealJS and Github"
  - "View Localhost on Your Phone"
  - "TDD by Example"
---

In modern web development, Node.js is not limited to Node projects; it's widely used in frontend build tooling across various tech stacks like Rails and Java Spring. This creates a challenge for developers: which Node.js version to use? Different npm packages work may only with specific Node.js versions. Furthermore, developers often work on multiple projects, and each may require a different Node.js version. This post will explain how [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) can be used to ensure a consistent Node.js environment across the project team, and make it easy to switch between different node versions when working on multiple projects.

## Install nvm

Start by going to [nvm on Github](https://github.com/nvm-sh/nvm) and following the instructions to install it. At the time of this writing, the install command is:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

Alternatively, `wget` can be used instead of `curl`:

```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

The installation command will modify your profile by detecting which of `~/.bashrc`, `~/.bash_profile`, `~/.zshrc`, or `~/.zprofile` is in use. Therefore to activate nvm after initial installation, either close the terminal application and start it again, or reload the profile. For example, if your profile is in `~/.zshrc` the command to reload is:

```bash
source ~/.zshrc
```

At this point, you should be able to use nvm to list currently installed Node.js versions:

```bash
nvm ls
```

Install a specific version:

```bash
nvm install 18.17.0

# The `nvm install` command also switches you to that Node.js version
node --version
# v18.17.0
```

Switch to a specific version, this will work assuming the specified version was previously installed:

```bash
nvm use 16.20.1
```

## Use .nvmrc file

In the previous section, we saw how `nvm install x.y.z` and `nvm use x.y.z` can be used to install and switch to specific node versions. Another feature that nvm provides is the ability to install and use a node version without having to type it in the command line. To make use of this, create a file named `.nvmrc` in the root of your project:

```bash
# in project root
touch .nvmrc
```

Edit the file so that it has a single line with the Node.js version that should be used for this project, for example:

```bash
echo "18.17.0" > .nvmrc
```

Now in this directory, you can type in:

```bash
# Will install Node v18.17.0 from .nvmrc
nvm install
```

If the node version specified in `.nvmrc` is already installed, then this will work:

```bash
# Will switch to Node v18.17.0 from .nvmrc
nvm use
```

The `.nvmrc` file can be committed to your project git repo. Then you can update the setup instructions in the project `README.md` to include the instructions to install nvm, then run `nvm install` and/or `nvm use`. This ensures that any developer working on this project will be using the same Node.js version. Furthermore, since nvm supports having multiple node versions installed at the same time, developers can easily switch between projects that have `.nvmrc` files in their roots, and use the nvm commands to quickly get the right Node.js version setup.

## Add shell integration

One slight bit of friction with the setup so far is that if you run `nvm use` in a directory with a `.nvmrc` file that specifies a Node.js version that isn't already installed, it will result in an error. For example, suppose the `.nvmrc` file specifies Node.js v20.5.0, which isn't currently installed:

```bash
# Check what Node.js version this project requires
cd /path/to/some_project
cat .nvmrc
# 20.5.0

# Try to use it
nvm use
# Found '/path/to/some_project/.nvmrc' with version <20.5.0>
# N/A: version "v20.5.0" is not yet installed.
# You need to run `nvm install` to install and use the node version specified in `.nvmrc`.
```

It would be nice if there was some automation that could handle this - i.e. check if the Node.js version specified in `.nvmrc` is already installed, if yes, use it, otherwise, install and then use it. Fortunately, nvm provides this as well via [shell integration](https://github.com/nvm-sh/nvm#deeper-shell-integration). The idea is you can add a script to your profile that will check for a `.nvmrc` file in any directory you `cd` to, then either install or use that Node.js version automatically.

At the time of this writing, automatic shell integration is supported for the bash, zsh, and fish shells. I use zsh with my profile in `~/.zshrc`. Here are the lines I added to my profile to support automatic Node version installation and switching. It makes use of `autoload`, which is a built-in zsh function that supports loading functions only when they are needed, rather than loading them all at once when the shell starts.

I asked ChatGPT to add explanatory comments:

```bash
# This line loads the add-zsh-hook function,
# which allows you to add functions to be executed
# when a certain hook is triggered.
autoload -U add-zsh-hook

# The load-nvmrc function is defined to handle automatic
# Node.js version switching based on .nvmrc files.
load-nvmrc() {

  # Get the path of the .nvmrc file in the current directory
  # using the nvm_find_nvmrc function provided by nvm.
  local nvmrc_path="$(nvm_find_nvmrc)"

  # Check if an .nvmrc file was found in the current directory.
  if [ -n "$nvmrc_path" ]; then

    # Get the Node.js version specified in the .nvmrc file.
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    # Check if the specified Node.js version is "N/A",
    # meaning it is not installed.
    if [ "$nvmrc_node_version" = "N/A" ]; then

      # If the specified version is not installed, use nvm to install it.
      nvm install

    # Check if the current Node.js version differs from the version specified in .nvmrc.
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then

      # If the versions differ, use nvm to switch to the specified version.
      nvm use
    fi

  # If there is no .nvmrc file in the current directory but one is found in the parent directory,
  # and the current Node.js version is different from the default version, switch back to the default version.
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}

# Add the load-nvmrc function to the "chpwd" hook, which is triggered whenever the current working directory changes.
add-zsh-hook chpwd load-nvmrc

# Call the load-nvmrc function initially to set the Node.js version based on the .nvmrc file in the current directory.
load-nvmrc
```

With nvm shell integration in place, being on the right Node.js version is even easier, as you don't need to remember to do anything, your shell will handle all the work for you. For example, suppose you frequently toggle between two projects, one of which uses Node.js LTS and another which uses Current (18.17.0 and 10.5.0 respectively  at the time of this writing), with a directory structure similar to the following:

```
.
├── current_project
│   ├── .nvmrc
│   └── app
│       └── index.js
└── lts_project
    ├── .nvmrc
    └── app
        └── index.js
```

WIP...

```
Found '/path/to/lts_project/.nvmrc' with version <18.17.0>
Downloading and installing node v18.17.0...
Downloading https://nodejs.org/dist/v18.17.0/node-v18.17.0-darwin-arm64.tar.xz...
######################################################################################################################################################################################################### 100.0%
Computing checksum with shasum -a 256
Checksums matched!
Now using node v18.17.0 (npm v9.6.7)
```

```
Reverting to nvm default version
Now using node v18.16.1 (npm v9.5.1)
```

## TODO
* aside: after intro para: post assumes familiarity with Node.js, link to learning resources.
* maybe explain problem more in depth? i.e. if install whichever is latest LTS or Current from https://nodejs.org/en, but when project was originally setup, might have been an older version, so if a new developer joins and installs latest, they may encounter errors when running `npm install`, or experience different behavior in the app if the project assumes an older node version. Also when switching to a different project, if it needs a different node version, would have to uninstall, then re-install from the previous releases: https://nodejs.org/en/download/releases. This is tedious if you switch projects frequently.
* aside: after installation section: If you're extra safety conscious, you can also download the nvm source from the latest release on github: https://github.com/nvm-sh/nvm/releases, extract the source zip, review the `install.sh` script and run it directly in your terminal rather than piping through bash from `raw.githubusercontent`.
* aside: somewhere add a note about Windows, either use WSL or nvm-windows (ref nvm readme...)
* link to nvm readme sub-sections for: bash, zsh, and fish shells
* default explanation?
