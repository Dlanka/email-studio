# Email Template Development Workflow

This document covers best practices, directory conventions, and authoring guidelines for developing responsive email templates using MJML.

---

## 1. Directory Structure

Each client template lives in its own subdirectory inside `clients/<client-slug>/templates/`:

```text
clients/<client-slug>/templates/
├── welcome/
│   ├── email.mjml       # Master MJML authoring file
│   └── README.md        # Template description & placeholder guide
└── order-confirmation/
    ├── email.mjml
    └── README.md
```

To create a new template for a client:

1. Create a new folder: `clients/<client-slug>/templates/<template-name>/`
2. Create `email.mjml` inside that folder.
3. Register the template name in `client.config.json` under `deliverables.templates`.

---

## 2. Using Shared Components and Styles

Templates can reuse shared brand styles and components via `<mj-include>`:

```xml
<mjml>
  <mj-head>
    <mj-title>Your Subject Line Here</mj-title>
    <mj-preview>Preheader text visible in inbox list...</mj-preview>

    <!-- Include shared typography, resets, and utility classes -->
    <mj-include path="../../../shared/mjml/styles/brand-theme.mjml" />
  </mj-head>
  <mj-body background-color="#f8fafc">
    <!-- Reusable components -->
    <mj-include path="../../../shared/mjml/components/header.mjml" />

    <!-- Client specific sections -->
    <mj-section background-color="#ffffff">
      <mj-column>
        <mj-text mj-class="h1">Hello World</mj-text>
      </mj-column>
    </mj-section>

    <mj-include path="../../../shared/mjml/components/footer.mjml" />
  </mj-body>
</mjml>
```

---

## 3. Key Design Rules for Email Templates

### 1. Viewport & Maximum Width

- Standard email width is **600px** to ensure compatibility across desktop clients (Outlook 3-pane view, Thunderbird, Apple Mail).
- Never use full-width multi-column tables without responsive collapsing.

### 2. Typography & Fonts

- Always supply web-safe font fallbacks:
  `font-family="Arial, Helvetica, -apple-system, sans-serif"`
- Outlook for Windows does not load `@import` or Google Fonts. If a custom web font fails to load, Outlook defaults to Times New Roman unless fallback fonts are specified.

### 3. Image Dimensions & Alt Tags

- Every `<mj-image>` **must** include an `alt` attribute.
- Always declare explicit `width` attributes to prevent Outlook from rendering images at their raw unscaled resolution.
- Keep total image weight under 1MB per email to reduce load times on mobile connections.

### 4. Gmail 102 KB Clipping Threshold

- Gmail clips messages whose raw HTML exceeds **102 KB** (displaying the dreaded `[Message clipped] View entire message` link).
- Clipped emails break layout and sever the tracking pixel and unsubscribe links, causing spam complaints.
- Our automated validator flags any template approaching or exceeding 102 KB.

---

## 4. Compilation

Compile templates with:

```bash
# Specific client
yarn build <client-slug>

# All clients
yarn build:all
```

Compiled HTML files are saved to `clients/<client-slug>/dist/templates/<template-name>.html`.
