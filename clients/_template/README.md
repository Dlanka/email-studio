# Client Project: {{CLIENT_NAME}}

Welcome to the isolated workspace for **{{CLIENT_NAME}}** (`{{CLIENT_SLUG}}`).

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
yarn build {{CLIENT_SLUG}}

# Validate all assets, templates, and signature markup
yarn validate {{CLIENT_SLUG}}

# Preview in browser with viewport switcher
yarn preview {{CLIENT_SLUG}}

# Export clean delivery package
yarn export {{CLIENT_SLUG}}
```
