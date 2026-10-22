# Email Signature Workflow

## Overview

This directory contains the source markup, custom styles, and contact payload for client email signatures.

## Files

- `signature.html`: Master HTML table template with token interpolation (`{{fullName}}`, `{{jobTitle}}`, etc.)
- `signature.css`: Custom client styles inlined into tables during compilation.
- `signature-data.json`: The data source containing names, titles, direct lines, company website, and logo references.

## Output Deliverables

Running `yarn build <client-slug>` generates:

1. `dist/signatures/signature.html`: Ready-to-copy HTML snippet with 100% inline CSS.
2. `dist/signatures/signature.txt`: Clean, professional plain text alternative.
3. `dist/signatures/signature-preview.html`: Standalone browser preview page with quick copy buttons and client installation guides.

## Important Client Delivery Note

For production use by client team members, make sure that `logoUrl` in `signature-data.json` points to an **absolute, publicly accessible HTTPS URL** (e.g. Amazon S3, Cloudflare R2, or the client's public website CDN). Local relative paths (`../assets/logos/logo.png`) will **NOT** display when the recipient opens the email in external inboxes!
