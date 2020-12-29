---
title: "TDD by Example"
featuredImage: "../images/snippet-riyaz-hyder-czc72SCP5C4-unsplash.jpg"
description: "A practical example of using TDD to add a new feature to an existing project."
date: "2021-01-03"
category: "javascript"
---

If you've been coding for any length of time, you've probably heard that you should test your code, and by that I mean writing automated tests. This can be challenging at first, but with some practice, it becomes easier.

When first learning to write tests, it's easier to have already written the production code, then open up another editor tab side by side with that code, and write some tests against that code. However, there's another approach to writing tests called [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development), aka TDD. According to Wikipedia, TDD is:

> A software development process relying on software requirements being converted to test cases before software is fully developed, and tracking all software development by repeatedly testing the software against all test cases. This is opposed to software being developed first and test cases created later.

In practice what this means is, suppose you want to add a new feature to some software. You would first write a test for that feature and run the test. The test would of course fail since the new feature hasn't been written yet. Then you write just enough code to get that test to pass. When it passes, then you add another test for this feature, run it to see that it fails, write more code to get this to pass, and continue until the feature is complete. Typically the first test you write would be for the "happy path", then next test would be for an edge case such as invalid input and so on. This is much harder to do because you don't have the actual code to look at, instead you have to picture what the result of the code should be and write a test to expect that result. In fact, this is the benefit of TDD. You end up with tests that verify the results of the code, rather than implementation details. But the first time you try this, can be difficult to know where to start.

This post will walk you through an example of using TDD that I did recently to add a new feature to [Tidysum](https://github.com/danielabar/tidysum). I will assume that you already know how to write tests generally, but are new to TDD specifically.

First, what is Tidysum? Tidysum is a personal finance app that takesin a list of daily expenses and outputs a summary json file with month and year breakdowns of these expenses by category, sums of total and average spending per month and per year, and makes savings and spending reduction recommendations if provided fixed monthly expenses and monthly income. The feature I added was a percentage difference calculation for total and by-category spending year over year. The idea was to calculate a personalized rate of inflation based on your actual spending, rather than some theoretical basket of goods determined by government bureaucrats.

Aside: I was inspired to add this after learning from several finance podcasts that the official government inflation numbers may not reflect reality as they don't include food and energy. As many government benefits are indexed to inflation, as are many employers annual cost of living increases, it may benefit some to have this number reported as lower than it really is. The inflation number is also used in personal finance for retirement planning and so can be disastrous if incorrect. Of course there's nothing I can do about the big macro, but as a developer, I can improve my software to generate more personalized information to help people make better decisions.

Ok back to TDD. Tidysum reads in a csv file of expenses like this (abbreviated, but imagine this goes on for several years):

```csv
2018-01-01,...
2018-10-01,34.29,Groceries,Loblaws
2018-10-01,133.99,Restaurant,The Keg
2018-10-04,5.99,Entertainment,Amazon
2018-10-15,54.00,Groceries,Loblaws
2018-11-15,11.67,Health,Loblaws
2019-10-15,120,Groceries,Loblaws
2019-10-20,20,Restaurant,Dominos
2019-10-25,10.00,Entertainment,Apple
2019-11-10,12.49,Health,Whole Foods
...
2020-12-24,...
```

And generates a summary json where each key is the year. Each year shows the total spending for that year, and then has another object where each key is the month in that year. Each month shows total spending for that month, as well as the breakdown by category and by merchant.

Each year also has an `average` section, where it shows on average how much was spent each month, and again, an average breakdown by category. The summary looks something like this:

```json
{
  "2018": {
    "total": "239.94",
    "Oct": {
      "total": "228.27",
      "byCategory": {
        "Groceries": "88.29",
        "Restaurant": "133.99",
        "Entertainment": "5.99"
      },
      "byMerchant": {
        "Loblaws": "88.29",
        "The Keg": "133.99",
        "Amazon": "5.99"
      }
    },
    "Nov": {
      "total": "11.67",
      "byCategory": {
        "Health": "11.67"
      },
      "byMerchant": {
        "Loblaws": "11.67"
      }
    },
    "average": {
      "monthly": "119.97",
      "byCategory": {
        "Groceries": "44.15",
        "Restaurant": "67.00",
        "Entertainment": "3.00",
        "Health": "5.84"
      }
    }
  },
  "2019": {
    "total": "162.49",
    "Oct": {
      "total": "150",
      "byCategory": {
        "Groceries": "120",
        "Restaurant": "20",
        "Entertainment": "10.00"
      },
      "byMerchant": {
        "Loblaws": "120",
        "Dominos": "20",
        "Apple": "10.00"
      }
    },
    "Nov": {
      "total": "12.49",
      "byCategory": {
        "Health": "12.49"
      },
      "byMerchant": {
        "Whole Foods": "12.49"
      }
    },
    "average": {
      "monthly": "81.25",
      "byCategory": {
        "Groceries": "60.00",
        "Restaurant": "10.00",
        "Entertainment": "5.00",
        "Health": "6.25"
      }
    }
  }
}
```

What I wanted to add was another per year entry to show the percentage difference in total and per category spending as compared to the previous year, something like this:

```json
{
  "2018": {
    "total": "239.94",
    "Oct": {
      "total": "228.27",
      "byCategory": {
        "Groceries": "88.29",
        "Restaurant": "133.99",
        "Entertainment": "5.99"
      },
      "byMerchant": {
        "Loblaws": "88.29",
        "The Keg": "133.99",
        "Amazon": "5.99"
      }
    },
    "Nov": {
      "total": "11.67",
      "byCategory": {
        "Health": "11.67"
      },
      "byMerchant": {
        "Loblaws": "11.67"
      }
    },
    "average": {
      "monthly": "119.97",
      "byCategory": {
        "Groceries": "44.15",
        "Restaurant": "67.00",
        "Entertainment": "3.00",
        "Health": "5.84"
      }
    },
    "percentageDiffPreviousYear": "N/A"
  },
  "2019": {
    "total": "162.49",
    "Oct": {
      "total": "150",
      "byCategory": {
        "Groceries": "120",
        "Restaurant": "20",
        "Entertainment": "10.00"
      },
      "byMerchant": {
        "Loblaws": "120",
        "Dominos": "20",
        "Apple": "10.00"
      }
    },
    "Nov": {
      "total": "12.49",
      "byCategory": {
        "Health": "12.49"
      },
      "byMerchant": {
        "Whole Foods": "12.49"
      }
    },
    "average": {
      "monthly": "81.25",
      "byCategory": {
        "Groceries": "60.00",
        "Restaurant": "10.00",
        "Entertainment": "5.00",
        "Health": "6.25"
      }
    },
    "percentageDiffPreviousYear": {
      "total": "-32.28",
      "Groceries": "35.9",
      "Restaurant": "-85.07",
      "Entertainment": "66.67",
      "Health": "7.02"
    }
  }
}
```

So for the first recorded year, `percentageDiffPreviousYear` would be `N/A` because there's nothing to compare it to. Then for the following year, it should calculate percentage difference in total and by category spending as compared to the previous year.

This kind of problem lends itself very well to TDD because the desired output is exactly known. And this is exactly what goes in the tests.

Ok let's get into the code. Recall this project already exists and most of the code is already written. The processing of the file happens in a function named `processFile` in the `lib/expense.js` module. It first generates the `expenseSummary` by reading the expense csv line by line. then it goes over the expense summary to add in the averages - this part is delegated to a `calculator` module in a method named `calcAvg`.

```javascript
// lib/expense.js
const csv = require('csv-streamify');
const calculator = require('./calculator');
const recommendation = require('./recommendation');
// other imports...

async function process(inputFile, mothlyIn, fixedExp) {
  const expenseSummary = await processFile(inputFile);
  const expenseSummaryWithAvg = calculator.calcAvg(expenseSummary);
  if (mothlyIn && fixedExp) {
    recommendation.determine(expenseSummaryWithAvg, mothlyIn, fixedExp);
  }
  // TODO: Calculate percentage diff year over year
  return expenseSummaryWithAvg;
}

async function processFile(file) {
  // Use csv-streamify to stream in input csv and generate expense summary json object
  // Details are not relevant for this post, see project on github for complete code.
}

// rest of functions...

module.exports = {
  process,
};
```

My thought was after the averages have been added to the expense summary, it would be a good time to further process `expenseSummaryWithAvg` to add the percentage differences. Since the average calculation is delegated to the calculator module, it makes sense to delegate percentage difference calculation to this module as well. So it will look something like this:

```javascript
languageasync function process(inputFile, mothlyIn, fixedExp) {
  const expenseSummary = await processFile(inputFile);
  const expenseSummaryWithAvg = calculator.calcAvg(expenseSummary);
  if (mothlyIn && fixedExp) {
    recommendation.determine(expenseSummaryWithAvg, mothlyIn, fixedExp);
  }
  // NEW LINE ADDED HERE:
  const withYearlyDiff = calculator.calcYearlyDiff(expenseSummaryWithAvg);
  return withYearlyDiff;
}
```

Now instead of jumping in to add a new method `calcYearlyDiff` to the calculator module and implement it, this is where the TDD approach will come in. Let's first add a test to specify what should be the expected output of this method.

This project uses the [Mocha](https://mochajs.org/) test framework and [Chai](https://www.chaijs.com/api/assert/) for assertions, but TDD principles can be used with any testing library.

Here are the existing calculator tests:

```javascript
// test/lib/calculator.test.js
const calculator = require('../../lib/calculator');
const { expect } = require('chai');

describe('calculator', () => {
  describe('calcAvg', () => {
    // tests for existing calcAvg method
  });
});
```

We know the calculator module needs to have a new method `calcYearlyDiff` so let's add a test for that:

```javascript
// test/lib/calculator.test.js
const calculator = require('../../lib/calculator');
const { expect } = require('chai');

describe('calculator', () => {
  describe('calcAvg', () => {
    // tests for existing calcAvg method
  });

  describe('calcYearlyDiff', () => {
    it('calculates percentage difference in total and categories compared to previous year', () => {
      // do test things here!
    });
  });
});
```
