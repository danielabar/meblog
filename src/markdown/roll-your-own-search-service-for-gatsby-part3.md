---
title: "Roll Your Own Search with Rails and Postgres: Search Engine"
featuredImage: "../images/roll-search-3.jpg"
description: "Learn how to build search service using Rails and Postgres Full Text Search for a Gatsby blog."
date: "2021-07-10"
category: "PostgreSQL"
---

This is the third in a multi-part series of posts detailing how I built the search feature for this blog. This post will provide an overview of the search engine, provided by PostgreSQL [Full Text Search](https://www.postgresql.org/docs/13/textsearch.html), and introduce some concepts that will be needed in understanding how to integrate this with Rails.

In case you missed it, [Part 1: Search Introduction](../roll-your-own-search-service-for-gatsby-part1) of this series covers the existing options for adding search to a Gatsby site, and why I decided not to use any of them, and instead build a custom search service. [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2) covers the design and population of the `documents` table that contains all the content to be searched.

## PostgreSQL Full Text Search

A full discussion of how PostgreSQL full text search works is beyond the scope of this article, and I'm actually going to be using a gem that makes integrating it into Rails fairly easy. However, in order to make sense of what the gem is doing, it's worth taking a look "under the hood" into the search functions at the database level.

Recall the `documents` table, covered in [Part 2: Search Index](../roll-your-own-search-service-for-gatsby-part2) of this series, looks like this, just showing a few rows, `body` column shortened for legibility:

```
hello=> select title, category, slug, left(body, 40) as body from documents;
                               title                                |     category     |                          slug                           |                   body
--------------------------------------------------------------------+------------------+---------------------------------------------------------+------------------------------------------
 Add a Language to gatsby-remark-vscode                             | web development  | /blog/add-language-gatsby-remark-vscode/                |  This blog is built with [Gatsby](https:
 A VS Code Alternative to Postman                                   | Web Development  | /blog/postman-alternative-vscode/                       |  If youve been doing web development for
 Rails CORS Middleware For Multiple Resources                       | rails            | /blog/rails-cors-middleware-multiple/                   |  A short post for today on a usage of [C
 TDD by Example: Fixing a Bug                                       | javascript       | /blog/tdd-by-example-bugfix/                            |  This post will demonstrate an example o
 Saving on monthly expenses - A Cautionary Tale                     | personal finance | /blog/save-monthly-expense-caution/                     |  Today I want to share a cautionary tale
 Rails Blocked Host Solved by Docker Cleanup                        | rails            | /blog/rails-blocked-host-docker-clean/                  |  Today I want to share a debugging story
 ...
```

Now suppose you were interested in searching for posts about TDD by searching the `body` column. A naive approach would be something like this:

```sql
SELECT * FROM documents WHERE body LIKE '%TDD%';
```

The performance of `LIKE` wildcarding may not be very good because the `body` column contains the entire post content so it could be very large. Also what if the post content refers to lowercase `tdd`? Then this query would miss some matches. Yes you could use `lower(body)` instead of `body` but what if you want to search for `expenses` but the body has `expense`? Now you also need to take pluralization and grammar into account. This reveals the limitations of `LIKE` wildcard searching.

### to_tsvector

With full text search, Postgres provides the `to_tsvector` function. This function parses a text document into tokens, normalizes the tokens to [lexemes](https://en.wikipedia.org/wiki/Lexeme), and returns a `tsvector` which lists the lexemes together with their positions in the document. It will not process stop words such as `a`, `the`, `but` etc. because these are words that occur in the English language too frequently to be useful for searching. It also eliminates pluralization and punctuation. This reduces the words to a common form which will be most useful for searching. It does all this by consulting a set of dictionaries for the specified language, which is the first argument to the `to_tsvector` function.

Phew, that was a lot of words to explain the `to_tsvector` function. Let's see an example. Below I've taken just one paragraph from a blog post I wrote about [TDD](../tdd-by-example-bugfix), and then run it through the `to_tsvector` function using the `english` language dictionaries (these are provided by PostgreSQL):

```sql
select to_tsvector(
  'english',
  'But with TDD, the approach is different. After figuring out where in the code the problem lies, you first write a failing test. That is, a test that exercises the buggy portion of the code, and makes assertions assuming the bug has already been fixed. This test will fail because you haven''t actually fixed it yet. Then you go in and fix the code, run the test again, and this time it should pass'
);
```

And here is the result, it gets returned all in one line but I've broken it up into multiple lines for legibility. The result is a list of lexemes (normalized english words) and their position in the text that was given as the second argument passed to the `to_tsvector` function. If the same lexeme appears multiple times in the document text, each position is listed in a comma separated format:

```
"
'actual':54
'alreadi':43
'approach':5
'assert':38
'assum':39
'bug':41
'buggi':31
'code':14,35,65
'differ':7
'exercis':29
'fail':22,49
'figur':9
'first':19
'fix':45,55,63
'go':60
'haven':52
'lie':17
'make':37
'pass':75
'portion':32
'problem':16
'run':66
'tdd':3
'test':23,27,47,68
'time':72
'write':20
'yet':57
"
```

Notice how all the words have been lower cased, punctuation removed, and no stop words appear in the results.

### to_tsquery

Looking at the results of `to_tsvector`, you can start to see how this approach overcomes the limitations of `LIKE` wildcard searching. But how do you actually use it in a search? This is where the `to_tsquery` function comes in. This function takes in a language parameter, and a string to search for, and converts it to the `tsquery` data type. Then the `@@` operator is used to check if a query (aka `tsquery`) is contained in a `tsvector`, which was the output of the `to_tsvector` function.

Once again, an example will help to clarify this:

Suppose you'd like to know whether the word `TDD` appears in the sample paragraph I extracted earlier from the TDD article. First run the paragraph through the `to_tsvector` function, then use the `@@` operator to determine whether the `tsquery` of `TDD` is contained in the `tsvector`:

```sql
select to_tsvector(
  'english',
  'But with TDD, the approach is different. After figuring out where in the code the problem lies, you first write a failing test. That is, a test that exercises the buggy portion of the code, and makes assertions assuming the bug has already been fixed. This test will fail because you haven''t actually fixed it yet. Then you go in and fix the code, run the test again, and this time it should pass'
) @@ to_tsquery('english', 'TDD');
-- true
```

The result is true, meaning the term was found. Note that even though I passed in upper case `TDD`, it matched on the lower case `tdd` from the list of lexemes returned by the `to_tsvector` function:

Let's try searching for the word `fixed`. Notice the root of this word `fix` is in the list of lexemes, but not literally `fixed`. The list of `lexemes` shown earlier has the word `fix` appearing in 3 places in the paragraph text: `'fix':45,55,63`.

```sql
select to_tsvector(
  'english',
  'But with TDD, the approach is different. After figuring out where in the code the problem lies, you first write a failing test. That is, a test that exercises the buggy portion of the code, and makes assertions assuming the bug has already been fixed. This test will fail because you haven''t actually fixed it yet. Then you go in and fix the code, run the test again, and this time it should pass'
) @@ to_tsquery('english', 'fixed');
-- true
```

Again, a match is found, so the `@@ to_tsquery` operator returns true.

### Searching a Table

The above examples were manually constructed by extracting some paragraph text from one article. This demonstrates the usefulness of the `to_tsvector` and `to_tsquery` functions.

Now its time to use these against the `documents` table to show how a real search would work. For example, to search all documents for `TDD` in the `body` column, and return a list of title and slugs for the matching documents:

```sql
SELECT
  title,
  slug
FROM documents
WHERE
  to_tsvector('english', body) @@ to_tsquery('english', 'TDD');
```

Results:

```
                    title                    |                   slug
---------------------------------------------+------------------------------------------
 TDD by Example: Fixing a Bug                | /blog/tdd-by-example-bugfix/
 Solving a Python Interview Question in Ruby | /blog/python-interview-question-in-ruby/
 TDD by Example                              | /blog/tdd-by-example/
(3 rows)
```

The first and third results make sense, I've written two articles on TDD. But why is the second article on [Solving a Python Interview Question in Ruby](../python-interview-question-in-ruby) showing up in the results? Reviewing that article, indeed it does refer several times to TDD as that is used to solve the interview question. So it makes sense that it's included in the results, but why is it showing up before the `TDD by Example` article?

## ts_rank

This brings up the question of rank. The `ts_rank` function takes a `tsvector` and `tsquery` and returns a number indicating how strong of a match the query is against the given list of lexemes. Let's include the rank in the previous query:

```sql
SELECT
  title,
  slug,
  ts_rank(
   to_tsvector('english', body),
   to_tsquery('english', 'TDD')
  )
FROM documents
WHERE
  to_tsvector('english', body) @@ to_tsquery('english', 'TDD');
```

Results:

```
                    title                    |                   slug                   |   ts_rank
---------------------------------------------+------------------------------------------+-------------
 TDD by Example: Fixing a Bug                | /blog/tdd-by-example-bugfix/             |  0.09741346
 Solving a Python Interview Question in Ruby | /blog/python-interview-question-in-ruby/ |  0.096883096
 TDD by Example                              | /blog/tdd-by-example/                    |  0.09793941
(3 rows)
```

The above results show that the `Solving a Python Interview Question in Ruby` result is the lowest ranked in the list. In order to make search results useful, the most relevant results should be listed first. To make these results sorted by relevance, we can order by descending rank (i.e. highest first):

```sql
SELECT
  title,
  slug,
  ts_rank(
   to_tsvector('english', body),
   to_tsquery('english', 'TDD')
  ) as rank
FROM documents
WHERE
  to_tsvector('english', body) @@ to_tsquery('english', 'TDD')
ORDER BY rank DESC;
```

Now the results show the first article `TDD by Example` is the most relevant, followed by the next article using TDD to fix a bug, and finally in last place, the interview article where TDD is referred to, but as frequently as the other two articles:

```
                    title                    |                   slug                   |    rank
---------------------------------------------+------------------------------------------+-------------
 TDD by Example                              | /blog/tdd-by-example/                    |  0.09793941
 TDD by Example: Fixing a Bug                | /blog/tdd-by-example-bugfix/             |  0.09741346
 Solving a Python Interview Question in Ruby | /blog/python-interview-question-in-ruby/ |  0.096883096
(3 rows)
```

## What's Next?

This post provided an introduction to PostgreSQL full text search with some examples of using the `ts_vector`, `ts_query` and `ts_rank` functions. Next up, see [Part 4: Search API](../roll-your-own-search-service-for-gatsby-part4) for how to integrate this into a Rails model and controller to provide a search API.