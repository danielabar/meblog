---
title: "View Localhost on Your Phone"
featuredImage: "../images/phone-localhost-rodion-kutsaev-0VGG7cqTwCo-unsplash.jpg"
description: "Improve your mobile responsive development workflow by viewing localhost directly on your phone or other devices."
date: "2020-09-27"
category: "web development"
related:
  - "Build and Publish a Presentation with RevealJS and Github"
  - "Navigate Back & Forth in VS Code"
  - "A VS Code Alternative to Postman"
---

A common occurrence when developing a new website or app is that you'd like to see what it will look like on your phone, tablet, or other device. There are several pure software ways to do this, including [Device Mode](https://developers.google.com/web/tools/chrome-devtools/device-mode) in Chrome developer tools, and [Browserstack](https://www.browserstack.com/) which is a paid service with a free option for open source. However, all of these are only approximations of how your site will look and behave on another device. To get a more accurate experience, testing should be done on a real physical device. This post will show how to do that, with whatever devices are on hand.

When developing locally, the usual process is to have a development server running on a laptop. This server is responsible for serving up the files (html, css, and javascript) on a certain port, watching those files for changes, possibly running them through a build step (eg: transform JSX, convert sass to css etc.), and refreshing the browser or hot module reloading so the changes can be seen right away.

To access the website running on this local dev server, you open a browser tab on the same laptop that server is running on and navigate to an address such as `http://localhost:8080`. However, trying to enter this same address in a browser on a phone will not work. This is because `localhost` refers to the hostname of the computer it's running on. Here's the formal definition from [Wikipedia](https://en.wikipedia.org/wiki/Localhost):

>In computer networking, localhost is a hostname that refers to the current computer used to access it. It is used to access the network services that are running on the host via the loopback network interface. Using the loopback interface bypasses any local network interface hardware.

This means that if you enter `http://localhost:8080` on a phone, it's going to look for a web server running on the phone, which does not exist. What's needed, is to provide the phone an address of the laptop where the development server is running, i.e. something like `http://mylaptop:8080`.

So now the question is, what is `mylaptop`? It turns out, when multiple devices (laptop, phone, tablet, etc.) are all on the same WiFi network, they can communicate with each other via an internal IP address. The [Computer Hope](https://www.computerhope.com/jargon/i/internip.htm) website has a clear definition of what an internal IP address is:

>Alternatively referred to as the local IP address, the internal IP address is the address that is assigned by your local network router that often begins with 192.168.x.x. These IP addresses are only seen by other computers in your local network and not by computers connected to an external network, such as the Internet.

The key here is that your laptop's internal IP address can be seen by your phone if both are on the same network. This means that an address entered in the phone's browser like `http://laptop-local-ip:8080` will work.

## Find your Local IP

So the next question is, what is the laptop's local IP address? On a Mac, open System Preferences, then select Network, then select the WiFi connection - the IP address will be shown under the Status. On Windows, run `ipconfig` in a terminal window. It starts with `192.168.` For example, if it shows `192.168.1.50`, then when a web server is running on the laptop (let's assume on port 8080), a browser can be opened in any phone/tablet that is on the same WiFi as the laptop at `http://192.168.1.50:8080` and it will display the web site.

## Demo

Let's put it all together with a simple example. For this demonstration, we'll use the [live-server](https://www.npmjs.com/package/live-server) npm module to run a development web server with live reload capabilities.  In order to run npm modules, you must first have [Node.js](https://nodejs.org/en/) installed.

Install live-server globally so that it can be run from any directory:

```bash
npm install -g live-server
```

Then create a new directory with a simple index.html page:

```bash
mkdir demo && cd demo
touch index.html
```

Edit index.html so it contains the following

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Phone on Localhost</title>
</head>

<body>
  <h1>Hello from localhost!</h1>
</body>

</html>
```

Now run live-server from the same directory where index.html is:

```bash
live-server
```

The console will show output something like this:

```
Serving "/path/to/demo" at http://127.0.0.1:8080
Ready for changes
GET /favicon.ico 404 2.439 ms - 150
```

A browser tab on laptop will automatically open at `http://127.0.0.1:8080/` displaying the simple web page. By default, if live-server finds an index.html page in the directory root where it's running, it will serve that.

Now open a browser on your phone or tablet and enter the address `http://your.local.ip.address:8080`, replacing `your.local.ip.address` with your actual `192.168...` address. It should display a web page with the heading "Hello from localhost!"

Try making a change to index.html, for example, add a subheading:

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Phone on Localhost</title>
</head>

<body>
  <h1>Hello from localhost!</h1>
  <h2>test</h2>
</body>

</html>
```

The browser on the phone should automatically refresh and display "test" under the heading.

And there you have it, a workflow to view the site or app you're building on your laptop, on another device.

## But what about React, Vue etc.

Just about all modern frameworks come with a CLI or starter project that includes a dev server. So instead of live-server that we used in the demo, it could be for example, a Webpack dev server. But the technique to view the site on your phone is the same. After the dev server is started, check the console it will show what port its running on. Then find your local IP address and navigate to that from a browser on the phone.

For example, running `npm start` from a [create-react-app](https://github.com/facebook/create-react-app) project outputs the following, notice it helpfully tells you the address to access the site from the network:

```
You can now view project-name in the browser.

Local:            http://localhost:3000/
On Your Network:  http://192.168.2.16:3000/
```

Enter the "On Your Network" address in a browser on your phone.

## Conclusion

This is great technique get quick feedback if the site/app is having issues on mobile, display issues, or something just doesn't feel right. It can be done for as many devices as you happen to have lying around. I like to keep my old devices instead of throwing them out specifically for testing.