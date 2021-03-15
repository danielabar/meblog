export function sayHello(href, referrer) {
  const payload = {
    guest_timezone_offset: new Date().getTimezoneOffset(),
    user_agent: navigator.userAgent,
    url: href,
    referrer: referrer
  }
  console.log(`=== HELLO PAYLOAD: ${JSON.stringify(payload, null, 2)}`)
  fetch(process.env.HELLO_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
          "Content-type": "application/json; charset=UTF-8"
      }
  })
  .then(response => response.json())
  .then(json => console.log(json));
}

onmessage = function(e) {
  let href, referrer
  [href, referrer] = e.data
  if (href) {
    sayHello(href, referrer)
  }
}