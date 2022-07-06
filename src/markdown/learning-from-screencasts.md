---
title: "How to Maximize Your Learning from Screencasts"
featuredImage: "../images/active-learning-deepmind-ZJKE4XVlKIA-unsplash.jpg"
description: "Learn techniques to get the most out of your time spent online learning with screencasts."
date: "2022-11-01"
category: "career"
related:
  - "How to Learn New Things"
  - "Improve Productivity with VS Code Snippets"
  - "Off with the Digital Distractions!"
---

This post will cover some techniques to get the most out of the online learning experience using screencasts. There are many services offering this including Pluralsight, Wes Bos, Learn UI and UX to name just a few. I happen to have the most experience with Pluralsight, but the advice in this post applies to all screencast style courses.

Even prior to the pandemic, I've found this style of learning to be optimal as it supports an async lifestyle. No need to commute to a particular location or be online at a specific hour. You login whenever you have time and go at your own pace. However, there are some pitfalls that can derail the learning experience if you're not careful.

## Passive vs Active

Let's start with what not to do. Since the course format is video, it's tempting to treat this like a Netflix entertainment series, pop some popcorn, sit back, relax and just watch. This is the passive approach, and while not a complete waste of time, it's not the most effective way of learning. Most likely you'll forget most of what's covered.

![popcorn](../images/popcorn-linus-mimietz-uWjBqbCHY7g-unsplash.jpg "popcorn")

Instead, I recommend active learning. This requires more explicit effort on the part of the learner and takes longer, but the payoff is more information retained and a higher quality learning experience.

## Organize for Note Taking

One of the most effective ways to retain what you've learned is to write it down as you go. This requires a little prior organization so you'll be able to find your notes later.

When starting a new course, create a directory. I suggest having one directory for all courses, then sub-directories for each course you take. For example, if taking a course on Idiomatic Ruby from Pluralsight:

```bash
cd ~/path/to/courses
mkdir idiomatic-ruby-pluralsight && cd idiomatic-ruby-pluralsight
mkdir exercises doc-images
touch README.md
```

It will look something like this:

```
courses
└── idiomatic-ruby-pluralsight
    ├── README.md
    ├── doc-images
    └── exercises
```

The `README.md` is where the course notes will go. It doesn't have to be markdown, you could write in a plain text file, or even a Google/Microsoft/Libre Office document. But I've found that markdown is optimal for technical writing as it supports syntax highlighted code blocks.

The `exercises` folder will be used for saving any code examples developed during the course. The `doc-images` folder is where you will place any screenshots - for example, if developing a web app, it will be useful to save screenshots of what the app looks like as you build it up, and then reference these images in `README.md`.

Most courses are broken up into major sections, with each major section having several smaller subsections with a short video for each section. A good place to start organizing your notes is to create headings and subheadings matching the course structure. This way you'll know where to add your notes as you're watching each video.

For example, here's the table of contents from the Idiomatic Ruby course on Pluralsight:

![idiomatic Ruby course TOC](../images/idiomatic-ruby-course-toc.png "idiomatic Ruby course TOC")

In this case, I would create headings in `courses/idiomatic-ruby-pluralsight/README.md` as follows:

```markdown
# Idiomatic Ruby

## Blocks, Conditionals, and Symbols

### Blocks Coding

### Blocks Details

...

## Building Objects

### Desired Behavior

...
```

## Take Notes

Now that you're organized for note taking, it's time to start watching the videos. But you're not going to be sitting back and relaxing like watching funny cat videos on Youtube. Every time a significant point is covered in the course, pause the video, and write down what you just learned *in your own words*. This is key, do not simply transcribe the instructor's words. Make sure you understand the concept enough that you could explain it to someone else, then write down that explanation. In fact, that someone else is "future you", who will look back on these notes several months from now to reference the material.

**TODO**

- Intro para tidyup
  - Link to few services
  - Emphasize this post not promoting any particular one but I have the most experience with Pluralsight
  - Briefly explain what/how it works - course broken up until short video segments, you can pause, go back, skip forwards, no time limit to complete...
- Note taking in two sections? 1. Organize for note taking and 2. Take notes
  - More reasoning for "This requires a little organization so you'll be able to find your notes later." - mise en place for learning - https://en.wikipedia.org/wiki/Mise_en_place
  - Aside: Some course platforms have a Note taking section where you can enter your own notes but I don't recommend using this. What if they go away or if you no longer wish to pay for the service. It's better to own your own content.
- Other sections
  - Pause to do code exercises (don't just watch instructor code!)
  - Deal with hiccups
  - Go on tangents
  - Save/publish notes - easily searchable
  - Make learning a habit (small amount each regular interval, habit stacking, reference: Atomic Habits)
  - Who is this for? (not absolute beginner, no real-time help if get stuck)
  - Eliminate distractions (does this fit in?)