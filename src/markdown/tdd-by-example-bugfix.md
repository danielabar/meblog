---
title: "TDD by Example: Fixing a Bug"
featuredImage: "../images/tdd-bug-charlotte-descamps-1sbVyhfdoQM-unsplash.jpg"
description: "A practical example of using TDD to fix a bug on an existing project."
date: "2021-05-16"
category: "javascript"
---

This post will demonstrate an example of using TDD (test driven development) to fix a bug on an existing project. If you're not familiar with TDD, see an [earlier post](/blog/tdd-by-example/) I wrote on this topic.

## Discovering the problem

Last month when running my monthly expense report with [Tidysum](https://github.com/danielabar/tidysum) (a Node.js command line program I wrote that processes a csv list of daily expenses and outputs a summary json with year and month breakdowns of expenses by category, and makes savings/spending recommendations), it seemed to be under-reporting April's spending by roughly $200. Although my spending has been lower during Covid times because, you know, there's nothing to do, nevertheless the total amount for April seemed unusually low.

Digging into the input `expenses.csv` file, I found the issue - notice the second line in this snip from the file:

```
...
2021-04-11,131.32,Groceries,Metro
2021-04,24,194.87,Groceries,Metro
2021-04-25,20.00,Gas,Shell
...
```

The expected format for the input csv is: `date in YYYY-MM-DD format,numeric spending amount,category,store`. However, the second line has a typo in the date, there's a `,` where the second `-` should be. But, `2021-04` is a valid date. So what the program did is take the first field `2021-04` as the date, then the second "field", which was really the date portion of `24` as the amount field, then the amount field of `194.87` which was now the third field got tracked as a category, and the actual category `Groceries` was now the fourth field and got tracked as the store. The final field `Metro` which is the actual store ended up in the fifth position and was ignored entirely. This is how the spending of `$194.87` got incorrectly recorded as `$24.00` and that's how total spending for April was under-reported.

Normally when a developer discovers a bug in their code, there's a kind of instinct to dive in, figure out what's wrong and fix it as quickly as possible. But with TDD, the approach is different. After figuring out where in the code the problem lies, you first write a failing test. That is, a test that exercises the buggy portion of the code, and makes assertions assuming the bug has already been fixed. This test will fail because you haven't actually fixed it yet. Then you go in and fix the code, run the test again, and this time it should pass.

The benefit of this approach is it forces you to first think about how the code should behave under the bug circumstances by documenting it in a test. Then having the test ensures that this bug will never creep into your code again.

So first things first, let's figure out where in the code this problem with processing potentially invalid data occurs.

## Analysis

Looking at the code, I realized there was no validation of the input file. It's read in via a csv stream library and processed one line at a time, assuming each line is in the expected format. Here's the relevant code starting from the command line entrypoint:

```javascript
// index.js (entrypoint)
const expense = require('./lib/expense');

// grab the command line arguments including `argv.e` which is path to expense file
(async () => {
  const result = await expense.process(argv.e);
  fs.writeFileSync('expenses.json', JSON.stringify(result, null, 2), 'utf8');
})();

// lib/expense.js
const csv = require('csv-streamify');
const fs = require('fs');

async function process(inputFile) {
  // No validation, inputFile is passed as is to processFile function.
  const expenseSummary = await processFile(inputFile);
  return expenseSummary;
}

async function processFile(file) {
  return new Promise(resolve => {
    const output = {};
    const parser = csv();
    parser.on('data', line => {
      // csv-streamify exposes the data as an array of values from csv line
      // eg: 2020-04-29,194.23,Groceries,Metro turns into:
      // ['2020-04-29', '194.23', 'Groceries', 'Metro']
      processLine(line, output);
    });
    parser.on('end', () => {
      resolve(output);
    });
    fs.createReadStream(file, { encoding: 'utf8' }).pipe(parser);
  });
}

function processLine(line, output) {
  // Use destructuring assignment to unpack values out of array that csv-streamify generated from line in csv file
  const [dateStr, amountStr, category, merchant] = line;
  processEntry({ dateStr, amountStr, category, merchant }, output);
}

function processEntry(data, output) {
  // Begin calculations...
}
```

Aside: Some of you may be wondering why write a custom program for expense tracking when there's Excel and countless free apps out there, a [short explanation here](https://github.com/danielabar/tidysum#why-not-use-excel).