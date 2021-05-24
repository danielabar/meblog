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