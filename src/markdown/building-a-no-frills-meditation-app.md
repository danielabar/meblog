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

I first heard about the benefits of meditation years ago on a podcast. An expert practitioner was being interviwed on a health podcast and said if the benefits of meditation were available as a pill, it would make some pharma company billions in profits. Benefits such as: lower stress, reduced anxiety, better blood pressure, improved focus, clearer thinking, enhanced performance on cognitive tasks, even longevity. I was intrigued enough to buy the author's book, especially because he billed it as a "no BS" guide.

But then… I got to the chapter about people meditating in the forest, claiming they could intuit which plants were safe to eat or use as medicine based on what the plants *told* them during meditation. While I’m sure some people genuinely feel that the plants are communicating with them, that chapter reminded me why I’ve often been skeptical of meditation in the past.

That’s been my issue with meditation all along. I’m open to the science, but not the pseudoscience. I also didn’t find it easy: trying to meditate on my own usually resulted in me either zoning out or falling asleep. So I turned to a tech solution.

## The Problem with Meditation Apps

I wanted something simple: a gentle breathing reminder to help me focus. But everything I tried had problems.

* **Guided meditation apps** often required subscriptions. And it just didn't feel like something I should have to pay monthly for.
* **Free versions** were full of distracting ads and usually demanded I create an account.
* **Tone** Full of vague spiritual platitudes and ambient whale sounds. Not my thing.
* **Meditation podcasts**? Same issue - plus ads - and often just as "out there."
* **YouTube**? Forget it. You sit down to meditate and end up watching cat videos for an hour.

Then I read *Breath* by James Nestor. It made a strong case for a simple practice: breathing in through the nose for 4.5 seconds, and out through the nose for 4.5 seconds - just a few minutes a day could activate the parasympathetic nervous system, improve oxygen saturation, and more.

That clicked. But when I tried to create a custom meditation session using this technique, new problems appeared.

## Breathing Math

Counting 4.5 seconds in my head wasn’t intuitive - whole numbers felt easier, but I’d stress about getting the “.5” right. Not exactly calming.

I also found it irritating to keep counting, was a distraction from trying to focus on the feeling of the breath in and out.

I also found myself zoning out, mind wandering, forgetting what I'm supposed to be doing.

I also had to set a time limit, since I could only spare a few minutes a day on this activity. So I’d set a phone timer, but even the gentlest tones startled me if I had drifted into a relaxed state, which felt like it was undoing the entire benefit of the session.

So I thought: what I really want is an app that simply says:

> "Breathe in" ... 4.5 seconds ... "Breathe out" ... 4.5 seconds ... repeat ... then "All done."

No bells, no ads, no login, no mystical forest energy. Just breathing with a reminder on each breath so I don't drift too far off, then when finished, a gentle phrase to let me know the session is complete, without startling me out of the relaxed state.

## So I Built It

I opened VSCode, created a new project, and prompted my AI assistant to help build something simple and mobile-friendly - no frameworks, no accounts, no backend, just vanilla JS and CSS.

Prompt:
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

Then the app will play a calming audio voice saying "Breath in" (I don't know where to find such an asset)

Then after the number of seconds have elapsed for breath-in that user selected, same calming audio voice says "Breath out" (again where to find audio asset?)

Then after the duration has elapsed (although let it go past the duration if in the middle of a breath in breath out so they can complete their last breathe out cycle because it would be jarring to be interrupted in the middle), same calming voice says "All done".

After submitting that prompt and a good deal of iteration, here are the results:

![just breathe app landing](../images/just-breathe-app-landing.png "just breathe app landing")

In the middle of a session:

![just breathe app session](../images/just-breathe-app-session.png "just breathe app session")

* [Live Demo](https://danielabar.github.io/just-breathe/)
* [GitHub Repo](https://github.com/danielabar/just-breathe)

## A Few Technical Highlights

This app is deliberately minimal - no frameworks, no backend, no build system. Just modern browser APIs and modular JavaScript. Here's a closer look at some of the details.

### Modular JavaScript with ESM

All JavaScript is split into modules using [ESM (ECMAScript Modules)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), so each part of the app is responsible for its own domain: UI rendering, voice, session control, etc.

**index.js**

```js
import { renderMainView } from './main.js';
import { renderAboutView } from './about.js';

function showView(view) {
  // toggles between #view-main and #view-about
}
```

**main.js**

```js
import { startBreathingSession } from './session.js';

export function renderMainView(container) {
  container.innerHTML = `...form and session area...`;
  // Sets up form, validates input, triggers session
}
```

**session.js**

```js
import { speak } from './voice.js';

export function startBreathingSession({ inSec, outSec, durationMin, container, onDone }) {
  // Handles countdown, state transitions, and animation
}
```

### Voice Prompts via Speech Synthesis API

Instead of bundling audio files, the app uses the built-in [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance) to generate voice prompts.

**voice.js**

```js
export function speak(text, returnUtterance = false) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.85;
  utter.pitch = 0.9;
  utter.lang = 'en-US';
  window.speechSynthesis.cancel(); // Stop any ongoing utterances
  window.speechSynthesis.speak(utter);
  return returnUtterance ? utter : undefined;
}
```

To chain events (e.g. countdown), we return the utterance and listen for the `end` event:

```js
function speakAndWait(text, pauseMs, cb) {
  const utter = speak(text, true);
  if (utter?.addEventListener) {
    utter.addEventListener('end', () => setTimeout(cb, pauseMs));
  } else {
    setTimeout(cb, pauseMs);
  }
}
```

### Customizable Breathing Timing + Duration

The form accepts precise inhale/exhale timing down to tenths of a second. On submit, it converts everything to milliseconds and starts the session.

**main.js**

```js
form.addEventListener('submit', e => {
  e.preventDefault();
  const inSec = parseFloat(form.elements['in'].value);
  const outSec = parseFloat(form.elements['out'].value);
  const duration = getDurationFromForm();

  startBreathingSession({
    inSec,
    outSec,
    durationMin: duration,
    container: container.querySelector('#session-area'),
    onDone: () => renderMainView(container)
  });
});
```

**session.js**

```js
// Start breathing loop with alternating "Breathe in"/"Breathe out" every breathMs
function updateState() {
  const breathElapsed = Date.now() - breathStart;
  if (breathElapsed >= breathMs) {
    state = (state === 'in') ? 'out' : 'in';
    breathMs = (state === 'in' ? inSec : outSec) * 1000;
    speak(`Breathe ${state}`);
    stateEl.textContent = `Breathe ${state}`;
    breathStart = Date.now();
  }
  requestAnimationFrame(updateState);
}
```

### Wake Lock API for Mobile Reliability

To prevent the screen from dimming or locking mid-session, the app uses the [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock). Without this, mobile sessions would often stop prematurely.

**session.js**

```js
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch (err) {
    // silently ignore errors
  }
}
```

And it's released at the end of the session or when the user hits Stop:

```js
if (wakeLock && wakeLock.release) {
  wakeLock.release();
  wakeLock = null;
}
```

### Countdown with Voice Sync

The app gently counts down from 3 before starting - both visually and audibly - using a recursive voice-and-wait function. This helps users settle in before the session starts - especially useful when using the app lying down:

**session.js**

```js
function startCountdown(count) {
  if (count === 0) {
    startBreathing();
    return;
  }

  stateEl.textContent = count === 3 ? 'Starting in 3...' : `${count}...`;
  speakAndWait(count === 3 ? 'Starting in 3' : String(count), 1000, () => {
    startCountdown(count - 1);
  });
}
```

### Visual Progress Bar

While the app is meant to be audio-led, there's also a non-distracting progress bar to give users a sense of how far along they are.

**session.js**

```js
function updateState() {
  elapsed = Date.now() - sessionStart;
  const percent = Math.min(1, elapsed / totalMs);
  progressEl.style.width = (percent * 100) + '%';
  // ...
}
```

This updates every frame using `requestAnimationFrame`, so it remains fluid and responsive without timers or intervals.

### Remember Preferences

Explain use of localstorage, namespaced key(s) to remember user's previous selections so they don't need to fill out the form each time.

### Modular Stylesheets

The CSS here is lean and modular - no Tailwind, no frameworks, no CSS-in-JS. Just vanilla CSS. Here are a few pieces worth calling out:

Instead of a monolithic CSS file, styles are split into composable layers:

TODO: Is `layers` the right term?

```css
@import './fonts.css';
@import './reset.css';
@import './variables.css';
@import './global.css';
@import './app.css';
```

* **`reset.css`**: A simple reset to unify layout across browsers.
* **`variables.css`**: Centralized color, typography, and spacing variables.
* **`global.css`**: Base typography and layout rules.
* **`app.css`**: App-specific component styles.

### Design Tokens via CSS Custom Properties

Colors, fonts, and layout settings are abstracted into `:root` variables. This enables global theming and consistent styling throughout the app.

```css
:root {
  --font-main: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
  --color-bg: #f6f7f9;
  --color-text: #444;
  --color-accent: #6bb7b7;
  --color-accent-dark: #3a7c7c;
  --color-card: #fff;
  --color-border: #e0e0e0;
  --color-success: #7fd47f;
}
```

Need to change the visual feel later? Update a few tokens - not 50 selectors.

### Centered Layouts with Flexbox

The core layout uses simple, mobile-first flexbox:

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
```

Each view is max-width constrained for readability:

```css
#view-main, #view-about {
  max-width: 420px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  border-radius: 1.5rem;
  background: var(--color-card);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
```

### Animated Progress Bar with Easing

TODO: Does this belong together with JS about requestAnimationFrame?

The session progress is shown visually with a subtle bar using a gradient:

```css
.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-dark), var(--color-accent));
}
```

### Calming Visuals for Guided Breathing

Everything - from spacing to color to button shape - is tuned for calm. A few examples:

* **Rounded buttons and inputs**:

  ```css
  .breath-form button {
    border-radius: 1.5rem;
    padding: 0.7rem 0;
    font-weight: 600;
  }
  ```

* **Neutral background & accent palette**:

  ```css
  body {
    background: var(--color-bg);
    color: var(--color-text);
  }
  header {
    background: var(--color-accent);
    color: #fff;
  }
  ```

* **Instructions panel with soft colors**:

  ```css
  .instructions {
    background: var(--color-accent-light);
    color: var(--color-accent-dark);
    border-radius: 1rem;
    padding: 1rem;
  }
  ```

The tone is supportive and quiet - even before the voice kicks in.

### 🧬 Fully Variable Fonts with Fallbacks

Variable font **Inter Variable** for performance and typographic flexibility, with proper fallbacks and font-display for perceived speed:

```css
@font-face {
  font-family: 'Inter';
  src: url('../assets/fonts/InterVariable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

This loads fast, scales well, and looks sharp across devices.

### Mobile-First with Touch-Friendly Inputs

All inputs and buttons are `100%` width on mobile, with ample spacing and large touch targets:

```css
.breath-form input,
.breath-form button {
  width: 100%;
  padding: 0.5rem;
  font-size: 1.1rem;
}
```

And it's all fluidly contained within `max-width: 420px` so it doesn’t sprawl on wide screens.

### Automated Testing

Even though it's a small project, I found myself iterating and adding features often enough that it was worth having some automated test coverage.

Testing with Vitest, started with Jest but surprised that it doesn't support ESM easily (some experimental feature that felt very messy). Out of scope to get into all the details so just point to some relevant files in project like vitest.config.js to configure jsdom (since this is a browser based project, not back end node) and coverage reporting.

### Zero-Build, Zero-Dependency

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
* intro para
  * need to somewhere mention this post will explain how i built a vanilla js/css web app for meditation and why i built it...
* WIP main content
* conclusion para
* edit
* Insert joke about podcasts being book tours in disguise.
* Somewhere work in I always thought you had to buy in to a religion or something, since meditation is often associated with buddhism
* Add link to Breath book
* Maybe a few more details about the optimal breathing cadence and importance of nasal breathing from book
* Update all js and css code snippets with latest version from GitHub.
* Update screenshots - border? consistent
* In JS tech details - view switching, simple no router, there's only the main view and an about view
* Explain use of localstorage, namespaced keys for saving user prefs
* For visual progress bar explanation, also show code that calls requestAnimationFrame in a loop
* Shorten up stylesheets section, maybe just need one section.
* Phrasing better explanation on Vitest automated testing
* Phrasing on zero-build section, especially about returning to a project a few months later and webpack or whatever build no longer works
