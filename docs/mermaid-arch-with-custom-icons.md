# Mermaid Architecture Diagram with Custom Icons

Icons from `https://icones.js.org/collection/` and converted to cdn.

```htm
<!-- https://mermaid.js.org/config/usage.html#cdn -->
<!doctype html>
<html lang="en">

<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>

<body>
  <pre class="mermaid">
  architecture-beta
    group heroku(skill-icons:heroku)[Heroku]

    group web_dyno(carbon:web-services-container)[Web Dyno] in heroku
    group rails_app(skill-icons:rails)[Rails App] in web_dyno

    group dd_cloud(internet)[Datadog Backend]
    service dd_backend(vscode-icons:folder-type-datadog-opened) in dd_cloud

    group worker_dyno(carbon:web-services-container)[Worker Dyno] in heroku
    group rails_app_j(skill-icons:rails)[Rails App] in worker_dyno
    service datadog_gem_j(logos:rubygems)[Datadog Gem] in rails_app_j
    service datadog_agent_j(vscode-icons:file-type-datadog)[Datadog Agent] in worker_dyno

    service datadog_gem(logos:rubygems)[Datadog Gem] in rails_app
    service datadog_agent(vscode-icons:file-type-datadog)[Datadog Agent] in web_dyno

    datadog_gem:R --> L:datadog_agent
    datadog_gem_j:R --> L:datadog_agent_j
    datadog_agent:R --> L:dd_backend
    datadog_agent_j:R --> B:dd_backend
  </pre>

  <button id="downloadBtn">Download Diagram as PNG</button>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    // import html2canvas from 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

    // Register the icon pack for Iconify
    mermaid.registerIconPacks([
      {
        name: 'skill-icons', // Specify the name used in Mermaid syntax (e.g., skill-icons:rails)
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/skill-icons@1/icons.json').then(res => res.json())
      },
      {
        name: 'vscode-icons', // For using icons like vscode-icons:file-type-datadog
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/vscode-icons@1/icons.json').then(res => res.json())
      },
      {
        name: 'logos', // For logos like 'logos:rubygems'
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then(res => res.json())
      },
      {
        name: 'carbon', // Adding the Carbon icons
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/carbon@1/icons.json').then(res => res.json())
      },
    ]);

    // Initialize Mermaid with the configuration
    // mermaid.initialize({ startOnLoad: true });

    // Download button functionality
    document.getElementById('downloadBtn').addEventListener('click', () => {
      const svgElement = document.querySelector('.mermaid svg');

      if (svgElement) {
        // Convert SVG to PNG using html2canvas
        html2canvas(svgElement).then(canvas => {
          // Create a link to download the image
          const link = document.createElement('a');
          link.download = 'mermaid_diagram.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      } else {
        alert('Diagram not rendered yet!');
      }
    });
  </script>
</body>

</html>
```
