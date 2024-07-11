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

When building software, especially for complex financial scenarios, it's crucial to determine if you're on the right track before investing significant effort in perfecting the architecture, ensuring 100% test coverage, and setting up CI/CD pipelines. Rapid prototyping allows you to quickly reach valuable insights and validate your approach. Recently, I had an opportunity to collaborate with [John Stapleton](https://openpolicyontario.com/), a subject matter expert on social assistance policy and poverty reduction, on an Old Age Security (OAS) breakeven calculator, targeted at low income Canadians. This post outlines how I used ChatGPT to quickly build a prototype and validate our ideas.

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

WIP... Trying to explain the intuition behind using a line chart as a visualization...

Recall the goal was to show that delaying OAS to a later age may not be worth it for many people as they would have to outlive the Statistics Canada life expectancy values to have more money overall by delaying.

I started with some manual calculations, assuming the simplest case: Someone who is eligible for a full OAS pension at 65, and not eligible for GIS. For 2024, they would receive a monthly OAS amount of $713.34 if starting at age 65. This means by the time they turn 66, they would have received a total of $713.34 * 12 = $8,560.08, i.e. 12 monthly payments. And by age 67, they would have a total of $713.34 * 12 * 2 = $17,120.16, i.e. 12 monthly payments per year at 2 years. By age 70, this person would have accumulated 5 years worth of payments which is 60 months for a total of $713.34 * 12 * 5 = $42,800.40. You could picture this in a tabular form:

On the other hand, waiting until age 70 would increase the monthly payment by 36%, i.e. 0.06% for each month delay, so 5 years of delay === 60 months, and 60 * 0.06% = 36%. So that 713.34 monthly payment would turn into: $713.34 * 1.36 = $970.14. By the time this person turns 71, they would have a total of $970.14 * 12 = $11,641.68. While this sounds like an impressive amount more than the $8,560.08 amount they would have had in one year if starting at 65, the problem is they're missing out on the $42,800.40 they could have had by starting at age 65.

I envisioned a line chart with the horizontal axis for age, and the vertical axis for total OAS received. Then two lines could be drawn on the chart, comparing the total OAS income over time for starting payments at age 65 versus age 70. Delaying to age 70 results in a 36% increase in monthly payments, but seniors miss out on the first 5 years of payments. The goal was to find the breakeven point—the age at which the total income from delaying finally catches up to starting earlier.

The line that starts at age 70 would have a greater slope because each payment is greater, but it would also start "pushed out to the right" because the payments from age 65 - 70 would be 0. The line that starts at age 65 would have a lower slope but starting right at 65. This mean the two lines would have to intersect at some point, and the age at which they intersect would be the break even age.

## TODO
* main content
* conclusion para
* description meta
* edit
* TODO: Ignoring annual inflation adjustments, comparing all values in today's dollars
* TODO: `npx http-server` for super quick, easy local static server
