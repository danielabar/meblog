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

In modern web development, Node.js is not limited to Node projects; it's widely used in frontend build tooling across various tech stacks like Rails and Java Spring. This creates a challenge for developers: which Node.js version to use? Some npm packages may only work with specific Node.js versions. Furthermore, developers often work on multiple projects, and each may require a different Node.js version. This post will explain how [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) can be used to ensure a consistent Node.js environment across the project team, and make it easy to switch between different node versions when working on multiple projects.

<aside class="markdown-aside">
This post assumes a basic understanding of what Node.js is and how it works. If you're new to it or need a refresher, check out the official <a class="markdown-link" href="https://nodejs.org/en">Node.js website</a> and <a class="markdown-link" href="https://nodejs.org/en/docs">documentation<a>.
</aside>

## The Problem

Before getting into the details of how to use nvm, let's review what the problem is. If a project was originally set up with a specific Node.js version, as time goes on, newer LTS or Current versions are released. The default approach for many developers might be to install the latest available version from the official [Node.js website](https://nodejs.org/en). However, this approach can lead to issues when new team members join the project. If a new developer installs the latest Node.js version without considering the project's original setup, it may result in errors while running `npm install` or, even worse, cause unexpected behavior in the application if it relies on assumptions made for an older Node.js version.

Moreover, when switching to work on a different project, which might require a specific Node.js version, the developer would have to uninstall the current version and manually install the required version from the list of previous [Node.js releases](https://nodejs.org/en/download/releases). This process becomes tedious, especially for developers who frequently switch between different projects. As such, a version management solution like nvm (Node Version Manager) becomes crucial to ensure consistency and avoid compatibility issues across various projects.

## Install nvm

Start by going to [nvm on Github](https://github.com/nvm-sh/nvm) and following the instructions to install it. At the time of this writing, the install command is:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# OR
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

The installation command will modify your profile by detecting which of `~/.bashrc`, `~/.bash_profile`, `~/.zshrc`, or `~/.zprofile` is in use. Therefore to activate nvm after initial installation, either close the terminal application and start it again, or reload the profile. For example, if your profile is in `~/.zshrc` the command to reload is:

```bash
source ~/.zshrc
```

<aside class="markdown-aside">
If you're particularly safety conscious, an alternative approach to installing nvm is to download the nvm source directly from the latest <a class="markdown-link" href="https://github.com/nvm-sh/nvm/releases">release on GitHub</a> and review the "install.sh" script to ensure its integrity. Then, instead of piping the script through bash from raw.githubusercontent, you can run the script directly in your terminal.
</aside>

If you're a Windows user, see these [important notes](https://github.com/nvm-sh/nvm#important-notes) about nvm support for Windows.

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

# It also installs npm
npm --version
# 9.6.7
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

At the time of this writing, automatic shell integration is supported for the [bash](https://github.com/nvm-sh/nvm#bash), [zsh](https://github.com/nvm-sh/nvm#zsh), and [fish](https://github.com/nvm-sh/nvm#fish) shells. I use zsh with my profile in `~/.zshrc`. Here are the lines I added to my profile to support automatic Node version installation and switching. I asked ChatGPT to add explanatory comments:

```bash
# ~/.zshrc

# My profile things...

# This section was added by the nvm install script
# and initializes nvm:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Add this section for shell integration AFTER nvm initialization:

# Add functions to be executed when a hook is triggered.
autoload -U add-zsh-hook

# Handle automatic Node.js version switching based on .nvmrc files.
load-nvmrc() {

  # Get the path of the .nvmrc file in the current directory
  local nvmrc_path="$(nvm_find_nvmrc)"

  # Check if an .nvmrc file was found in the current directory.
  if [ -n "$nvmrc_path" ]; then

    # Get the Node.js version specified in the .nvmrc file.
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    # Check if the specified Node.js version is "N/A" (not installed)
    if [ "$nvmrc_node_version" = "N/A" ]; then

      # If the specified version is not installed, use nvm to install it.
      nvm install

    # Check if the current Node.js version differs
    # from the version specified in .nvmrc.
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then

      # If the versions differ, use nvm to switch to the specified version.
      nvm use
    fi

  # If there is no .nvmrc file in the current directory
  # but one is found in the parent directory,
  # and the current Node.js version is different from the default version,
  # switch back to the default version.
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}

# Add the load-nvmrc function to the "chpwd" hook,
# which is triggered whenever the current working directory changes.
add-zsh-hook chpwd load-nvmrc

# Call the load-nvmrc function initially to set the
# Node.js version based on the .nvmrc file in the current directory.
load-nvmrc
```

With nvm shell integration in place, being on the right Node.js version is even easier, as you don't need to remember to do anything, your shell will handle all the work for you. For example, suppose you frequently toggle between two projects, one of which uses Node.js LTS and another which uses Current (18.17.0 and 20.5.0 respectively at the time of this writing), with a directory structure similar to the following:

```
.
├── current_project
│   ├── .nvmrc # contains 20.5.0
│   └── app
│       └── index.js
└── lts_project
    ├── .nvmrc # contains 18.17.0
    └── app
        └── index.js
```

Now you want to work on `current_project` but don't have that Node.js version installed. When you `cd` into the project directory, the code you added to your profile for shell integration will detect this and automatically install the correct version as follows:

```bash
cd /path/to/current_project
# Found '/path/to/current_project/.nvmrc' with version <20.5.0>
# Downloading and installing node v20.5.0...
# Downloading https://nodejs.org/dist/v20.5.0/node-v20.5.0-darwin-arm64.tar.xz...
######################################################################################################################################################################################################### 100.0%
# Computing checksum with shasum -a 256
# Checksums matched!
# Now using node v20.5.0 (npm v9.8.0)
```

Now if you need to switch to `lts_project` and already have that Node.js version installed, the shell integration will automatically switch to that, without attempting to install it again:

```bash
cd /path/to/lts_project
# Found '/path/to/lts_project/.nvmrc' with version <18.17.0>
# Now using node v18.17.0 (npm v9.6.7)
```

Switching to a directory that doesn't have a `.nvmrc` file will make the shell integration code revert to the default Node.js version, for example:

```bash
cd ~/Documents
# Reverting to nvm default version
# Now using node v18.16.1 (npm v9.5.1)
```

## Conclusion

This post has covered the benefits of using [nvm](https://github.com/nvm-sh/nvm) for web development. With the ability to easily manage different Node.js versions, nvm ensures a consistent environment across projects and simplifies the process of switching between versions. The use of the `.nvmrc` file supports specifying required Node.js versions per project, streamlining the setup for developers. Additionally, nvm's shell integration automates the installation and usage of specific Node.js versions, further enhancing productivity.
