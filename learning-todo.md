# Learning Feature TODOs

* [ ] `LearningIntro` component (similar to `Intro`) but with text to explain the learning section.
* [ ] `LearningList` component (similar to `ArticleList`) but not paginated, will contain all the courses and iterate over each to render a `CourseCard`. The course list should be in a responsive grid. Something like 3 or 4 across for desktop, maybe 2 for tablet, and a "tube" of single cards for mobile/phone.
* [ ] `CourseCard` component to display: image, category, title, instructor, platform, completed date, link to my course notes (layout TBD).
* [ ] Import course data into `src/learning`.
* [ ] Import corresponding course images into `src/images/learning`.
* [ ] Maintain existing nav and other unit tests.
* [ ] New unit tests for new learning page and related components.
* [ ] Implement [sitemap config](https://www.gatsbyjs.com/plugins/gatsby-plugin-sitemap) to exclude the new `/learning` page.
* [ ] Verify SEO and tracking for new `/learning` page.
