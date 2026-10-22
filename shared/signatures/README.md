# Shared Email Signatures Architecture

This directory contains shared styling rules and design principles for HTML email signatures across all client projects.

## Why Not MJML for Signatures?

MJML is built for full email documents (`<html>...</html>` with `viewport`, media queries, responsive wrappers, etc.). Email signatures, by contrast, are pasted into an existing email composer's body as a discrete `<table>` fragment.

Using MJML for email signatures results in:

- Bloated markup with wrapper tags that break client compose panes.
- Conflicting CSS reset classes when inserted into Gmail or Outlook.
- Unpredictable behavior when recipients reply or forward.

Instead, our workspace uses **native HTML tables + inline CSS**, compiled via Juice and validated for email-client safety.

## Best Practices Followed

1. **Tables Only**: No CSS Grid, no Flexbox, no `div` absolute positioning.
2. **Explicit Dimensions**: All logos and avatars have hardcoded width and height attributes.
3. **Web-Safe Typography**: Arial, Helvetica, Trebuchet MS, Georgia, Times New Roman.
4. **HTTPS Hosted Images**: Images must be hosted on secure remote CDNs/servers with absolute URLs for client delivery.
5. **Clean Plain Text Fallback**: Automatically generated `signature.txt` for plain-text email clients.
