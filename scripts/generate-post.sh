#!/bin/bash

# Check if the script was given exactly 2 arguments
if [ $# -ne 2 ]; then
  # Get the name and path of the script
  script_name="$(basename "$0")"
  script_path="$(dirname "$0")"

  # Print an error message and usage example
  echo "Error: 2 arguments required."
  echo "Example usage: $script_path/$script_name my-article my-category"

  # Exit with a non-zero status code to indicate an error
  exit 1
fi

# Assign the first argument to the 'article' variable and the second argument to the 'category' variable
article=$1
category=$2

# Calculate the first day of the next month and format it as 'YYYY-MM-01'
next_month=$(date -v +1m +'%Y-%m-01')

# Define the file path where the Markdown file will be created
file_path="src/markdown/${article}.md"

# Create the Markdown file and populate it with content
touch "$file_path"
cat > "$file_path" << EOL
---
title: "${article}"
featuredImage: "../images/tbd.jpg"
description: "tbd"
date: "$next_month"
category: "$category"
related:
  - "tbd"
  - "tbd"
  - "tbd"
---

Intro para...

## TODO
* title
* feature image
* related
* intro para
* main content
* conclusion para
* edit
EOL

# Check if the file was generated successfully
if [ -e "$file_path" ]; then
    echo "Generated $file_path"
else
    echo "Failed to generate the file"
fi
