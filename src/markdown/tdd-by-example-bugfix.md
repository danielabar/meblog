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

The expected format for the input csv is: `date in YYYY-MM-DD format,numeric spending amount,spending category,store`. However, the second line has a typo in the date, there's a `,` where the second `-` should be. But, `2021-04` is a valid date. So what the program did is take the first field `2021-04` as the date, then the second "field", which was really the date portion of `24` as the amount field, then the amount field of `194.87` which was now the third field got tracked as a category, and the actual category `Groceries` was now the fourth field and got tracked as the store. The final field `Metro` which is the actual store ended up in the fifth position and was ignored entirely. This is how the spending of `$194.87` got incorrectly recorded as `$24.00` and that's how total spending for April was under-reported.

Looking at the code, I realized there was no validation of the input file. It's read in via a csv stream library and processed one line at a time, assuming each line is in the expected format.

TODO: Show snip of relevant code...

Aside: Some of you may be wondering why write a custom program for expense tracking when there's Excel and countless free apps out there, a [short explanation here](https://github.com/danielabar/tidysum#why-not-use-excel).