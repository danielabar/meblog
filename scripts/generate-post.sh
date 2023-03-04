#!/bin/bash

if [ $# -ne 2 ]; then
  script_name="$(basename "$0")"
  script_path="$(dirname "$0")"
  echo "Error: 2 arguments required."
  echo "Example usage: $script_path/$script_name my-article my-category"
  exit 1
fi

article=$1
category=$2
next_month=$(date -v +1m +'%Y-%m-01')

touch "src/markdown/${article}.md"
cat > "src/markdown/${article}.md" << EOL
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
* something
EOL
