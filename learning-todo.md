# Learning Feature TODOs

* [x] Maintain existing nav and other unit tests.
* [x] `LearningList` component (similar to `ArticleList`) but to display a grid of course cards.
* [x] `LearningIntro` component (similar to `Intro`) but with text to explain the learning section (see brainstorming below)/
* [x] `CourseCard` component to display: image, category, title, completed date, link to my course notes.
  * [x] Consider a different font for course cards (Inter, Roboto, DM Sans, Figtree)
  * [x] Upgrade react-icons.
  * [ ] Shadows are too heavy, make lighter, then slightly heavier on card hover.
  * [ ] Design color scheme for course categories (background lighter tag color and corresponding darker text color)
  * [ ] Figure out gatsbyImageData options for course card image wrt grid options (see below)
  * [ ] Square images from DAll-e don't look good, need to get a wider aspect ratio, look into [imagemagick](https://www.digitalocean.com/community/tutorials/workflow-resizing-images-with-imagemagick)
* [ ] Import course data into `src/learning`.
* [ ] Import corresponding course images into `src/images/learning`.
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

Figure out relationship between for example `gatsbyImageData(width: 250, aspectRatio: 1.67)` in `src/pages/learning.js` and grid definition `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));` in `src/components/learning/course-list.module.css`

## Learning Intro Brainstorming

Welcome to the Learning section. In a world where change is the only constant, it's crucial to keep learning and expanding our knowledge. This is especially true in tech, where new languages, tools, libraries, and frameworks are always emerging. Here, I've gathered a collection of online courses that I've completed and compiled detailed notes on, so you can learn from my experiences and take your skills to the next level. Also check out the link to my article on how to get the most out of online courses, and start your learning journey today!
