# Email Testing & Compatibility Guide

Rendering engines in email clients are notoriously fragmented. Unlike modern web browsers that share WebKit/Blink standards, email clients run on vastly different, often legacy engines.

---

## 1. Major Email Rendering Engines

| Email Client                                                  | Rendering Engine                    | Key Quirks & Considerations                                                                                                                                  |
| :------------------------------------------------------------ | :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Microsoft Outlook (Desktop 2016 - 2024 / M365 on Windows)** | Microsoft Word (`mso`)              | No CSS Flexbox, no CSS Grid, no `max-width`, no background images without VML, ignores `margin` on many elements, defaults unknown fonts to Times New Roman. |
| **Outlook for Mac**                                           | WebKit                              | Excellent modern CSS support, supports media queries and responsive styling.                                                                                 |
| **Outlook on the Web (OWA)**                                  | Browser Engine (Blink/WebKit/Gecko) | Strips `<head>` styling in certain scenarios, enforces its own wrapper classes.                                                                              |
| **Gmail (Web & Desktop)**                                     | Blink                               | Strips entire `<style>` block if a single CSS selector is malformed. Enforces 102 KB HTML clipping limit. Dark mode inverts colors dynamically.              |
| **Gmail (iOS & Android Apps)**                                | Mobile WebKit / Blink               | Supports responsive styles unless non-Gmail accounts (IMAP/POP) are used.                                                                                    |
| **Apple Mail (iOS & macOS)**                                  | WebKit                              | Best-in-class email rendering. Full support for HTML5, CSS3, media queries, and Dark Mode `@media (prefers-color-scheme)`.                                   |

---

## 2. Automated Workspace Validation

Run our built-in automated compatibility validator before any manual test:

```bash
yarn validate <client-slug>
```

### What Automated Checks Cover:

- Validates MJML syntax and strict compilation.
- Checks image tags for required `alt` attributes.
- Checks HTML byte size against Gmail's 102 KB clipping threshold.
- Validates signature URL protocols (enforcing `https:`, `mailto:`, `tel:` and rejecting `javascript:` or `data:`).
- Flags CSS Flexbox or CSS Grid in signatures.
- Confirms client output isolation.

---

## 3. Manual Testing Protocol

Automated validation does not guarantee identical visual rendering across all inboxes. Always execute this manual testing protocol prior to client delivery:

### Step 1: Real Inbox Test Sends

Send live test emails using test tools (e.g. Mailtrap, Litmus, Email on Acid, or direct test sends):

1. **Gmail (Web Browser)**: Inspect rendering on Chrome, Safari, and Firefox.
2. **Gmail Mobile App (iOS & Android)**: Check column stacking and touch-target button sizes.
3. **Microsoft Outlook for Windows (Desktop)**: Check table alignment, font rendering, and button borders.
4. **Apple Mail (macOS & iOS)**: Verify high-DPI logo sharpness and dark mode.

### Step 2: Dark Mode Inspection

Check both **Partial Inversion** (Outlook) and **Full Inversion** (Gmail App):

- Ensure transparent PNG logos have appropriate contrast or a subtle outline so dark typography remains legible against dark backgrounds.
- Avoid pure `#ffffff` text on pure `#000000` backgrounds without testing inversion.

### Step 3: Images-Disabled Test

Many corporate firewalls and privacy settings disable image loading by default:

- Confirm that `alt` text is legible and descriptive.
- Confirm that key CTAs are rendered as HTML buttons (`<mj-button>`), **never** as text embedded inside images!
- Verify that table layouts retain their structure even when image dimensions collapse.

### Step 4: Link & UTM Verification

- Click every link in the email (Header logo, CTAs, product links, footer social links, unsubscribe).
- Ensure all telephone links (`tel:`) and email links (`mailto:`) open phone dialers and mail composers properly.
