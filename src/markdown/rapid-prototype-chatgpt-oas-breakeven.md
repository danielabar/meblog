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

## Building a Prototype

The idea was to get something that the subject matter expert and others could try out as quickly as possible. Out budget was exactly $0.00, so it had to be something that could be hosted for free. In this case, a static website hosted on GitHub Pages is the perfect solution. It doesn't even require purchasing a domain as GitHub will generate a url based on your GitHub username and repository name.

## TODO
* main content
* conclusion para
* description meta
* edit
