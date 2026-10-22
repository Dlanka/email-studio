# Client Project: Example Corp

Welcome to the isolated workspace for **Example Corp** (`client-example`).

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
yarn build client-example

# Validate all assets, templates, and signature markup
yarn validate client-example

# Preview in browser with viewport switcher
yarn preview client-example

# Export clean delivery package
yarn export client-example
```
