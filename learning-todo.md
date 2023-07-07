# Learning Feature TODOs

* [x] Maintain existing nav and other unit tests.
* [x] `LearningList` component (similar to `ArticleList`) but to display a grid of course cards.
* [x] `LearningIntro` component (similar to `Intro`) but with text to explain the learning section (see brainstorming below)/
* [x] Import pluralsight and wesbos course data into `src/learning`.
* [x] Import tutsplus course data into `src/learning`.
* [x] `CourseCard` component to display: image, category, title, completed date, link to my course notes.
  * [x] Consider a different font for course cards (Inter, Roboto, DM Sans, Figtree)
  * [x] Upgrade react-icons.
  * [x] Shadows are too heavy, make lighter, then slightly heavier on card hover.
  * [x] Design color scheme for course categories, see `src/styles/course-categories.css` and below.
  * [x] Slight black overlay so images aren't so prominent, something like this? https://stackoverflow.com/questions/43479968/how-can-i-add-an-image-overlaying-an-img-tag
  * [x] Figure out gatsbyImageData options for course card image wrt grid options (see below)
  * [x] Square images from DAll-e don't look good, need to get a wider aspect ratio, look into [imagemagick](https://www.digitalocean.com/community/tutorials/workflow-resizing-images-with-imagemagick), adjust gravity based on where important details of the image are: `convert react-hooks-orig.png -resize 250x -gravity north -crop 250x140+0+0 react-hooks.png`
* [x] Generate course images into `src/images/learning` (replace all placeholder.png)
* [x] Verify SEO and tracking for new `/learning` page.
* [x] Verify prod build `make serve`.
* [x] WIP New unit tests for new learning page and related components. (for page, see `src/pages/index.spec.js`)
* [x] Add latest Kafka course
* [ ] Maybe new image for learning page SEO?
* [ ] Consider env var like `LEARNING_ENABLED` (similar to `SEARCH_ENABLED`) to control whether learning page is displayed
* [ ] Implement [sitemap config](https://www.gatsbyjs.com/plugins/gatsby-plugin-sitemap) to exclude the new `/learning` page.
* [ ] Sorting/Filtering (could be follow-on, could [this](https://github.com/pacocoursey/cmdk) be useful?). Also see Isotope and MixItUp.


## Gatsby Image Data

The `layout` option in `gatsbyImageData` specifies how the image should be displayed on the page, and it has three different values:

`FIXED`: This value generates an image with the specified width and height dimensions, and the image is displayed at its natural size. This means that the image may be smaller than its container, and it will not stretch to fit the container.

`FULL_WIDTH`: This value generates an image that is the full width of its container, but it maintains its aspect ratio. This means that the image may be larger than its container, and it will not be cropped.

`CONSTRAINED`: This value generates an image with a maximum width and height, and the image is scaled down to fit within those dimensions while maintaining its aspect ratio. This means that the image may be smaller than its container, and it will not stretch to fit the container. The maximum width and height can be set using the maxWidth and maxHeight options.

You can use the layout option to control how the images are displayed on your Gatsby site. For example, you may use `FIXED` layout for images that are meant to be displayed at a specific size, such as thumbnails or icons. You may use `FULL_WIDTH` layout for images that you want to stretch to fill the width of their container, such as hero images. Finally, you may use `CONSTRAINED` layout for images that you want to fit within a specific space, such as inline images within a blog post.

Figure out relationship between for example `gatsbyImageData(width: 250, aspectRatio: 1.67)` in `src/pages/learning.js` and grid definition `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));` in `src/components/learning/course-list.module.css`

### Imagemagick

Since will be displaying many images on one page, might be good to crop them to size before adding to gatsby image processing. If using Dall-E, they are 1024x1024. Try variations on imagemagick convert command:

```
convert idiomatic-ruby.jpg -resize 250x -gravity center -crop 250x140+0+0 idiomatic-ruby.png

convert gatsby-green-light.jpg -resize x140 -gravity south -region 50x50+75+45 -liquid-rescale 1.1x1.1 -gravity center -crop 250x140+0+0 gatsby-green-light-magnified.png


convert input.png -resize "250x140^" -gravity center -crop 250x140+0+0 +repage output.png
convert atom.png -resize 250x140^ -gravity center -extent 250x140 atom_output.png

Shrink content to fit smaller frame and apply background to fill the rest
convert gatsby.png -resize 250x140 -background "rgba(0, 0, 255, 0.5)" -gravity center -extent 250x140 gatsby_output.png

Sample background color from image:
convert gatsby.png -gravity NorthWest -crop 1x1+0+0 -format "%[pixel:u]\n" info:
srgb(253,254,255

Command substitution:
convert atom.png -background "$(convert atom.png -gravity NorthWest -crop 1x1+50+50 -format "%[pixel:u]" info:)" \
-resize 250x140 -gravity center -extent 250x140 atom-smart-back.png
```

Other various experiments:
```
convert cropped.png -fill white -opaque "$(convert cropped.png -crop 1x1+0+0 txt: | tail -n 1 | awk '{print $3}')" output_image.png
convert cropped.png -fuzz 5% -transparent "$(convert cropped.png -crop 1x1+50+50 txt: | tail -n 1 | awk '{print $3}')" -alpha extract -negate output_image.png
convert cropped.png -fuzz 1% -transparent "$(convert cropped.png -crop 1x1+0+0 txt: | tail -n 1 | awk '{print $3}')" output.png
```

Want images that are 250px wide, with 16:9 aspect ratio (i.e. 1.87).

## Learning Intro Brainstorming

Welcome to the Learning section. In a world where change is the only constant, it's crucial to keep learning and expanding our knowledge. This is especially true in tech, where new languages, tools, libraries, and frameworks are always emerging. Here, I've gathered a collection of online courses that I've completed and compiled detailed notes on, so you can learn from my experiences and take your skills to the next level. Also check out the link to my article on how to get the most out of online courses, and start your learning journey today!

## Category Tags

**Distinct Categories**

```graphql
{
  allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/learning/" } }
    sort: {frontmatter: {category: ASC}}
  ) {
    distinct(field: { frontmatter: { category: SELECT} })
  }
}
```

```json
{
  "data": {
    "allMarkdownRemark": {
      "distinct": [
        "css",
        "database",
        "devops",
        "golang",
        "java",
        "javascript",
        "linux",
        "python",
        "rails",
        "ruby",
        "web-development"
      ]
    }
  },
  "extensions": {}
}
```

Categories by count:

```graphql
{
  allMarkdownRemark(
    filter: { fileAbsolutePath: { regex: "/src/learning/" } }
  ) {
    group(field: { frontmatter: { category: SELECT} }) {
      fieldValue
      totalCount
    }
  }
}
```

```json
{
  "data": {
    "allMarkdownRemark": {
      "group": [
        {
          "fieldValue": "css",
          "totalCount": 8
        },
        {
          "fieldValue": "database",
          "totalCount": 3
        },
        {
          "fieldValue": "devops",
          "totalCount": 3
        },
        {
          "fieldValue": "golang",
          "totalCount": 1
        },
        {
          "fieldValue": "java",
          "totalCount": 2
        },
        {
          "fieldValue": "javascript",
          "totalCount": 24
        },
        {
          "fieldValue": "linux",
          "totalCount": 2
        },
        {
          "fieldValue": "python",
          "totalCount": 2
        },
        {
          "fieldValue": "rails",
          "totalCount": 6
        },
        {
          "fieldValue": "ruby",
          "totalCount": 3
        },
        {
          "fieldValue": "web-development",
          "totalCount": 1
        }
      ]
    }
  },
  "extensions": {}
}
```
