---
title: "TDD by Example: Fixing a Bug"
featuredImage: "../images/tdd-bug-charlotte-descamps-1sbVyhfdoQM-unsplash.jpg"
description: "A practical example of using TDD to fix a bug on an existing project."
date: "2021-05-16"
category: "javascript"
---

This post will demonstrate an example of using TDD (test driven development) to fix a bug on an existing project. If you're not familiar with TDD, see an [earlier post](/blog/tdd-by-example/) I wrote on this topic.

## Discovering the Problem

Last month when running my monthly expense report with [Tidysum](https://github.com/danielabar/tidysum) (a Node.js command line program I wrote that processes a csv list of daily expenses and outputs a summary json with year and month breakdowns of expenses by category, and makes savings/spending recommendations and calculates a personal rate of inflation), it seemed to be under-reporting April's spending by roughly $200. Although my spending has been lower during Covid times because, you know, there's nothing to do, nevertheless the total amount for April seemed unusually low.

Digging into the input `expenses.csv` file, I found the issue - notice the second line in this snip from the file:

```
...
2021-04-11,131.32,Groceries,Metro
2021-04,24,194.87,Groceries,Metro <-- BUG IN THIS LINE
2021-04-25,20.00,Gas,Shell
...
```

The expected format for the input csv is: `date in YYYY-MM-DD format,numeric spending amount,category,store`. However, the second line has a typo in the date, there's a `,` where the second `-` should be. But, `2021-04` is a valid date. So what the program did is take the first field `2021-04` as the date, then the second "field", which was really the date portion of `24` as the amount field, then the amount field of `194.87` which was now the third field got tracked as a category, and the actual category `Groceries` was now the fourth field and got tracked as the store. The final field `Metro` which is the actual store ended up in the fifth position and was ignored entirely. This is how the spending of `$194.87` got incorrectly recorded as `$24.00` and that's how total spending for April was under-reported.

Normally when a developer discovers a bug in their code, there's an instinct to dive in, figure out what's wrong and fix it as quickly as possible. But with TDD, the approach is different. After figuring out where in the code the problem lies, you first write a failing test. That is, a test that exercises the buggy portion of the code, and makes assertions assuming the bug has already been fixed. This test will fail because you haven't actually fixed it yet. Then you go in and fix the code, run the test again, and this time it should pass.

The benefit of this approach is it forces you to first think about how the code should behave under the bug circumstances by documenting it in a test. Then having the test ensures that this bug will never creep into your code again.

So first things first, let's figure out where in the code this problem with processing potentially invalid data occurs.

**Aside:** Some of you may be wondering why write a custom program for expense tracking when there's Excel and countless free apps out there, a [short explanation here](https://github.com/danielabar/tidysum#why-not-use-excel).

## Analysis

Looking at the code, I realized there was no validation of the input file. It's read in via a csv stream library and processed one line at a time, assuming each line is in the expected format. Here's the relevant code starting from the command line entrypoint:

```js
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

The critical part is this line that uses `csv-streamify` to stream in the csv file one line at a time:

```js
parser.on('data', line => {
```

At this point, `line` is an array of values from the line in the csv file that was just read. There will be one entry in the array for each value in the csv line. Then this array `line` gets passed to the `processLine` function which uses destructuring assignment to unpack the values in the `line` array into individual values:

```js
function processLine(line, output) {
  // Use destructuring assignment to unpack values out of array that csv-streamify generated from line in csv file
  const [dateStr, amountStr, category, merchant] = line;
  ...
}
```

This is where the bug occurs because if the csv line had a comma instead of an expected dash in date such as `2021-04,24,194.87,Groceries,Metro`, then the variables will be assigned as follows:

```js
line = ['2021-04', '24', '194.87', 'Groceries', 'Metro']
dateStr = '2021-04'
amountStr = '24'
category = '194.87'
merchant = 'Groceries'
// Metro is ignored
```

## Define Expectations

Now that the analysis has revealed how the bug occurs, the next step is to determine how the program *should* behave when given invalid data. This "should" behaviour will then get encoded into a test.

If this was a work project, the decision as to how the program should behave usually goes to the product manager/owner. But in this case, it's a side project which makes me the product owner so I need to decide. Given that this is a financial application, it doesn't make sense to perform *any* calculation if even a single record is invalid. This is because all the numbers get added, averaged, and compared. So even one number being off could throw off all the results.

What this means is that there should be a validation step *before* the file is processed for calculation. This validation should read in all lines of the file and for each line, check that it has exactly 4 fields. Any more or less is a sign that the data is probably incorrect. There's other things that could be validated like the date format and numeric spending amount, but will get to that later. It's easier to start with just a single validation and then add in more.

As the program finds invalid lines, it should accumulate these. For each invalid line it should record all the things that are wrong with it. For now there will only be one thing its checking (number of values), but there could be more.

Then before the program goes into the calculation step, it should check if any validation errors occurred, stop and return these instead of going into the calculation step.

## Write a Failing Test

Since the bug can be observed from the results of the `processFile` method in `lib/expense.js`, I will start with writing a test for this function. The test will provide an invalid input file to the `processFile` function, and expects some validation errors returned instead of the usual calculations that `processFile` would return.

It's very likely that the validation implementation won't go in the `processFile` method itself because the whole `lib/expense.js` module is about calculating expenses. Keeping with the [single responsibility principle](https://en.wikipedia.org/wiki/Single-responsibility_principle), the actual validation will be performed by another module, and `processFile` will just call out to it before proceeding with calculation. However, I don't want to get into any implementation details before having at least one failing test in place, and since I can see the buggy behaviour from `processFile`, this is where I'm starting with a (failing) test.

This project uses the [Mocha](https://mochajs.org/) testing library with [Chai](https://www.chaijs.com/) expect-style assertions, but the same TDD principles would apply to any test framework/library.

The `processFile` method is asynchronous because it reads in a file, so the test will also be asynchronous. As for the input file for the test, this project already has a `test/fixtures` directory, so will first write an `invalid-data.csv` test file and place it in the fixtures directory:

```
// test/fixtures/invalid-data.csv
2021-04,29,194.32,Groceries,Metro
2021-04-30,45.87,Electronics
```

This input file has two invalid lines. The first one has 5 fields and the second one has 3 fields. Recall the expectation is each line should have exactly 4 fields. The first line has an additional problem that the date format is incorrect, but for now we're only interested in the "number of fields" validation.

The test will pass the invalid file from the `test/fixtures` directory to the `processFile` function, then define an expected result object containing the line errors, then use chai's `deep.equal` assertion to verify that the actual result returned from `processFile` matches the expected result.

Where does the expected result object come from? That's my requirements that I decided on what would be a nice easy way to show the errors to the user. Remember, this isn't implemented yet, the test is how you can express the thought - "I wish the program worked like this"...

```javascript
// test/lib/expense.test.js
const { expect } = require('chai');
const expense = require('../../lib/expense');

describe('processExpenses', function() {
  describe('process', function() {
    it('Contains validation errors', async function() {
      const result = await expense.process(`${process.cwd()}/test/fixtures/invalid-data.csv`);

      const expectedResult = {
        hasErrors: true,
        lineErrors: [
          {
            line: '2021-04,29,194.32,Groceries,Metro',
            errors: ['Expected 4 fields, got 5.'],
          },
          {
            line: '2021-04-30,45.87,Electronics',
            errors: ['Expected 4 fields, got 3.'],
          },
        ],
      };
      expect(result).to.deep.equal(expectedResult);

      // Doesn't process year results from file due to validation errors
      expect(result).not.to.have.any.keys('2021');
    });
  });
});
```

Now `npm test` to run the tests, and as expected, this new test fails because validation has not yet been implemented:

![tdd bug fail 1](../images/tdd-bug-fail-1.png "tdd bug fail 1")

