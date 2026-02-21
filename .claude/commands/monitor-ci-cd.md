---
name: monitor-ci-cd
description: Get commands to monitor CI and CD workflow runs after publishing a post
---

# Monitor CI/CD Workflows

Find the latest CI and CD workflow runs and provide the commands to monitor them.

## Instructions

1. Run `gh run list --limit 10` to get recent workflow runs
2. Identify the most recent CI run (if any in progress or recently completed)
3. Identify the most recent CD run (if any in progress or recently completed)
4. Display the monitoring commands for the user to run interactively in their terminal

## Output Format

Provide clear, copy-pasteable commands:

```
📊 CI Workflow (Run ID: XXXXX) - Status: [in_progress/completed/...]

   gh run watch XXXXX

📦 CD Workflow (Run ID: YYYYY) - Status: [in_progress/completed/...]

   gh run watch YYYYY
```

## Notes

- `gh run watch` works interactively and auto-refreshes
- If a workflow is completed, still show the ID but note monitoring isn't needed
- If a workflow hasn't started yet, explain what's expected next
- The user will copy and run these commands in their terminal
