# Learning Feature TODOs

* [ ] `LearningIntro` component (similar to `Intro`) but with text to explain the learning section.
* [ ] `LearningList` component (similar to `ArticleList`) but not paginated, will contain all the courses and iterate over each to render a `CourseCard`. The course list should be in a responsive grid. Something like 3 or 4 across for desktop, maybe 2 for tablet, and a "tube" of single cards for mobile/phone.
* [ ] `CourseCard` component to display: image, category, title, instructor, platform, completed date, link to my course notes (layout TBD).
* [ ] Figure out gatsbyImageData options for course card image (see below)
* [ ] Import course data into `src/learning`.
* [ ] Import corresponding course images into `src/images/learning`.
* [ ] Maintain existing nav and other unit tests.
* [ ] New unit tests for new learning page and related components.
* [ ] Implement [sitemap config](https://www.gatsbyjs.com/plugins/gatsby-plugin-sitemap) to exclude the new `/learning` page.
* [ ] Verify SEO and tracking for new `/learning` page.
* [ ] Verify prod build `make serve`
* [ ] Sorting/Filtering (could be follow-on)


## Gatsby Image Data

The `layout` option in `gatsbyImageData` specifies how the image should be displayed on the page, and it has three different values:

`FIXED`: This value generates an image with the specified width and height dimensions, and the image is displayed at its natural size. This means that the image may be smaller than its container, and it will not stretch to fit the container.

`FULL_WIDTH`: This value generates an image that is the full width of its container, but it maintains its aspect ratio. This means that the image may be larger than its container, and it will not be cropped.

`CONSTRAINED`: This value generates an image with a maximum width and height, and the image is scaled down to fit within those dimensions while maintaining its aspect ratio. This means that the image may be smaller than its container, and it will not stretch to fit the container. The maximum width and height can be set using the maxWidth and maxHeight options.

You can use the layout option to control how the images are displayed on your Gatsby site. For example, you may use `FIXED` layout for images that are meant to be displayed at a specific size, such as thumbnails or icons. You may use `FULL_WIDTH` layout for images that you want to stretch to fill the width of their container, such as hero images. Finally, you may use `CONSTRAINED` layout for images that you want to fit within a specific space, such as inline images within a blog post.
