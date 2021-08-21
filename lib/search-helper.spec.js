const searchHelper = require("./search-helper")

describe("Search Helper", () => {
  describe("generateInsert", () => {
    it("generates INSERT sql for node", () => {
      const node = {
        frontmatter: {
          title: "title",
          description: "description",
          category: "rails",
          date: "2021-08-15",
        },
        fields: {
          slug: "/blog/post-slug",
        },
        rawMarkdownBody: "this is the post content blah blah blah",
        excerpt: "this is the post content",
      }

      const result = searchHelper.generateInsert(node)

      const expectedResult = `INSERT INTO documents(title, description, category, published_at, slug, body, created_at, updated_at, excerpt)
    VALUES('title', 'description', 'rails', '2021-08-15', '/blog/post-slug', 'this is the post content blah blah blah', now(), now(), 'this is the post content')
    ON CONFLICT (title)
    DO NOTHING;`
      expect(result).toMatch(expectedResult)
    })

    it("removes hash symbol fromcontent", () => {
      const node = {
        frontmatter: {
          title: "title",
          description: "description",
          category: "rails",
          date: "2021-08-15",
        },
        fields: {
          slug: "/blog/post-slug",
        },
        rawMarkdownBody: "##this is the post content blah blah blah",
        excerpt: "this is the post content",
      }

      const result = searchHelper.generateInsert(node)

      const expectedResult = `INSERT INTO documents(title, description, category, published_at, slug, body, created_at, updated_at, excerpt)
    VALUES('title', 'description', 'rails', '2021-08-15', '/blog/post-slug', 'this is the post content blah blah blah', now(), now(), 'this is the post content')
    ON CONFLICT (title)
    DO NOTHING;`
      expect(result).toMatch(expectedResult)
    })
  })
})
