# Client Delivery Checklist

Use this checklist before delivering any email templates or signatures to freelance clients on Upwork.

---

## 📋 Pre-Delivery Inspection Checklist

### 1. Source Files & Configuration

- [ ] Client folder slug follows kebab-case naming (`client-<brand>`).
- [ ] `client.config.json` has complete and valid company details (name, support email, website).
- [ ] No confidential personal credentials, tokens, or temporary development keys exist in the repository.
- [ ] Brand colors and fonts match the client's brand guidelines.

### 2. MJML Email Templates

- [ ] Template authors semantic `.mjml` markup.
- [ ] Subject lines and preheader text (`<mj-preview>`) are meaningful and client-approved.
- [ ] All `<mj-image>` tags contain explicit `width` attributes and descriptive `alt` tags.
- [ ] Primary buttons use bulletproof HTML styles, not rasterized graphics.
- [ ] File size check: compiled `.html` is under **102 KB** to prevent Gmail message clipping.
- [ ] Mobile responsive layout tested at **375px** viewport width.
- [ ] Fallback web-safe font stacks declared for Outlook compatibility.
- [ ] Unsubscribe and physical address tokens present in footer for CAN-SPAM / GDPR compliance.

### 3. HTML Email Signatures

- [ ] Built with native HTML `<table>` elements and inline CSS (no MJML).
- [ ] Zero CSS Flexbox, CSS Grid, or `<script>` tags used.
- [ ] Table elements contain `cellpadding="0" cellspacing="0" border="0"`.
- [ ] Logo and social icons point to secure **HTTPS CDN/server URLs**, not local relative files.
- [ ] User details (name, title, direct phone, mobile, email, website) verified.
- [ ] Safe URL schemes used (`https:`, `mailto:`, `tel:`).
- [ ] Plain-text fallback `signature.txt` generated and reviewed.
- [ ] Interactive preview page `signature-preview.html` works with one-click copy buttons.

### 4. Build & Validation

- [ ] Run `yarn clean <client-slug>` to purge old builds.
- [ ] Run `yarn build <client-slug>` and verify 0 compile errors.
- [ ] Run `yarn validate <client-slug>` and confirm 0 errors and 0 warnings.
- [ ] Verify client isolation: no cross-client references exist in `dist/`.

### 5. Final Packaging & Export

- [ ] Run `yarn export <client-slug>`.
- [ ] Confirm export directory structure in `delivery/<client-slug>/`:
  - `templates/` containing compiled `.html` files.
  - `signatures/` containing `signature.html`, `signature.txt`, and `signature-preview.html`.
  - `assets/` containing production logos and icons.
  - `README.md` containing client-specific ESP import instructions (Mailchimp, Klaviyo, HubSpot, Sendgrid) and signature setup guides (Gmail, Outlook, Apple Mail).
- [ ] Zip or package `delivery/<client-slug>/` for Upwork milestone submission.
