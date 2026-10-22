# Professional Email Development Workspace

A production-ready, reusable workspace engineered for developing, organizing, previewing, testing, and delivering responsive email templates and HTML email signatures for freelance and agency clients.

Built with **Node.js**, **TypeScript**, **MJML**, **Juice**, and a local **Preview Studio**.

---

## 🌟 Key Features

- **Multi-Client Isolation**: Each client has an independent directory with isolated templates, signatures, brand assets, configuration, and build deliverables.
- **Responsive MJML Templates**: Author modern, semantic email templates using MJML that compile to bulletproof, cross-client HTML.
- **Pure HTML Email Signatures**: Standalone table-based signature workflow with automated CSS inlining (via Juice), plain-text generation, safe token interpolation, and zero MJML bloat.
- **Automated Quality & Compatibility Checks**: Automated linting for MJML compilation, image alt attributes, table resets, URL protocol safety, and Gmail's 102 KB clipping threshold.
- **Interactive Preview Studio**: Local web dashboard with Desktop (650px), Mobile (375px), and Fluid viewports, dark/light theme switching, and live HTML size inspection.
- **Automated Delivery Packaging**: One-command export to `delivery/<client-slug>/` complete with customized ESP import guides (Mailchimp, Klaviyo, HubSpot, SendGrid, ActiveCampaign) and email client signature setup instructions.

---

## 📁 Repository Structure

```text
email-development-workspace/
├── clients/
│   ├── _template/                 # Master scaffold copied when creating new clients
│   │   ├── client.config.json     # Client brand & metadata configuration
│   │   ├── README.md              # Client-specific notes & instructions
│   │   ├── brand/                 # Guidelines, colors.json, fonts.md
│   │   ├── assets/                # Local brand logos and template imagery
│   │   ├── templates/             # MJML templates (welcome, order-confirmation)
│   │   ├── signatures/            # HTML signature templates and data
│   │   └── dist/                  # Compiled client outputs (.gitignore except .gitkeep)
│   ├── client-acme/               # Production example client: Acme Corp
│   └── client-example/            # Production example client: Example Corp
├── scripts/
│   ├── create-client.ts           # Scaffold new client workspace
│   ├── list-clients.ts            # Summary table of all clients & build states
│   ├── build.ts                   # Compile MJML and HTML signatures
│   ├── validate.ts                # Strict linting, asset & compatibility validation
│   ├── export-client.ts           # Package final delivery bundles with README
│   ├── preview.ts                 # Live local preview server
│   └── clean.ts                   # Purge build outputs
├── shared/
│   ├── mjml/
│   │   ├── components/            # Shared header, footer, button, divider
│   │   └── styles/                # Brand theme & mj-attributes
│   ├── signatures/
│   │   ├── base.css               # Shared email-safe signature CSS reset
│   │   └── README.md              # Signature architecture principles
│   └── utils/
│       ├── escape.ts              # XSS-safe HTML & attribute escaping
│       ├── url-validator.ts       # Protocol safety whitelist (https, mailto, tel)
│       ├── template-engine.ts     # Safe token interpolation ({{key}}, {{#if}})
│       ├── path-utils.ts          # Path traversal protection & directory resolution
│       └── logger.ts              # Colorized terminal logging
├── previews/
│   └── index.html                 # Interactive preview dashboard
├── docs/
│   ├── getting-started.md         # Onboarding & quick-start guide
│   ├── email-template-workflow.md # Complete MJML template development guide
│   ├── signature-workflow.md      # HTML table signature development guide
│   ├── client-management.md       # Multi-client isolation principles
│   ├── testing-and-compatibility.md# Inbox rendering & compatibility guide
│   └── delivery-checklist.md      # Upwork pre-delivery checklist
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: LTS version (`v18+`, `v20+`, `v22+`, or `v24+`)
- **Yarn**: Classic Yarn v1 (`1.22.x`)

### Installation

```bash
# Clone the repository
git clone <repo-url> email-development-workspace
cd email-development-workspace

# Install pinned dependencies
yarn install
```

---

## 💻 CLI Commands

| Command                     | Description                                                         |
| :-------------------------- | :------------------------------------------------------------------ |
| `yarn client:create <slug>` | Scaffold a new isolated client workspace from `_template/`          |
| `yarn clients:list`         | List all configured clients, deliverable counts, and build states   |
| `yarn build <slug>`         | Compile MJML templates and signatures for a specific client         |
| `yarn build:all`            | Compile templates and signatures for all configured clients         |
| `yarn validate <slug>`      | Run automated linting, link checking, and compatibility tests       |
| `yarn validate:all`         | Run validation across all client workspaces                         |
| `yarn preview [slug]`       | Launch the browser Preview Studio with responsive viewport switcher |
| `yarn export <slug>`        | Generate clean client delivery bundle in `delivery/<slug>/`         |
| `yarn export:all`           | Export delivery bundles for all clients                             |
| `yarn clean [slug]`         | Remove compiled outputs in `dist/` and `delivery/`                  |
| `yarn format`               | Format repository source files using Prettier                       |
| `yarn lint`                 | Lint TypeScript code using ESLint                                   |

---

## 🛠️ Step-by-Step Client Workflow

### 1. Scaffold a New Client

```bash
yarn client:create client-nike
```

Creates `clients/client-nike/` with populated `client.config.json`, assets, templates, signatures, and documentation.

### 2. Configure Brand Identity

Edit `clients/client-nike/client.config.json`:

- **Colors**: Set `primary`, `secondary`, `accent`, `background`, etc.
- **Logo**: Configure logo dimensions, alt text, and fallback URL.
- **Company**: Set official legal name, website, and support email.

### 3. Develop MJML Email Templates

Author `.mjml` files in `clients/client-nike/templates/<template-name>/email.mjml`:

- Use `<mj-include path="../../../shared/mjml/styles/brand-theme.mjml" />` for consistent typography and button conventions.
- Use `<mj-include path="../../../shared/mjml/components/footer.mjml" />` for compliant footers.

### 4. Develop HTML Email Signatures

- Configure employee details in `clients/client-nike/signatures/signature-data.json`.
- Customize layout in `clients/client-nike/signatures/signature.html` (pure HTML tables).
- Customize styling in `clients/client-nike/signatures/signature.css`.
- The build automatically inlines all CSS and generates both `signature.html` and `signature.txt`.

### 5. Validate & Preview

```bash
# Check syntax, image alts, URL safety, and Gmail clipping
yarn validate client-nike

# Preview in interactive studio
yarn preview client-nike
```

### 6. Export for Upwork Client Delivery

```bash
yarn export client-nike
```

Produces `delivery/client-nike/`:

```text
delivery/client-nike/
├── templates/
│   ├── welcome.html
│   └── order-confirmation.html
├── signatures/
│   ├── signature.html       # Standalone HTML snippet with inline CSS
│   ├── signature.txt        # Plain text fallback
│   └── signature-preview.html # Interactive preview with copy buttons
├── assets/
│   └── logos/
└── README.md                # Client instructions for Mailchimp, Klaviyo, Gmail, Outlook
```

---

## 🌐 Image Hosting Requirements

When delivering templates and signatures:

1. **Templates**: Local images in `assets/` can be uploaded to the client's ESP (e.g. Mailchimp/Klaviyo image manager), or hosted on a CDN (e.g., Cloudflare R2, AWS S3).
2. **Signatures**: **Signatures must always use public HTTPS URLs.** A recipient's inbox cannot access images stored on your local drive. Ensure `logoUrl` in `signature-data.json` points to an active HTTPS host before final delivery.

---

## 🛡️ Email Client Compatibility & Limitations

- **Browser Previews vs. Real Inboxes**: A browser preview uses modern Blink/WebKit rendering. Real inboxes like **Microsoft Outlook for Windows** use Microsoft Word's legacy rendering engine, which does not support CSS Flexbox, Grid, or modern CSS variables.
- **Always Test Before Delivery**: In addition to local automated validation, perform manual test sends to Gmail (Desktop & Mobile app), Outlook Desktop, and Apple Mail.
- Refer to [docs/testing-and-compatibility.md](file:///g:/Upwork/Enails%20Projects/docs/testing-and-compatibility.md) for full details.

---

## ❓ Troubleshooting

| Issue                                     | Cause                              | Solution                                                                                           |
| :---------------------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------- |
| `Cannot find module` or TS path errors    | Relative path resolution           | Use `@shared/*` or explicit relative imports with `.js` extension for ESM.                         |
| Gmail clips email message                 | Raw HTML exceeds 102 KB            | Run `yarn validate <slug>` to locate large markup. Remove unused HTML comments or simplify tables. |
| Outlook ignores custom font               | Outlook Word engine fallback       | Define web-safe fallbacks: `font-family: Arial, Helvetica, sans-serif;`.                           |
| Signature image broken in recipient inbox | Local image path used in signature | Replace local path with an absolute HTTPS URL in `signature-data.json`.                            |

---

## 📄 License

MIT. Free for commercial and freelance use.
