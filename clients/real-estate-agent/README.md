# Client Project: Real Estate Agent Corp

Welcome to the isolated workspace for **Real Estate Agent Corp** (`real-estate-agent`).

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
yarn build real-estate-agent

# Validate all assets, templates, and signature markup
yarn validate real-estate-agent

# Preview in browser with viewport switcher
yarn preview real-estate-agent

# Export clean delivery package
yarn export real-estate-agent
```
