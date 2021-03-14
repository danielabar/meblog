export function sayHello(href, referrer) {
  const payload = {
    guest_timezone_offset: new Date().getTimezoneOffset(),
    user_agent: navigator.userAgent,
    url: href,
    referrer: referrer
  }
  console.log(`=== HELLO PAYLOAD: ${JSON.stringify(payload, null, 2)}`)
}

onmessage = function(e) {
  let href, referrer
  [href, referrer] = e.data
  console.log(`=== MESSAGE received from main script: ${href}, ${referrer}`)
  if (href) {
    sayHello(href, referrer)
  }
}