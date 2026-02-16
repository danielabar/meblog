---
title: "A Vanilla Routing Experiment"
featuredImage: "../images/vanilla-routing-experiment-lidia-nikole-vrkuliNgXx4-unsplash.jpg"
description: "Building client-side routing with vanilla JavaScript: What started as a simple experiment revealed the hidden complexity that SPA frameworks solve for you."
date: "2026-05-01"
category: "javascript"
related:
  - "When the Password Field Says No to Paste"
  - "Copy to Clipboard with Stimulus & Rails"
  - "Rapid Prototyping with ChatGPT: OAS Pension Calculator Part 1"
---

There's something deeply appealing about vanilla JavaScript. In a world of constantly changing frameworks and build tools, I'm drawn to code that just works with what browsers provide, no fragile dependency chains, breaking webpack configs, or afternoon-consuming package-lock conflicts.

Over the years, I've built several portfolio projects like the [OAS Delay Calculator](https://danielabar.github.io/oas-delay-calculator-prototype/) and [Just Breathe](https://danielabar.github.io/just-breathe/) using almost entirely native web APIs, and each time, I'm reminded of how powerful modern browsers have become, and how refreshing it is to skip the build complexity entirely.

But there's always that moment in every project where you build out your main view and think, "You know what would be nice? A few more pages." Maybe an about section, a contact form, or a portfolio gallery. Suddenly, you're faced with a choice: introduce a heavyweight SPA (Single Page Application) framework just for routing, or figure out how to handle navigation yourself.

This question became particularly relevant after reading [Anti-frameworkism: Choosing native web APIs over frameworks](https://blog.logrocket.com/anti-frameworkism-native-web-apis). This article makes a compelling argument for embracing web standards, which got me wondering: What about vanilla routing? How hard could it be to build client-side navigation without a framework?

## The Simple Dream vs. Reality

My idea was to create a set of drop-in routing files that I could reuse across projects. Not a reusable library that others would depend on, but a pattern I could copy and customize for each project's needs. On the surface, the concept sounded simple. Set up an `index.html` with `<nav>` for links, a `<main>` for swappable content, and a `<footer>`. Then listen for navigation events, swap out the content in the main section, and voilà! Client-side routing without the overhead.

To test this routing idea, I built a basic profile website, exactly the kind of project where vanilla routing makes sense. The requirements were intentionally simple: a home page for the main landing content, an about page with static information, and a contact page with an form requiring JavaScript interactivity.

The contact page would be the litmus test. Form validation, submission handling, loading states, displaying a success messages. These interactive behaviors would reveal whether the routing system could handle view-specific logic without devolving into a tangled mess.

For this particular exploration into vanilla routing, I worked with AI assistance, specifically GitHub Copilot with the Claude Sonnet 4 model in VS Code. The AI pair programming approach proved valuable for iterating through different architectural approaches. You can explore the complete implementation at [github.com/danielabar/web_native_routing](https://github.com/danielabar/web_native_routing).

## Naive Implementation

I started with a Router class that maintained a registry of routes, cached templates to avoid repeated network requests, and handled the fundamental mechanics of swapping content and updating browser history. Note that the AI assistant took the initiative to add caching of the view templates and error handling:

```javascript
class Router {
    constructor() {
      this.routes = new Map();
      this.currentRoute = null;
      this.contentElement = document.getElementById('content');
      this.cache = new Map(); // Simple template cache
    }

    /**
     * Initialize router - set up event listeners and handle initial route
     */
    init() {
      // Handle browser back/forward buttons
      window.addEventListener('popstate', (event) => {
        const path = event.state?.route || location.pathname;
        this.navigate(path);
      });

      // Intercept navigation link clicks
      document.addEventListener('click', (event) => {
        const link = event.target.closest('[data-route]');
        if (link) {
          event.preventDefault();
          this.navigate(link.getAttribute('href'));
        }
      });

      this.handleInitialRoute();
    }

    /**
     * Handle the initial page load route
     */
    async handleInitialRoute() {
        const path = location.pathname;
        await this.navigate(path);
    }

    /**
     * Register a new route and content
     */
    addRoute(path, templatePath) {
        this.routes.set(path, templatePath);
    }

    /**
     * Navigate to a specific route
     */
    async navigate(path) {
      if (this.currentRoute === path) return;

      const templatePath = this.routes.get(path);
      await this.loadView(templatePath);

      if (this.currentRoute !== null) {
        history.pushState({ route: path }, '', path);
      }

      this.currentRoute = path;
      this.updateNavigation(path);
    }

    /**
     * Load HTML template and inject into content area
     */
    async loadView(templatePath) {
      if (this.cache.has(templatePath)) {
        this.contentElement.innerHTML = this.cache.get(templatePath);
        return;
      }

      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }

      const html = await response.text();
      this.cache.set(templatePath, html);
      this.contentElement.innerHTML = html;
      this.initializeView();
    }

    /**
     * Update navigation active states
     */
    updateNavigation(currentPath) {
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === currentPath);
      });
    }

    /**
     * Initialize any JavaScript needed for the current view
     */
    initializeView() {
        // Handle contact form if on contact page
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            this.initContactForm(contactForm);
        }
    }

    /**
     * Initialize contact form (example of view-specific functionality)
     */
    initContactForm(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            // Simulate form submission
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success message
            form.innerHTML = '<p class="success">Thank you! Your message has been sent.</p>';
        });
    }
}

// Make Router available globally
window.Router = Router;
```

Here is the `index.html` containing a navigation bar with route links and a content area where views would be swapped:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web Native Routing</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <nav>
        <a href="/" data-route>Home</a>
        <a href="/about" data-route>About</a>
        <a href="/contact" data-route>Contact</a>
    </nav>

    <main id="content"><!-- Views get loaded here --></main>

    <footer>...</footer>

    <script type="module" src="js/router.js"></script>
    <script type="module" src="js/app.js"></script>
</body>
</html>
```

The key was the `data-route` attributes on navigation links and the `content` element where views would be injected. The router would intercept clicks on `data-route` links and swap content dynamically.


And here's how it all came together in the entry point application file:

```javascript
// js/app.js - Bringing it all together
import Router from './router.js';

const router = new Router();

// Register routes mapping URLs to template files
router.addRoute('/', 'views/home.html');
router.addRoute('/about', 'views/about.html');
router.addRoute('/contact', 'views/contact.html');

// Initialize the router (sets up event listeners)
router.init();
```

The basic mechanics worked well. But there was a problem with view-specific JavaScript.

## Problem 1: View Specific Logic Mixed With Router

The contact form needed interactive behavior such as event handlers for form submission, loading states, validation, and success messaging. Where should this logic live? In the naive first attempt, all this logic was placed in the router itself, in a method called `initializeView()` that would check which view was active and initialize the appropriate functionality.

The router was responsible for routing, but it also contained form handling logic, and potentially any other interactive behavior I might need in future views. It was a clear violation of separation of concerns, and I could already see how unwieldy this would become as the application grew.

The second major commit represented a complete architectural overhaul. I realized that views needed to be self-contained units, responsible for their own behavior and lifecycle. The solution was to extract view-specific JavaScript from the monolithic router and give each view its own dedicated script file.

This required restructuring the existing `views` directory from flat HTML files to view-specific subdirectories. Each view would now contain both its template and its interactive logic in one organized location. The router would use ES6 dynamic imports to load view scripts on demand, keeping the router focused purely on navigation.

Here is the new view structure:

```
views/
├── home/
│   ├── template.html
│   └── script.js
├── about/
│   ├── template.html
│   └── script.js
└── contact/
    ├── template.html
    └── script.js
```

With this new structure, route registration changed to point to view directory names instead of template file paths:

```javascript
// Updated app.js after refactoring to view-based architecture
import Router from './router.js';

const router = new Router();

// Routes now point to view directory names (not template files)
router.addRoute('/', 'home');
router.addRoute('/about', 'about');
router.addRoute('/contact', 'contact');

router.init();
```

And here is the updated router, loading HTML templates and view classes that could manage their own lifecycle (showing the key changes; `init()`, error handling, and other utility methods remain similar to the previous version)

```javascript
class Router {
  constructor() {
    this.routes = new Map();

    // NEW: track active view instance for lifecycle cleanup
    this.currentView = null;

    // Existing template cache
    this.templateCache = new Map();

    // NEW: cache loaded view modules (controllers)
    this.viewCache = new Map();

    this.contentElement = document.getElementById('content');
  }

  /**
    * UPDATED: routes now point to a view directory instead of a single template file
    */
  addRoute(path, viewDir) {
    this.routes.set(path, viewDir);
  }

  /**
    * UPDATED: navigation now loads both template + view-specific script
    */
  async navigate(path) {
    const viewDir = this.routes.get(path);
    if (!viewDir) return;

    // NEW: clean up previous view if it defines a destroy hook
    if (this.currentView?.destroy) {
      this.currentView.destroy();
      this.currentView = null;
    }

    // Load HTML
    await this.loadTemplate(`views/${viewDir}/template.html`);

    // Load and initialize JS controller
    await this.loadViewScript(viewDir);

    this.currentRoute = path;
    history.pushState({ route: path }, '', path);
  }

  /**
    * RENAMED: clearer separation of concerns
    */
  async loadTemplate(templatePath) {
    if (this.templateCache.has(templatePath)) {
      this.contentElement.innerHTML = this.templateCache.get(templatePath);
      return;
    }

    const html = await fetch(templatePath).then(r => r.text());
    this.templateCache.set(templatePath, html);
    this.contentElement.innerHTML = html;
  }

  /**
    * NEW: dynamically load view controller module
    */
  async loadViewScript(viewDir) {
    // Use cached module if already loaded
    if (this.viewCache.has(viewDir)) {
      return this.initializeView(this.viewCache.get(viewDir));
    }

    // Dynamic imports return a module object, so accessing .default
    // retrieves the class exported with export default from each view script
    const module = await import(`../views/${viewDir}/script.js`);
    const ViewClass = module.default;

    this.viewCache.set(viewDir, ViewClass);
    this.initializeView(ViewClass);
  }

  /**
    * NEW: lifecycle-safe view initialization
    */
  initializeView(ViewClass) {
    this.currentView = new ViewClass();

    if (this.currentView.init) {
      this.currentView.init();
    }
  }
}
```

Each view class followed a consistent pattern with a default export and lifecycle methods, allowing for proper setup and cleanup:

```javascript
// views/contact/script.js
export default class ContactView {
  constructor() {
    this.formHandler = null;
  }

  init() {
    this.setupContactForm();
  }

  destroy() {
    // Clean up event listeners to prevent memory leaks
    const form = document.getElementById('contact-form');
    if (form && this.formHandler) {
        form.removeEventListener('submit', this.formHandler);
    }
    this.formHandler = null;
  }

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    this.formHandler = async (e) => {
      e.preventDefault();
      await this.handleFormSubmission(form);
    };

    form.addEventListener('submit', this.formHandler);
  }
}
```

This refactoring solved the separation of concerns problem. Views were now self-contained, the router focused purely on navigation logic.

Then I uncovered another critical issue.

## Problem 2: Browser Back/Forward Buttons

Users expect browser navigation to just work. When they click the back button, they should return to the previous view. When they click forward, they should move ahead in their navigation history. This seems basic, but implementing it correctly with the History API turned out to be surprisingly tricky.

My initial implementation created duplicate history entries whenever users used browser navigation. The key insight was learning to distinguish between user-initiated navigation (clicking links) and browser-initiated navigation (back/forward buttons). Each type needed different treatment.

Here's how I solved it by introducing a `pushState` parameter to distinguish between navigation types:

```javascript
async navigate(path, { pushState = true } = {}) {
    // ... navigation logic ...

    // Two guards prevent duplicate history entries:
    // 1. pushState=false for browser back/forward navigation
    // 2. currentRoute===null for initial page load
    if (pushState && this.currentRoute !== null) {
        const fullPath = this.buildFullPath(path);
        history.pushState({ route: path }, '', fullPath);
    }

    // ... rest of navigation logic
}

init() {
    // Handle navigation link clicks
    document.addEventListener('click', async (event) => {
        const link = event.target.closest('a[data-route]');
        if (link) {
            event.preventDefault();
            // User clicked a link: pushState = true (default)
            await this.navigate(link.getAttribute('href'));
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', async (event) => {
        const path = location.pathname;
        // Browser navigation: pushState = false to avoid duplicate entries
        await this.navigate(path, { pushState: false });
    });

    // Handle initial page load
    this.handleInitialRoute();
}
```

The breakthrough was realizing that different types of navigation needed different treatment:

- **User clicks a link**: Create a new history entry with `pushState`
- **Browser back/forward**: Don't create additional entries (just navigate)
- **Initial page load**: Don't push state (the browser already has an entry)

This was a reminder that browser APIs, while powerful, have nuances that framework authors have spent years perfecting.

## Problem 3: Invalid Routes

Up to this point, I had been ignoring a fundamental question: what happens when users type something like `/foo` or `/nonexistent-page` into their browser? Implementing proper invalid route handling meant adding another method to the router:

```javascript
/**
 * Show 404 error page
 */
show404() {
  this.contentElement.innerHTML = `
    <div class="error-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" class="btn btn-primary" data-route>Go Home</a>
    </div>
  `;
}
```

The error method is invoked in the router's `navigate()` method when no route matches the requested path. But the challenge extended beyond just showing an error page. I had to consider:

- Should invalid routes update the browser's address bar?
- What happens if someone bookmarks a 404 URL?
- How does this interact with the SPA fallback system?
- Should 404 pages be treated as "real" routes for history purposes?

Each of these questions led to more edge cases and more code. The simple router was growing more complex as it encountered the realities of user behavior and web standards. My vanilla solution had to discover and solve each problem individually—or decide that for a simple project, it doesn't have to solve every edge case.

## Problem 4: Deployment Path

Another major hurdle emerged during deployment to GitHub Pages, which was URL construction during navigation. Look back at the naive implementation's `navigate()` method. See that `history.pushState()` call?

```javascript
async navigate(path) {
  // ...
  history.pushState({ route: path }, '', path);  // Passing path directly
}
```

This was passing the route path directly to `history.pushState()`—`/about`, `/contact`, etc. This worked locally but broke on GitHub Pages:

- Router received: `/about`
- Browser navigated to: `https://username.github.io/about` ❌
- Should have been: `https://username.github.io/web_native_routing/about` ✅

The router had no subdirectory awareness. After trying auto-detection (too brittle), I settled on explicit configuration via a build script.

First, I added a `deploy_base_path` attribute to `package.json`:

```json
{
  "name": "web_native_routing",
  "version": "1.0.0",
  "deploy_base_path": "/web_native_routing/",
  // ...
}
```

Then created a config file that serves as the single source of truth for the base path:

```javascript
// js/config.js - Development configuration
export const deploymentConfig = {
    basePath: '/', // Local development
    // Build system replaces this for deployment
};
```

The build script copies all the code to a new `dist` directory, then extracts the value from `package.json` and replaces it in the production build:

```bash
#!/bin/bash
# scripts/build.sh

# Extract deploy base path from package.json
DEPLOY_BASE_PATH=$(node -p "require('./package.json').deploy_base_path || '/web_native_routing/'")

# Copy files to dist/
rsync -av --exclude='dist' --exclude='node_modules' --exclude='.git' . dist/

# Replace basePath in config.js for production deployment
sed -i.bak "s|basePath: '[^']*'|basePath: '$DEPLOY_BASE_PATH'|g" dist/js/config.js
rm -f dist/js/config.js.bak
```

The router imports this config and uses a `buildFullPath()` method to construct correct URLs for `history.pushState()`:

```javascript
// Router now constructs URLs correctly for any deployment context
buildFullPath(routePath) {
    if (this.basePath === '/') return routePath;
    if (routePath === '/') return this.basePath.slice(0, -1) || '/';
    return this.basePath + routePath.slice(1);
}

// Fixed navigate() method:
async navigate(path) {
  // ...
  const fullPath = this.buildFullPath(path);
  history.pushState({ route: path }, '', fullPath);
}
```

The irony: I started this project to avoid build complexity, yet deployment realities forced me to introduce exactly that.

## Problem 5: Deep Links

Just when I thought I had routing figured out, I discovered that direct URL access completely broke the application. If a user bookmarked `/about` or refreshed the page while viewing the contact form, they'd get an error. Static hosting providers like GitHub Pages don't know about client-side routes, they look for actual files. This problem required implementing what's known as the SPA fallback pattern—a standard technique for making client-side routes work on static hosts. The solution involved creating a `404.html` file that would intercept failed requests and redirect them back to the main application:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Native Router</title>
    <script type="module">
        // SPA fallback - redirect to configured base path
        import { deploymentConfig } from './js/config.js';

        // Store the intended URL
        sessionStorage.setItem('redirect', location.href);

        // Redirect to app base path (no detection needed)
        location.replace(deploymentConfig.basePath);
    </script>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>
```

The other half of the SPA fallback pattern is in `index.html`, where an inline script restores the intended URL before the router initializes:

```html
<!-- index.html - Restore intended route from 404 redirect -->
<script>
    (function() {
        var redirect = sessionStorage.getItem('redirect');
        sessionStorage.removeItem('redirect');
        if (redirect && redirect != location.href) {
            history.replaceState(null, null, redirect);
        }
    })();
</script>
```

This script runs before the router initializes, so when `handleInitialRoute()` reads `location.pathname`, it gets the user's intended destination, not just the base path. The two-part solution works as follows: when a user visits `/contact` directly, GitHub Pages serves the 404.html which stores the full URL in sessionStorage and redirects to the base path. Then index.html loads, its inline script reads the stored URL, uses `history.replaceState()` to update the browser's address bar back to `/contact`, and deletes the sessionStorage value. Finally, the router initializes and navigates to the correct route based on the restored pathname.

Implementing SPA fallback correctly meant users could bookmark any route, refresh pages without losing their place, and share direct links that worked reliably. But it also meant adding more complexity to handle edge cases that frameworks typically manage invisibly.

## Problem 6: Regression Testing

Building your own routing system means you're now responsible for behaviors that framework users take for granted. With every code change — fixing a bug, adding a feature, refactoring — I found myself doing manual regression testing of the most basic interactions. Click "About". Does it load? Click "Contact". Does it work? Hit the back button twice. Does it return to home? Refresh the page. Does the view persist? Type `/about` directly into the address bar. Does it navigate correctly?

This constant manual verification became exhausting. Framework routers have these fundamentals battle-tested through years of production use and automated test suites, but my vanilla solution required personally verifying everything, every time. The realization hit that I needed comprehensive automated browser tests to maintain confidence in the navigation. So I added Playwright end-to-end tests with Cucumber BDD for Given/When/Then style testing across multiple browsers. Here's an example of the test coverage that became essential:

```gherkin
Scenario: Browser navigation controls
  Given I visit the home page
  When I click the "About" navigation link
  And the URL should be "/about"
  And I click the "Contact" navigation link
  And the URL should be "/contact"
  When I use browser back
  Then I should see "About This Project"
  And the URL should be "/about"
  When I use browser back
  Then I should see "Welcome to Web Native Routing"
  And the URL should be "/"
  When I use browser forward
  Then I should see "About This Project"
  And the URL should be "/about"
```

Setting up Playwright, configuring the test runners for multiple browsers, and writing test scenarios is beyond the scope of this post. If you're interested in the full testing implementation, you can explore the [complete test suite](https://github.com/danielabar/web_native_routing/tree/main/tests/e2e) in the repository.

## To Route Or Not To Route

After working through all these challenges, I gained a deep appreciation for both the power of vanilla JavaScript and the value of well-tested frameworks. The experience clarified when each approach makes sense.

**The Case for Vanilla Routing**

There are compelling reasons to consider building your own routing system. Web standards provide remarkable stability—code written against native APIs works the same way years later, without breaking changes or migration headaches. You'll never spend weeks on "framework upgrade projects" or deal with dependency vulnerability alerts from routing libraries. There's no risk of framework abandonment leaving your project in maintenance limbo.

Building vanilla routing forces you to understand web fundamentals deeply. There's no "magic" happening behind the scenes—you know exactly how every piece works, which makes debugging much more straightforward when issues arise. This knowledge transfers across any JavaScript environment and gives you insights that prove valuable regardless of which tools you use in other projects.

For the right projects, vanilla routing can be perfectly simple. Small to medium static sites with three to ten pages, portfolio and marketing sites, and documentation sites can benefit from the minimal overhead and straightforward implementation. Projects where routing complexity won't grow over time are ideal candidates.

**The Case Against Vanilla Routing**

But there are equally compelling reasons to reach for established routing solutions. The time investment in building, testing, and maintaining your own routing system is substantial. You're reinventing wheels that others have perfected over years of real-world use, and you'll encounter edge cases that you haven't anticipated yet.

For example, my simple attempt leaves some gaps that modern applications often need:

- **URL Parameters**: No built-in support for routes like `/product/:id` or `/user/:id/edit/:field`
- **Nested Routes**: Can't handle complex hierarchies like `/dashboard/users/:id/settings`
- **Query String Parsing**: Manual handling required for URLs like `/products?category=electronics&sort=price`
- **Regex Patterns**: No support for complex URL matching beyond simple string comparison
- **Route Guards**: No authentication or permission checking before navigation
- **Animated Transitions**: No built-in view transition animations or loading states

If your project needs any of the features listed above, you'll likely spend more time building and debugging routing infrastructure than building actual features.

## Closing Thoughts

Building vanilla routing taught me that the web platform is remarkably capable, but using these capabilities directly involves meaningful tradeoffs. The real value wasn't in replacing SPA frameworks entirely, but in understanding what problems they solve through firsthand experience. Sometimes the best tool is the one that lets you ship features instead of debugging browser history APIs, but other times, understanding how things work under the hood is worth the journey itself.
