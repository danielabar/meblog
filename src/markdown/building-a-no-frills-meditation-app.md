---
title: "Building a No Frills Meditation App"
featuredImage: "../images/building-no-frills-meditation-app-chelsea-audibert-lDEW4qMiizc-unsplash.jpg"
description: "A skeptical, but-curious take on meditation led me to build Just Breathe, a minimalist, ad-free web app that guides simple timed breathing with no mysticism, no subscriptions, and no distractions, just science-based calm."
date: "2026-01-01"
category: "web development"
related:
  - "Rapid Prototyping with ChatGPT: OAS Pension Calculator Part 1"
  - "Maintain Node.js Version Consistency"
  - "When the Password Field Says No to Paste"
---

This is the story of how I built Just Breathe, a no-frills meditation app: part personal journey, part technical walkthrough.

I first heard about the benefits of meditation years ago on a podcast. An expert practitioner was being interviewed on a health podcast and said if the benefits of meditation were available as a pill, it would make some pharmaceutical company billions in profits. Benefits such as: lower stress, reduced anxiety, better blood pressure, improved focus, clearer thinking, enhanced performance on cognitive tasks, even longevity. I was intrigued enough to buy the author's book, especially because he billed it as a "no BS" guide.

But then I got to the chapter about people meditating in the forest, claiming they could intuit which plants were safe to eat or use as medicine based on what the plants *told* them during meditation. While I’m sure some people genuinely feel that the plants are communicating with them, that chapter reminded me why I’ve often been skeptical of meditation in the past.

That’s been my issue with meditation all along. I’m open to the science, but not the pseudoscience. I also didn’t find it easy: trying to meditate on my own usually resulted in me either zoning out or falling asleep. So I turned to a tech solution.

## The Problem with Meditation Apps

I wanted something simple: a gentle breathing reminder to help me focus. But everything I tried had problems.

* **Guided meditation apps** often required subscriptions. And it just didn't feel like something I should have to pay monthly for.
* **Free versions** were full of distracting ads and usually demanded I create an account.
* **Tone** Full of vague spiritual platitudes and ambient whale sounds. Not my thing.
* **Meditation podcasts**? Same issue - plus ads - and often just as "out there."
* **YouTube**? Forget it. You sit down to meditate and end up watching cat videos for an hour.

Then I read the book [Breath: The New Science of a Lost Art](https://www.mrjamesnestor.com/breath-book/). It made a strong case for a simple practice: breathing in through the nose for 4.5 seconds, and out through the nose for 4.5 seconds - just a few minutes a day could activate the parasympathetic nervous system, improve oxygen saturation, and more.

That clicked. But when I tried to create a custom meditation session using this technique, new problems appeared.

## Breathing Math

The technique sounded simple, but practicing it revealed new problems:

* **Counting 4.5 seconds** wasn’t intuitive - whole numbers felt easier, but stressing about the additional half second defeated the purpose.
* **Constant counting** was distracting, pulling attention away from the feeling of the breath.
* **Mind wandering** often led to zoning out and forgetting the pattern altogether.
* **Knowing when to stop** required setting a timer — but even the gentlest alert felt jarring if already relaxed, undoing the benefit of the session.

What was really needed was an app that could talk out loud and simply say:

> "Breathe in" ... 4.5 seconds ... "Breathe out" ... 4.5 seconds ... repeat ... "All done."

No bells, no ads, no login, no mystical forest energy. Just a steady breathing reminder, with a gentle ending instead of a startling alarm.

## So I Built It

I opened VSCode, created a new project, and prompted my AI assistant to help build something simple and mobile-friendly - no frameworks, no accounts, no backend, just vanilla JS and CSS.

Here is the prompt used:

<aside class="markdown-memory-lane">
Help me think about how I could use vanilla web tech for building the following web app, which i plan to deploy to github pages because i don't need an application server:

Mobile first layout because it will be used primarily on a phone

Kind of a very simple meditation app without all the "woo woo"

It's inspired by the learnings from James Nestor book Breath: The New Science of a Lost Art: https://www.mrjamesnestor.com/breath-book/

Essentially the optimal breathing for good health is 4.5 seconds in, 4.5 seconds out, all through the nose

But it's really hard to count 4.5 seconds, and it's kind of distracting to keep counting

So what I'm picturing is an app (still have to figure out a name), but the basic idea is it prompts the user for:

1. How many seconds they want to breathe in (default 4.5)
2. How many seconds they want to breathe out (default 4.5)
3. How many minutes they want to mediate for (default 10 minutes, other options 5, 10, 15, 20, 25, 30, maybe let user enter their own amount, validation integer, numeric, between 1 and whatever 3 hours is)
4. Click Start

At this point the user no longer needs to look at the app, although it should show "something pleasing" if user is looking at it, maybe a horizontal bar animating the time remaining or something like that, I don't know.

But the idea is at this point the user would find a comfortable place to sit or lie down where they will be undisturbed for the duration. I'm not sure if these instructions, along with the instruction to nasal breathe should be displayed somewhere in the app either before or after they make their selections. I don't want to confuse the user with too much details, particularly on a small phone screen.

Then the app will play a calming audio voice saying "Breath in" (I don't know where to find such an asset).

Then after the number of seconds have elapsed for breath-in that user selected, same calming audio voice says "Breath out" (again where to find audio asset?).

Then after the duration has elapsed (although let it go past the duration if in the middle of a breath in breath out so they can complete their last breathe out cycle because it would be jarring to be interrupted in the middle), same calming voice says "All done".
</aside>

After submitting that prompt and a good deal of iteration to resolve issues, here are the results:

![just breathe app landing](../images/just-breathe-app-landing.png "just breathe app landing")

In the middle of a session:

![just breathe app session](../images/just-breathe-app-session.png "just breathe app session")

* [Live Demo](https://danielabar.github.io/just-breathe/)
* [GitHub Repo](https://github.com/danielabar/just-breathe)

## A Few Technical Highlights

This app is structured as follows:

```
.
├── assets
│   └── fonts
│       ├── InterVariable-Italic.woff2
│       └── InterVariable.woff2
├── index.html
├── js
│   ├── about.js
│   ├── index.js
│   ├── main.js
│   ├── session.js
│   ├── userPrefs.js
│   └── voice.js
└── styles
    ├── app.css
    ├── fonts.css
    ├── global.css
    ├── index.css
    ├── reset.css
    └── variables.css
```

Where `index.html` loads the entry point styles and code:

```htm
<head>
  <!-- other stuff... -->
  <link rel="stylesheet" href="./styles/index.css">
  <script type="module" src="./js/index.js" defer></script>
</head>
```

Even though *Just Breathe* is simple on the surface, a few small technical decisions help keep it lightweight, offline-friendly, and distraction-free.

### 1. Pure Vanilla Stack

Using native ES modules means no bundler or transpiler is needed, and the whole app stays readable to anyone curious about the code. For example, the `js/index.js` entrypoint imports the main and about modules so the views can be toggled (no fancy router needed here for just two views):

```javascript
// js/index.js
import { renderMainView } from './main.js';
import { renderAboutView } from './about.js';

const appView = document.getElementById('app-view');
const navMain = document.getElementById('nav-main');
const navAbout = document.getElementById('nav-about');

function showView(view) {
  if (view === 'about') {
    navMain.removeAttribute('aria-current');
    navAbout.setAttribute('aria-current', 'page');
    renderAboutView(appView);
  } else {
    navMain.setAttribute('aria-current', 'page');
    navAbout.removeAttribute('aria-current');
    renderMainView(appView);
  }
}

navMain.addEventListener('click', () => showView('main'));
navAbout.addEventListener('click', () => showView('about'));

// Default view
showView('main');
```

### 2. Voice-Guided Breathing

All prompts come from the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis), so the user doesn't need to keep an eye on the screen during the breathing session:

```js
export function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}
```

### 3. Staying Awake with the Wake Lock API

Sessions request a screen wake lock so the device won't lock up mid-breath:

```js
async function requestWakeLock() {
  wakeLock = await navigator.wakeLock.request('screen');
}
```

### 4. Custom Preferences with Local Storage

Breathing pace and session duration are remembered between visits using local storage. Namespaced keys are used:

```js
localStorage.setItem('justBreathe:prefs', JSON.stringify(prefs));
```

For this simple storage requirements, no account or back end is needed.

### 5. Progress Bar & Countdown

A simple countdown and filling progress bar track the session:

```js
stateEl.textContent = 'Starting in 3...';
speak('Starting in 3');
progressEl.style.width = (percent * 100) + '%';
```

This provides just enough feedback to stay on pace for those who choose to look at the screen during the session.

### 6. Installable Like a Native App

With a manifest and icons, *Just Breathe* can be added to the device home screen:

```html
<link rel="manifest" href="site.webmanifest">
```

TODO: Screenshot from my phone

### 7. Use of @import in CSS for modularity

In addition to the JavaScript setup, the CSS is organized into multiple smaller files and brought together in `index.css` using `@import`:

```css
/* styles/index.css */
@import './fonts.css';
@import './reset.css';
@import './variables.css';
@import './global.css';
@import './app.css';
```

While `@import` has historically been discouraged for performance reasons—since older browsers loaded files sequentially—HTTP/2’s multiplexing reduces that concern. In this small app, the tradeoff favors developer experience and maintainability, making the modular file structure more valuable than micro-optimizing CSS delivery. For more details see: https://css-tricks.com/almanac/rules/i/import

### 8. CSS Variables for Theming and Consistency

The app defines a centralized color and typography system using CSS custom properties in `variables.css`. This makes it easy to maintain consistent design choices and update them globally:

```css
:root {
  --font-main: 'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  --color-bg: #f6f7f9;
  --color-text: #444;
  --color-accent: #6bb7b7;
  --color-card: #fff;
}
```

Instead of hardcoding values across components, classes reference these variables:

```css
body {
  font-family: var(--font-main);
  background: var(--color-bg);
  color: var(--color-text);
}
```

### 9. Use of a Variable Font (Inter)

The project loads the Inter typeface as a variable font via `@font-face`. Variable fonts allow a single file to cover a wide weight range (100–900), reducing HTTP requests while offering flexibility in typography:

```css
@font-face {
  font-family: 'Inter';
  src: url('../assets/fonts/InterVariable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

Components can then select any weight without requiring separate font files:

```css
h1 { font-weight: 700; }
p  { font-weight: 400; }
```


### 10. Automated Testing

Even though it's a small project, I found myself iterating and adding features often enough that it was worth having some automated test coverage.

Testing with Vitest, started with Jest but surprised that it doesn't support ESM easily (some experimental feature that felt very messy). Out of scope to get into all the details so just point to some relevant files in project like vitest.config.js to configure jsdom (since this is a browser based project, not back end node) and coverage reporting.

### 11. Zero-Build, Zero-Dependency

The entire app runs as a static site. There’s no bundler, no framework, no auth, and no build process. It’s just plain HTML, JavaScript modules, and CSS. It's deployed via GitHub Pages using the `gh-pages` npm package.

TODO: Phrasing
This keeps maintenance simple. On past JS projects with a bundler/build system - returning to maintain them after a few months often results in some build error because some js dependency is no longer maintained or doesn't work with newer node version or something like that.

## Using It in Real Life

I now use it almost every day after my workout and stretching. It’s simple, peaceful, and effective.

Lying down, I prefer longer cycles: **7 seconds in, 9 seconds out**. But the app supports whatever timing feels best. It’s flexible.

## Final Thoughts

This little project reminded me how satisfying it is to build tools *just* for yourself. Especially ones that make your day measurably better.

If you’ve ever wanted to meditate but got turned off by mysticism, ads, paywalls, or distractions - give [Just Breathe](https://danielabar.github.io/just-breathe/) a try, and let me know if you found it helpful.


## TODO
* conclusion para
* edit
* Insert joke about podcasts being book tours in disguise.
* Somewhere work in I always thought you had to buy in to a religion or something, since meditation is often associated with buddhism
* Maybe a few more details about the optimal breathing cadence and importance of nasal breathing from book
* Update all js and css code snippets with latest version from GitHub.
  * include module file path/name as comment in each snippet
* WIP Update screenshots - frame in phone: https://mockuphone.com/
  * Update "Stop" button in JB to be larger and consistent design, then update second screenshot
* In JS tech details - view switching, simple no router, there's only the main view and an about view
* Explain use of localstorage, namespaced keys for saving user prefs
* For visual progress bar explanation, also show code that calls requestAnimationFrame in a loop
* Shorten up stylesheets section, maybe just need one section.
* Phrasing better explanation on Vitest automated testing
* Phrasing on zero-build section, especially about returning to a project a few months later and webpack or whatever build no longer works
