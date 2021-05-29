export async function getSearchResults(query) {
  let json = []
  const response = await fetch(`${process.env.SEARCH_URL}?q=${query}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  if (response.ok) {
    json = await response.json();
  }
  return json;
}

export function toNodeArray(searchResults) {
  return searchResults.map(sr => {
    return {
      node: {
        excerpt: sr.excerpt,
        fields: {
          slug: sr.slug
        },
        frontmatter: {
          category: sr.category,
          date: sr.published_at,
          title: sr.title
        },
        id: sr.title
      }
    }
  })
}