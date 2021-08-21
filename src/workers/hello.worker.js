export function sayHello(href, referrer) {
  const payload = {
    guest_timezone_offset: new Date().getTimezoneOffset(),
    user_agent: navigator.userAgent,
    url: href,
    referrer: referrer,
  }
  fetch(process.env.HELLO_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
}

onmessage = function(e) {
  if (!process.env.HELLO_URL) return

  let href, referrer
  ;[href, referrer] = e.data
  if (href) {
    sayHello(href, referrer)
  }
}
