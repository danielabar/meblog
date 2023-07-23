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
```

Switch to a specific version (assuming it was previously installed:

```bash
nvm use 16.20.1
```

## Use .nvmrc file

## Add shell integration

## TODO
* aside: after intro para: post assumes familiarity with Node.js, link to learning resources.
* maybe explain problem more in depth? i.e. if install whichever is latest LTS or Current from https://nodejs.org/en, but when project was originally setup, might have been an older version, so if a new developer joins and installs latest, they may encounter errors when running `npm install`, or experience different behavior in the app if the project assumes an older node version. Also when switching to a different project, if it needs a different node version, would have to uninstall, then re-install from the previous releases: https://nodejs.org/en/download/releases. This is tedious if you switch projects frequently.
* aside: after installation section: If you're extra safety conscious, you can also download the nvm source from the latest release on github: https://github.com/nvm-sh/nvm/releases, extract the source zip, review the `install.sh` script and run it directly in your terminal rather than piping through bash from `raw.githubusercontent`.
* aside: somewhere add a note about Windows, either use WSL or nvm-windows (ref nvm readme...)

### Annotated shell integration

Maybe work this in somehow for deeper explanation of shell integration?

```bash
# This line loads the add-zsh-hook function, which allows you to add functions to be executed when a certain hook is triggered.
autoload -U add-zsh-hook

# The load-nvmrc function is defined to handle automatic Node.js version switching based on .nvmrc files.
load-nvmrc() {

  # Get the path of the .nvmrc file in the current directory using the nvm_find_nvmrc function provided by nvm.
  local nvmrc_path="$(nvm_find_nvmrc)"

  # Check if an .nvmrc file was found in the current directory.
  if [ -n "$nvmrc_path" ]; then

    # Get the Node.js version specified in the .nvmrc file.
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    # Check if the specified Node.js version is "N/A", meaning it is not installed.
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

re: `autoload`:

In the context of the zsh shell (Z Shell), autoload is a built-in zsh function that allows you to load functions only when they are needed, rather than loading them all at once when the shell starts. This feature helps to improve shell startup time and memory usage, especially when dealing with large shell configurations or frameworks with many functions.

When you use autoload, the actual function code is not loaded into memory until the function is called for the first time. This lazy loading mechanism allows zsh to defer loading the function until it is explicitly invoked, making the shell more efficient.
