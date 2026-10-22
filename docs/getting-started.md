# Getting Started Guide

Welcome to the **Email Development Workspace**! This guide walks you through setting up your local environment, creating a new client, authoring responsive email templates and HTML signatures, validating outputs, and packaging deliveries for freelance clients on Upwork.

---

## 1. Prerequisites

Before using the workspace, ensure you have the following installed on your system:

- **Node.js**: LTS version (v18, v20, v22, or v24).
- **Yarn**: Classic Yarn v1 (`1.22.x`).

Check your versions:

```bash
node -v
yarn -v
```

---

## 2. Installation

1. Clone or open the repository.
2. Install project dependencies:

```bash
yarn install
```

---

## 3. Core Architecture

The workspace is organized around **two independent deliverable types** and **client isolation**:

```text
email-development-workspace/
├── clients/              # Isolated client workspaces
│   ├── _template/        # Master scaffold for new clients
│   ├── client-acme/      # Example client project
│   └── client-example/
├── scripts/              # TypeScript CLI scripts (build, validate, export, preview)
├── shared/               # Shared MJML components, signature resets, and utilities
├── previews/             # Local preview studio web application
└── docs/                 # Guides and standard operating procedures
```

### Key Principles:

- **Client Isolation**: Each client has their own folder with brand guidelines, colors, fonts, assets, and compiled outputs. Client A's assets never mix with Client B's.
- **MJML for Templates**: Full-page marketing and transactional emails are authored in `.mjml` and compiled to responsive HTML.
- **Pure HTML Tables for Signatures**: Email signatures use table markup with inline CSS. MJML is strictly avoided for signatures to prevent bloated wrappers and CSS resets.

---

## 4. Quick-Start Workflow

Follow this 5-step workflow for every client contract:

### Step 1: Create the Client Workspace

```bash
yarn client:create client-xyz
```

This generates `clients/client-xyz/` from `_template/` with customized `client.config.json` and boilerplate assets.

### Step 2: Configure Brand Identity

Update:

- `clients/client-xyz/client.config.json`: Brand colors, logo dimensions, website, and company address.
- `clients/client-xyz/brand/colors.json`: Color palette references.
- `clients/client-xyz/assets/logos/logo.png`: Brand logo.

### Step 3: Develop Deliverables

- **Templates**: Edit or add `.mjml` files in `clients/client-xyz/templates/`.
- **Signatures**: Update `signature-data.json`, `signature.html`, and `signature.css` in `clients/client-xyz/signatures/`.

### Step 4: Validate and Preview

```bash
# Validate markup, links, assets, and Gmail clipping limits
yarn validate client-xyz

# Preview in browser with desktop/mobile viewports
yarn preview client-xyz
```

### Step 5: Export Delivery Package

```bash
yarn export client-xyz
```

This compiles the latest assets and exports a self-contained client package to `delivery/client-xyz/`, complete with an ESP import guide and installation instructions for Upwork delivery.
