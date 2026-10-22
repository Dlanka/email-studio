# Client Project: Acme Corp

Welcome to the isolated workspace for **Acme Corp** (`client-acme`).

## Directory Structure

```text
.
├── client.config.json       # Central client branding & configuration
├── brand/                   # Design guidelines, colors, font rules
├── assets/                  # Logos and template images
├── templates/               # MJML email templates
│   ├── welcome/
│   └── order-confirmation/
├── signatures/              # HTML email signatures & data
└── dist/                    # Compiled production deliverables
```

## Quick Commands for This Client

```bash
# Build all templates and signatures
yarn build client-acme

# Validate all assets, templates, and signature markup
yarn validate client-acme

# Preview in browser with viewport switcher
yarn preview client-acme

# Export clean delivery package
yarn export client-acme
```
