#!/bin/bash

# Check if a filename is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <filename.md>"
  exit 1
fi

# Extract titles and first sentences
grep -E '^## ' "$1" | \
awk 'BEGIN { FS="## " } {print $2}' | \
while read -r title; do
  # Extract the first sentence (assumes the first sentence ends with a period)
  first_sentence=$(echo "$title" | awk -F '\. ' '{print $1}')
  echo "Title: $title"
  echo "First Sentence: $first_sentence"
  echo "----------------------"
done
