---
title: "Building a No Frills Meditation App"
featuredImage: "../images/building-no-frills-meditation-app-chelsea-audibert-lDEW4qMiizc-unsplash.jpg"
description: "A skeptical, but-curious take on meditation led me to build Just Breathe, a minimalist, ad-free web app that guides simple timed breathing with no mysticism, no subscriptions, and no distractions, just science-based calm."
date: "2026-03-01"
category: "web development"
related:
  - "Rapid Prototyping with ChatGPT: OAS Pension Calculator Part 1"
  - "Maintain Node.js Version Consistency"
  - "When the Password Field Says No to Paste"
---

This is the story of how I built Just Breathe, a no-frills meditation app: part personal journey, part technical walkthrough.

I first heard about the benefits of meditation years ago on a podcast. An expert practitioner was being interviewed on a health podcast and said if the benefits of meditation were available as a pill, it would make some pharmaceutical company billions in profits. Benefits such as: lower stress, improved sleep, reduced anxiety, better blood pressure, improved focus, clearer thinking, enhanced performance on cognitive tasks, even longevity. I was intrigued enough to buy the author's book, especially because he billed it as a "no BS" guide.

<aside class="markdown-aside">
As someone who's been listening to podcasts for over a decade, I've noticed an increasing trend of podcasts being book tours in disguise: Casual conversations that somehow always end up pitching someone's latest "life changing" book.
</aside>

But then I got to the chapter about people meditating in the forest, claiming they could intuit which plants were safe to eat or use as medicine based on what the plants *told* them during meditation. While I'm sure some people genuinely feel that the plants are communicating with them, that chapter reminded me why I've been skeptical of meditation in the past.

That's been my issue with meditation all along. I'm open to the science, but not the pseudoscience. I also didn't find it easy: trying to meditate on my own usually resulted in me either zoning out or falling asleep. So I turned to a tech solution.

## Digital Helpers

I wanted something simple: a gentle breathing reminder to help me focus. But everything I tried had problems.

* **Guided meditation apps** often required subscriptions. While useful, they never felt worth a recurring fee.
* **Free versions** were full of ads and usually demanded I create an account.
* **Distractions** Even in the health and wellness space, many apps are still designed around the attention economy: upsells, notifications, and nudges to buy extras instead of just letting you breathe.
* **Tone** Full of vague spiritual platitudes and ambient whale sounds. Not my thing.
* **Meditation podcasts** Same issue - plus ads - and often just as "out there."
* **YouTube** Forget it. You sit down to meditate and end up watching cat videos for an hour.

After a while I realized I wasn't looking for "content" at all. I didn't need a guru, a playlist, or a subscription. I just needed a technique, something simple, concrete, and grounded in science.

## Simple Discovery

Then I read the book [Breath: The New Science of a Lost Art](https://www.mrjamesnestor.com/breath-book/), by James Nestor. It made a strong case for a simple, yet effective practice: breathing in through the nose for 5.5 seconds, and out through the nose for 5.5 seconds. Just a few minutes a day, the author argued, could activate the parasympathetic nervous system, improve oxygen saturation, and more.

Nestor calls this technique **Resonant (or Coherent) Breathing**. He describes it as:

> A calming practice that places the heart, lungs, and circulation into a state of coherence, where the systems of the body are working at peak efficiency. There is no more essential technique, and none more basic.

The instructions were straightforward:

* Sit up straight, relax the shoulders and belly, and exhale.
* Inhale softly for 5.5 seconds, expanding the belly as air fills the bottom of the lungs.
* Without pausing, exhale softly for 5.5 seconds, bringing the belly in as the lungs empty.
* Repeat at least ten times, more if possible.

That clicked. Finally, here was something grounded and practical, stripped of mysticism. But when I tried to create a custom meditation session around this technique, new problems emerged.

## Breathing Math

The technique sounds simple, but here's what happened for me in practice:

* **Counting 5.5 seconds** wasn't intuitive, whole numbers felt easier, but stressing about the additional half second defeated the purpose.
* **Constant counting** was distracting, pulling attention away from the feeling of the breath.
* **Mind wandering** often led to zoning out and forgetting the pattern altogether.
* **Knowing when to stop** required setting a timer, but even the gentlest alert felt jarring if already relaxed, undoing the benefit of the session.

After running into all these frictions, I came to the realization that I needed a bare-bones tool that would:

Guide me through 5.5-second breaths with voice prompts,

Keep me on track without me having to count, and

End the session gently, not abruptly.

That was it. Nothing more.

Since I couldn't find it, I decided to build it.

## Building My Own

I opened VS Code, created a new project, and asked my AI assistant to help me put together something simple and mobile-friendly. No frameworks, no accounts, no backend. Just vanilla JavaScript and CSS. Here's the prompt I used:

<aside class="markdown-memory-lane">
Help me think about how I could use vanilla web tech for building the following web app, which will be deployed to github pages because it shouldn't require an application server:

Mobile first layout because it will be used primarily on a phone

Very simple meditation app without all the "woo woo"

Inspired by the learnings from James Nestor book Breath: The New Science of a Lost Art: https://www.mrjamesnestor.com/breath-book/

Essentially the optimal breathing for good health is 5.5 seconds in, 5.5 seconds out, all through the nose

But it's really hard to count 5.5 seconds, and it's kind of distracting to keep counting

I'm picturing an app that prompts user for:

1. How many seconds they want to breathe in (default 5.5)
2. How many seconds they want to breathe out (default 5.5)
3. How many minutes they want to mediate for (default 10 minutes, other options 5, 10, 15..., maybe let user enter their own amount, validation integer, numeric, between 1 and some max)
4. Click Start

At this point the user no longer needs to look at the app, although it should show "something pleasing" if user is looking at it, maybe a horizontal bar animating the time remaining or something like that.

At this point the user would find a comfortable place to sit or lie down where they will be undisturbed for the duration. I'm not sure if these instructions, along with the instruction to nasal breathe should be displayed somewhere in the app either before or after they make their selections. I don't want to confuse the user with too much details, particularly on a small phone screen.

Then the app will play a calming audio voice saying "Breath in" (I don't know where to find such an asset).

Then after the number of seconds have elapsed for breath-in that user selected, same calming audio voice says "Breath out" (again where to find audio asset?).

Then after the duration has elapsed (although let it go past the duration if in the middle of a breath in breath out so they can complete their last breathe out cycle because it would be jarring to be interrupted in the middle), same calming voice says "All done".
</aside>

After submitting that prompt and a good deal of iteration to resolve issues, here are the results:

![just breathe app landing](../images/just-breathe-app-landing.png "just breathe app landing")

After clicking Start, it looks like this in the middle of the session:

![just breathe app session](../images/just-breathe-app-session.png "just breathe app session")

While the session is running the user hears "Breathe in", then 5.5 seconds later (or whatever value they set in the form), "Breathe out". It repeats in this pattern until the session is complete.

* [Live Demo](https://danielabar.github.io/just-breathe/)
* [GitHub Repo](https://github.com/danielabar/just-breathe)

## From Prototype to Structure

The first working version came together quickly, but it wasn't especially tidy. The AI had no trouble producing something functional, but the early iterations tended toward a single, intertwined script where timing, UI updates, voice prompts, and state all lived together. Getting from "it works" to something I could continue to iterate on involved a lot of back-and-forth: asking for smaller files, clearer responsibilities, and refactors that pulled unrelated concerns apart.

What follows walks through some of the technical choices that fell out of that process.

## Technical Highlights

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
│   ├── history.js
│   ├── index.js
│   ├── main.js
│   ├── session.js
│   ├── userPrefs.js
│   └── voice.js
└── styles
    ├── fonts.css
    ├── index.css
    ├── reset.css
    ├── variables.css
    └── (additional component styles...)
```

*Showing key files - see the [GitHub repo](https://github.com/danielabar/just-breathe) for the complete project structure including test files, additional utility modules, and component stylesheets.*

Where `index.html` loads the entry point styles and code:

```htm
<head>
  <!-- other stuff... -->
  <link rel="stylesheet" href="./styles/index.css">
  <script type="module" src="./js/index.js" defer></script>
</head>
```

Even though *Just Breathe* is simple on the surface, a few small technical decisions help keep it lightweight, offline-friendly, and distraction-free.

### Vanilla Stack

Using native ES modules means no bundler or transpiler is needed, and the whole app stays readable to anyone curious about the code. For example, the `js/index.js` entrypoint imports the main, history, and about modules so the views can be toggled (no fancy router needed here for just three views):

```javascript
// js/index.js
import { renderMainView } from './main.js';
import { renderHistoryView } from './history.js';
import { renderAboutView } from './about.js';

const appView = document.getElementById('app-view');
const navMain = document.getElementById('nav-main');
const navHistory = document.getElementById('nav-history');
const navAbout = document.getElementById('nav-about');

function showView(view) {
  if (view === 'about') {
    renderAboutView(appView);
  } else if (view === 'history') {
    renderHistoryView(appView);
  } else {
    renderMainView(appView);
  }
}

navMain.addEventListener('click', () => showView('main'));
navHistory.addEventListener('click', () => showView('history'));
navAbout.addEventListener('click', () => showView('about'));

// Default view
showView('main');
```

This is a simplified version for clarity. The actual implementation includes additional features like mobile hamburger menu, desktop/mobile navigation handling, and the ability to prefill session values from history - see the [repo](https://github.com/danielabar/just-breathe) for the complete code.

### Zero-Build

The entire app runs as a static site. There's no bundler, no framework, no auth, and no build process. It's just plain HTML, JavaScript modules, and CSS. It's deployed via GitHub Pages using the [gh-pages](https://www.npmjs.com/package/gh-pages) npm package. This keeps maintenance simple.

With the architecture in place, the heart of the app is the breathing session itself. The session loop manages timing, state transitions, and voice prompts.

### Session

The session loop keeps track of time, alternates between inhale/exhale, updates the progress bar, and finishes with a friendly close. It's driven by `requestAnimationFrame`, which runs once per frame for smooth updates. This approach provides more precise timing than cascading `setTimeout` calls.

You'll also notice calls to `speak(...)` for voice prompts, I'll explain how that works in the next section.

```js
// js/session.js
function updateState() {
  if (!running) return;

  // Update progress bar based on overall session completion
  elapsed = Date.now() - sessionStart;
  let percent = Math.min(1, elapsed / totalMs);
  progressEl.style.width = (percent * 100) + '%';

  // Check if we're at the end of the session but in "in" state
  if (elapsed >= totalMs && state === 'in') {
    // Let user finish last out-breath before ending
    state = 'out';
    breathStart = Date.now();
    breathMs = outSec * 1000;
    speak('Breathe out');
    stateEl.textContent = 'Breathe out';
  }

  // Check if session is complete and we're on the final out-breath
  if (elapsed >= totalMs && state === 'out') {
    running = false;
    // Wait for the final breath to complete before showing "All done"
    setTimeout(() => {
      stateEl.textContent = 'All done!';
      speak('All done');
      progressEl.style.width = '100%';
      finishSession(true);
    }, outSec * 1000);
    return;
  }

  // Calculate how long we've been in the current breath phase
  let breathElapsed = Date.now() - breathStart;

  // Switch inhale/exhale when time for the current breath is up
  if (breathElapsed >= breathMs) {
    if (state === 'in') {
      state = 'out';
      breathMs = outSec * 1000;
      speak('Breathe out'); // Voice prompts (explained in next section)
      stateEl.textContent = 'Breathe out';
    } else {
      state = 'in';
      breathMs = inSec * 1000;
      speak('Breathe in');
      stateEl.textContent = 'Breathe in';
    }
    // Reset the timer for the new breath phase
    breathStart = Date.now();
  }

  // Continue the animation loop - typically runs 60 times per second
  requestAnimationFrame(updateState);
}
```

This shows the core breathing loop. The full implementation also handles saving completed sessions to history, stop/restart button functionality, and wake lock cleanup when sessions end.

Rather than waiting for exact intervals using timers, the app continuously checks how much actual time has elapsed using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). This schedules the loop to run in sync with the browser's repaint cycle. On each frame, the function compares the current time against when the breath phase started. When the target duration is reached (for example, 5.5 seconds for an inhale), it transitions to the next phase and resets the timer.

When the total time is reached, the app lets you finish your last out-breath before wrapping up, speaking "All done".

### Voice-Guided

All prompts are spoken using the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis), so the user doesn't need to watch the screen during the session. The browser provides the voice, which may sound different depending on the operating system and settings.

The implementation includes some careful tuning to make the voice guidance more pleasant during meditation. The speech rate is slowed down slightly (`0.85`), and the pitch is lowered a bit (`0.9`) to create a calmer, more soothing tone. The function also cancels any previous utterances before speaking - this prevents voice prompts from queuing up or overlapping if something unexpected happens.

Additionally, the function can optionally return the utterance object, which is used during the countdown sequence to synchronize timing with the actual speech events:

```js
// js/voice.js
export function speak(text, returnUtterance = false) {
  if (!('speechSynthesis' in window)) return;
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.rate = 0.85;    // Slightly slower for a calmer pace
  utter.pitch = 0.9;    // Slightly lower for a soothing tone
  utter.lang = 'en-US';
  window.speechSynthesis.cancel(); // Stop any previous utterances
  window.speechSynthesis.speak(utter);
  if (returnUtterance) return utter; // Used for countdown timing
}
```

### Staying Awake

Sessions request a screen [wake lock](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock) so the device won't lock up in the middle of the breathing exercise. Since this API is relatively new and can fail for various reasons (battery saver mode, permissions, browser support), the implementation includes proper feature detection and error handling.

The wake lock is a nice-to-have enhancement rather than a critical feature - if it fails, the app still works perfectly fine, users just need to keep their screen awake manually. That's why the catch block intentionally does nothing beyond acknowledging the failure. The function also sets up a listener to clean up the wake lock reference when it's released:

```js
// js/session.js
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch (err) {
    // Wake Lock may fail due to battery saver mode or permissions
  }
}
```

### Custom Preferences

Just Breathe remembers your breathing pace and session duration between visits using local storage. To keep the localStorage keys organized and avoid magic strings scattered throughout the code, all keys are defined in a central constants module:

```js
// js/constants.js
export const NAMESPACE = 'justBreathe';
export const PREFS_KEY = `${NAMESPACE}:prefs`;
export const HISTORY_KEY = `${NAMESPACE}:history`;
```

This approach makes it easy to change the namespace if needed, and prevents typos from causing hard-to-debug issues. The keys are then imported and used in the relevant modules:

```js
// js/userPrefs.js
import { PREFS_KEY } from './constants.js';

// Save preferences
localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
```

The app also provides sensible defaults and validation:

```js
const DEFAULT_PREFS = { inSec: 5.5, outSec: 5.5, duration: 10 };

// When loading prefs from local storage
const prefs = JSON.parse(localStorage.getItem('justBreathe:prefs'));
// Validate each value; fallback to defaults if invalid
```

Only reasonable values are accepted: in/out seconds between 1 - 15, and session durations between 1 - 180 minutes. This ensures that even if local storage is corrupted or manually edited, the app still works predictably.

The combination of defaults, validation, and namespacing keeps preferences simple, safe, and completely local - no subscriptions, accounts, or external services required.

### Session History

Beyond preferences, Just Breathe also remembers your last 10 completed sessions. Each session is saved with a timestamp and the breathing settings you used, making it easy to track your meditation practice over time.

The History view displays these sessions in a clean list format, showing when each session took place along with the inhale/exhale duration and total session time. Each entry has a replay button - clicking it navigates back to the main view with those exact settings prefilled, ready to start another session with the same configuration. This makes it effortless to repeat a breathing pattern you found particularly effective.

Session history uses the same localStorage approach as preferences, with automatic management to keep only the most recent entries:

```js
// js/historyStorage.js
import { HISTORY_KEY } from './constants.js';

export function saveSessionToHistory({ inSec, outSec, duration }) {
  const timestamp = Date.now();
  let history = [];

  // Load existing history
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) history = JSON.parse(raw);
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }

  // Add new session at the beginning
  history.unshift({ timestamp, inSec, outSec, duration });

  // Keep only last 10 sessions
  history = history.slice(0, 10);

  // Save back to localStorage
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}
```

The history feature adds a helpful layer of tracking without any server-side complexity or privacy concerns - everything stays on your device.

### Add to Home Screen

Just Breathe isn't in an app store, but it supports "Add to Home Screen", giving it an app-like presence: a standalone window, home screen icon, and quick launch.

Modern browsers like Chrome and Edge use a Web App Manifest, which is linked in `index.html`:

```html
<link rel="manifest" href="site.webmanifest">
```

The manifest defines the app name, icons, start URL, and display mode:

```json
{
  "name": "Just Breathe",
  "short_name": "Just Breathe",
  "icons": [
    {
      "src": "web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

iOS and macOS Safari use the icon and page title defined in `index.html`:

```html
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Just Breathe" />
```

### CSS Modularity

In addition to the JavaScript setup, the CSS is organized into multiple smaller files and brought together in `index.css` using `@import`:

```css
/* styles/index.css */
@import './fonts.css';
@import './reset.css';
@import './variables.css';
@import './global.css';
@import './app.css';
/* ...additional component styles (button.css, history.css) */
```

<aside class="markdown-aside">
While <code>@import</code> has historically been discouraged for performance reasons, since older browsers loaded files sequentially, HTTP/2's multiplexing reduces that concern. In this small app, the tradeoff favors developer experience and maintainability, making the modular file structure more valuable than micro-optimizing CSS delivery. <a class="markdown-link" href="https://css-tricks.com/almanac/rules/i/import">Further reading</a>.
</aside>

### CSS Variables

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

### Variable Font

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

<aside class="markdown-aside">
Since building this app, I came across <a class="markdown-link" href="https://github.com/robzolkos/csscaffold">CSS Scaffold</a>, which offers a very clean and organized approach to structuring CSS. If I were starting a new project today, I'd likely reach for that instead of the more "vibe coded" setup here, which got a little messy.
</aside>

## Final Thoughts

I now use Just Breathe nearly every day after my workout. It's simple, peaceful, and effective. This project reminded me how satisfying it is to build tools *just* for yourself. Especially ones that make your day measurably better.

If you've ever wanted to meditate but got turned off by mysticism, ads, paywalls, or distractions, give [Just Breathe](https://danielabar.github.io/just-breathe/) a try, and let me know if you find it helpful.

<aside class="markdown-aside">
After building the first version of Just Breathe, I discovered the <a class="markdown-link" href="https://pacedbreathing.app/">Paced Breathing</a> app. It's beautifully designed, with musical tones or gentle vibrations to mark breaths, but I still found myself zoning out or falling asleep. For me, the spoken English voice prompts in Just Breathe work better to keep me on task. Paced Breathing also has in-app purchases, which I find a bit distracting, though it's a fantastic option if you want a more polished, feature-rich experience.
</aside>
