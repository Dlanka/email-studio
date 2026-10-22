# Multi-Client Management & Isolation

This guide explains how client projects are isolated, how brand configurations work, and how to safely maintain dozens of active client projects without data contamination.

---

## 1. Principles of Client Isolation

When working with multiple clients on Upwork:

- **No Shared Assets in Production**: Each client must have their own logos, imagery, and typography settings in their dedicated folder.
- **Strict Directory Boundaries**: Client scripts validate that resolved paths never escape `clients/<client-slug>/`. Directory traversal tokens (`..`, `/`, `\`) are strictly rejected.
- **Isolated Dist & Delivery**: Build commands write only to `clients/<client-slug>/dist/` and `delivery/<client-slug>/`. The automated validator inspects compiled deliverables to ensure no paths from other clients leaked into the output.

---

## 2. Client Lifecycle

### Creating a Client

```bash
yarn client:create client-brandname
```

- Slugs must be lowercase alphanumeric with single hyphens (`client-[a-z0-9-]+`).
- Fails with a clear error if the directory already exists (no accidental overwrites).
- Automatically updates `client.config.json` and `README.md` with client metadata.

### Listing Clients

```bash
yarn clients:list
```

Prints a table of all existing clients, the number of templates configured, signature availability, and current build status.

### Building

```bash
# Build one client
yarn build client-brandname

# Build all clients
yarn build:all
```

### Validating

```bash
# Validate one client
yarn validate client-brandname

# Validate all clients
yarn validate:all
```

### Exporting Deliverables

```bash
# Export one client
yarn export client-brandname

# Export all clients
yarn export:all
```

Copies compiled deliverables, client assets, and customized ESP/signature delivery guides into `delivery/<client-slug>/`.

### Cleaning

```bash
# Clean one client's dist
yarn clean client-brandname

# Clean all clients' dist and global delivery/ folder
yarn clean
```

---

## 3. Configuration Reference: `client.config.json`

Every client folder contains a `client.config.json`:

```json
{
  "name": "Acme Corp",
  "slug": "client-acme",
  "version": "1.0.0",
  "brand": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#1e293b",
      "accent": "#f59e0b",
      "background": "#f8fafc",
      "surface": "#ffffff",
      "textPrimary": "#0f172a",
      "textSecondary": "#64748b",
      "border": "#e2e8f0"
    },
    "fonts": {
      "primary": "Arial, Helvetica, sans-serif",
      "secondary": "Georgia, serif",
      "fallback": "sans-serif"
    },
    "logo": {
      "path": "assets/logos/logo.png",
      "alt": "Acme Logo",
      "width": 160,
      "height": 40,
      "url": "https://example.com"
    }
  },
  "company": {
    "name": "Acme Technologies Inc.",
    "website": "https://example.com",
    "address": "100 Innovation Way, San Francisco, CA 94105",
    "supportEmail": "support@example.com"
  },
  "deliverables": {
    "templates": ["welcome", "order-confirmation"],
    "signatures": true
  },
  "buildOptions": {
    "minify": false,
    "beautify": true,
    "inlineCss": true,
    "keepComments": false
  },
  "hosting": {
    "assetBaseUrl": "https://cdn.example.com/assets/"
  }
}
```
