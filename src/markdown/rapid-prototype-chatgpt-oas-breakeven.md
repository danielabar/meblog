---
title: "Rapid Prototyping with ChatGPT: OAS Pension Breakeven Calculator"
featuredImage: "../images/rapid-prototype-oas-milad-fakurian-ePAL0f6jjr0-unsplash.jpg"
description: "tbd"
date: "2024-12-01"
category: "productivity"
related:
  - "Promotional interest rates and the fine print"
  - "Saving on monthly expenses - A Cautionary Tale"
  - "Build and Publish a Presentation with RevealJS and Github"
---

When building software, especially for complex financial scenarios, it's crucial to determine if you're on the right track before investing significant effort in selecting the language to build in, framework, architecture, ensuring 100% test coverage, and setting up CI/CD pipelines. Rapid prototyping allows you to quickly reach valuable insights and validate your approach. Recently, I had an opportunity to collaborate with [John Stapleton](https://openpolicyontario.com/), a subject matter expert on social assistance policy and poverty reduction, on an Old Age Security (OAS) breakeven calculator, targeted at low income Canadians. This post outlines how I used ChatGPT to quickly build a prototype and validate our ideas.

## Problem

Before getting into the technical details of the prototype, let's start with the problem to be addressed:

Low uptake of Old Age Security (OAS) among low-income Canadian seniors, especially immigrants without a full 40 years in Canada after the age of 18, is a significant issue. John Stapleton and I previously collaborated on a [Guaranteed Income Supplement RRSP calculator](https://rrspgiscalculator.site/), addressing the unintuitive aspects of financial planning for low-income Canadians. Our new challenge was similar: Create a tool to help seniors understand the benefits of OAS, and if low income, it's almost never a good idea to delay it.

In the Toronto Metropolitan area, where 71% of seniors are immigrants, many people turning 65 are not applying for OAS due to:

1. Attempting to attain more qualifying years for OAS.
2. Understanding that waiting until age 70 increases their monthly payments.
3. Mainstream advice from private planners advocating for delaying OAS. This advice is sound if the money is not required and there is no eligibility for Guaranteed Income Supplement (GIS). However, for those eligible for significant GIS amounts, waiting might not be in their best interest.

The goal is to build a free online tool to illustrate these nuances effectively, and encourage people who would benefit to apply for OAS benefits as soon as possible rather than delaying.

## Business Rules

Another thing to understand before getting into the technical details is the business rules around OAS. They are as follows:

1. To receive the full monthly OAS pension amount, you must have 40 years of residency as an adult (after age 18) in Canada, at the time you turn 65.
2. If you have less than 40 years residency, you qualify for 1/40th of the full amount for every year. For example, 35 years of residency would qualify for 35/40 fraction of the full amount.
3. For every month after 65 that you delay taking OAS, the monthly amount you're entitled to when you do start increases by 0.6%, up to a maximum of 5 years, i.e. 60 months. So the most it could increase would be 0.6% * 60 = 36%.
4. Canadians whose income is below the cutoff for GIS (Guaranteed Income Supplement), also qualify for an additional top up to their OAS, however they must claim OAS to also receive the GIS amount.

TODO: Address a common misunderstanding:
Note that delaying past age 65 does *not* increase the residency amount. For example, someone who has 35 years of residency by the time they turn 65 will not get an additional 5/40ths of the pension amount by delaying to age 70. They will however get the 36% delay bump, but that's 36% of the amount based on their 35 years of residency.

TODO Aside: There's actually more nuance, but these additional details not required for the prototype, for those who would like to learn more see the govt canada website at https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html.

## Initializing the Prototype

The idea was to get something that the subject matter expert and others could try out as quickly as possible. Our budget was exactly $0.00, so it had to be something that could be hosted for free. In this case, a static website hosted on [GitHub Pages](https://pages.github.com/) is the perfect solution. It doesn't even require purchasing a domain as GitHub will generate a publicly accessible url based on your GitHub username and repository name.

TODO: Aside domain + CNAME

The simplest possible implementation would be a single `index.html` containing all the markup, and logic in a script tag `<script>...</script>`. I didn't want to spend time setting up a build system. I envisioned from pushing any changes, to immediately having the new code available. To support this setup, I setup a GitHub repository to only have a `gh-pages` branch. Then any changes pushed to the branch are automatically deployed to GitHub pages. The setup is as follows:

* While logged in to your GitHub account, create a new public GitHub repo, name it `whatever_prototype`, do not initialize repo with any files.
* Clone the repository to your laptop: `git clone..`
* `cd` into the repository you just cloned
* Create an empty branch: `git checkout --orphan gh-pages`
* Create an empty commit: `git commit --allow-empty -m "Initialize gh-pages branch"`
* Push: `git push origin gh-pages`
* Back in the GitHub web UI, go to your repo's Settings -> General, and make sure that `gh-pages` is the default branch.

Now anytime you push new changes while on the `gh-pages` branch, they will get deployed via a "pages build an deployment" workflow and publicly reachable at `https://your-username.github.io/your-repo-name/`. No need to setup this workflow, GitHub does it for you automatically for any project that has a `gh-pages` branch.

With the setup out of the way, it was time to start building.

## Building the Prototype

Recall the goal was to show that delaying OAS to a later age may not be worth it for many people as they would have to outlive the Statistics Canada life expectancy values to have more money overall by delaying.

### The Math

I started with some manual calculations, assuming the simplest case: Someone who is eligible for a full OAS pension at 65, and not eligible for GIS. For 2024, they would receive a monthly OAS amount of $713.34 if starting at age 65. This means by the time they turn 66, they would have received a total of $713.34 * 12 = $8,560.08, i.e. 12 monthly payments. And by age 67, they would have a total of $713.34 * 12 * 2 = $17,120.16, i.e. 12 monthly payments per year at 2 years. By age 70, this person would have accumulated 5 years worth of payments which is 60 months for a total of $713.34 * 12 * 5 = $42,800.40.

On the other hand, waiting until age 70 would increase the monthly payment by 36%, i.e. 0.06% for each month delay, so 5 years of delay === 60 months, and 60 * 0.06% = 36%. So that 713.34 monthly payment would turn into: $713.34 * 1.36 = $970.14. By the time this person turns 71, they would have a total of $970.14 * 12 = $11,641.68. While this sounds like an impressive amount more than the $8,560.08 amount they would have had in one year if starting at 65, the problem is they're missing out on the $42,800.40 they could have had by starting at age 65.

I explained the OAS rules above to ChatGPT and asked it to generate a table with columns for age, going from age 66 through 90, calculate the OAS amount someone would have accumulated by that age if they had started at 65, and another column for starting at 70, and then to calculate the difference between starting at 70 and 65. Here are the results (I've highlighted age 84, explanation to follow):

| Age | Start at 65 ($) | Start at 70 ($) | Difference ($) |
| --- | --------------- | --------------- | -------------- |
| 66  | 8,560.08        | 0               | -8,560.08      |
| 67  | 17,120.16       | 0               | -17,120.16     |
| 68  | 25,680.24       | 0               | -25,680.24     |
| 69  | 34,240.32       | 0               | -34,240.32     |
| 70  | 42,800.40       | 0               | -42,800.40     |
| 71  | 51,360.48       | 11,641.68       | -39,718.80     |
| 72  | 59,920.56       | 23,283.36       | -36,637.20     |
| 73  | 68,480.64       | 34,925.04       | -33,555.60     |
| 74  | 77,040.72       | 46,566.72       | -30,474.00     |
| 75  | 85,600.80       | 58,208.40       | -27,392.40     |
| 76  | 94,160.88       | 69,850.08       | -24,310.80     |
| 77  | 102,720.96      | 81,491.76       | -21,229.20     |
| 78  | 111,281.04      | 93,133.44       | -18,147.60     |
| 79  | 119,841.12      | 104,775.12      | -15,066.00     |
| 80  | 128,401.20      | 116,416.80      | -11,984.40     |
| 81  | 136,961.28      | 128,058.48      | -8,902.80      |
| 82  | 145,521.36      | 139,700.16      | -5,821.20      |
| 83  | 154,081.44      | 151,341.84      | -2,739.60      |
| <span class="markdown-table-highlight">**84**</span>  | **162,641.52**      | **162,983.52**      | **341.88**          |
| 85  | 171,201.60      | 174,625.20      | 3,423.60       |
| 86  | 179,761.68      | 186,266.88      | 6,505.20       |
| 87  | 188,321.76      | 197,908.56      | 9,586.80       |
| 88  | 196,881.84      | 209,550.24      | 12,668.40      |
| 89  | 205,441.92      | 221,191.92      | 15,750.00      |
| 90  | 214,002.00      | 232,833.60      | 18,831.60      |

The amounts represent the *total* OAS accumulated. Notice that even though starting at age 70 results in a higher monthly payment compared to starting at age 65, the *total* OAS accumulated is less up until age 84, when it starts to pull ahead. In other words, someone would have to live until at least age 84 to have a greater total amount. And even then, it's only a few hundred dollars, and their first 5 years (from 65 to 70) they had 0, and the years from 71 to 84 they had *less* than what they would have had starting earlier.

Given that according to Statistics Canada combined life expectancy for 2024 is ~83, you can start to see that it may not make sense for many people to delay OAS to age 70.

### Visualization

While the table of numbers is useful, some people's eyes glaze over when presented with rows and rows of numbers. Another way to present this data could be with a line chart where:

* The horizontal `x` axis is for age (i.e. time moving forward)
* The vertical `y` axis is for total accumulated OAS

Then the two streams of income (Start at 65, Start at 70) could be visualized as two separate lines on this chart, comparing the total OAS income over time for starting payments at age 65 versus age 70. Delaying to age 70 results in a 36% increase in monthly payments, but seniors miss out on the first 5 years of payments. The line that starts at age 70 would have a greater slope because each payment is greater, but it would also start "pushed out to the right" because the payments from age 65 - 70 would be 0. The line that starts at age 65 would have a lower slope but starting right at 65. This mean the two lines would have to intersect at some point, and the age at which they intersect would be the break even age.

## TODO
* WIP main content
* WIP headings/subheadings
* conclusion para
* description meta
* edit
* TODO: Ignoring annual inflation adjustments, comparing all values in today's dollars
* TODO: Mention `npx http-server` for super quick, easy local static server in init or build prototype section
* TODO: Ref stats can life expectancy
