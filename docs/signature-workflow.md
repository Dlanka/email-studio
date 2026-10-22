# HTML Email Signature Workflow

This document details the development and compilation workflow for standalone, table-based HTML email signatures.

---

## 1. Why HTML Tables Over Modern Layouts?

Unlike web pages or full HTML documents, email signatures are injected directly into the user's email composer (e.g., Gmail's compose box or Outlook's inspector window).

### Strictly Forbidden in Email Signatures:

- ❌ **CSS Flexbox & CSS Grid**: Microsoft Outlook (Windows Word engine) and older Android clients do not support Flexbox or Grid. They will render columns stacked or completely misaligned.
- ❌ **`<script>` tags**: Email providers reject or strip JavaScript, or classify messages with scripts as phishing attempts.
- ❌ **External Stylesheets (`<link rel="stylesheet">`)**: Stripped by almost all webmail providers.
- ❌ **Relative Image Paths**: Local files like `../assets/logo.png` will fail when the email is sent to an external recipient.

### Mandatory Architecture:

- ✔ **Table-Based Layout**: Multi-column signatures must be built using nested `<table>`, `<tr>`, and `<td>` elements with explicit attributes: `cellpadding="0" cellspacing="0" border="0"`.
- ✔ **100% Inline CSS**: All styling (`color`, `font-family`, `font-size`, `line-height`, `vertical-align`) must reside directly on `style="..."` attributes on the `<td>` or `<a>` elements.
- ✔ **Absolute HTTPS Asset URLs**: Logos and social icons must be hosted on public, SSL-secured servers or CDNs.

---

## 2. Directory Layout

```text
clients/<client-slug>/signatures/
├── signature.html       # HTML table skeleton with {{variables}}
├── signature.css        # Client-specific styling rules
├── signature-data.json  # Employee and company contact data
└── README.md            # Client signature notes
```

---

## 3. Data Schema: `signature-data.json`

```json
{
  "fullName": "Sarah Jenkins",
  "jobTitle": "Lead Solutions Architect",
  "department": "Engineering & Client Services",
  "companyName": "Acme Corporation",
  "email": "sarah.jenkins@example.com",
  "phone": "+1 (555) 234-5678",
  "mobile": "+1 (555) 987-6543",
  "websiteUrl": "https://example.com",
  "websiteLabel": "www.acme-corp.com",
  "address": "100 Innovation Way, Suite 400, San Francisco, CA 94105",
  "logoUrl": "https://cdn.example.com/logo.png",
  "logoAlt": "Acme Corporation Logo",
  "logoWidth": 140,
  "logoHeight": 35,
  "socialLinks": [
    { "platform": "LinkedIn", "url": "https://linkedin.com/company/example", "label": "LinkedIn" },
    { "platform": "Twitter", "url": "https://twitter.com/example", "label": "Twitter" }
  ],
  "disclaimer": "This email and any attachments are confidential..."
}
```

---

## 4. Compilation Pipeline

When you execute `yarn build <client-slug>`:

1. **Interpolation**: Variables are safely injected into `signature.html` using the template engine with automated HTML escaping.
2. **Inlining**: `shared/signatures/base.css` and the client's `signature.css` are inlined directly into all table elements using `juice`.
3. **Artifact Generation**:
   - `dist/signatures/signature.html`: Ready-to-copy HTML table snippet with zero external dependencies.
   - `dist/signatures/signature.txt`: Clean formatted plain-text copy fallback.
   - `dist/signatures/signature-preview.html`: Browser preview page equipped with one-click "Copy HTML" and "Copy Formatted Signature" buttons.
