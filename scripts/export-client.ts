import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import {
  getClientDir,
  listClientSlugs,
  validateSlug,
  WORKSPACE_ROOT,
  ensureDir,
} from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";
import { buildClient } from "./build.js";
import type { ClientConfig } from "../shared/types.js";

const DELIVERY_ROOT = path.resolve(WORKSPACE_ROOT, "delivery");

async function copyDirectoryContents(src: string, dest: string): Promise<number> {
  if (!existsSync(src)) return 0;
  await ensureDir(dest);
  let copied = 0;
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === ".gitkeep") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copied += await copyDirectoryContents(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
      copied++;
    }
  }

  return copied;
}

function generateDeliveryReadme(config: ClientConfig, slug: string): string {
  const dateStr = new Date().toISOString().split("T")[0];
  return `# Deliverables Package: ${config.name}

Generated on: ${dateStr}
Workspace Slug: ${slug}

Thank you for partnering with us for your email and signature design deliverables! This package contains production-ready, standalone assets tailored to your brand identity.

---

## 📦 Package Contents

\`\`\`text
delivery/${slug}/
├── templates/               # Standalone, responsive HTML email templates
│   ├── welcome.html
│   └── order-confirmation.html
├── signatures/              # Professional HTML email signature snippets
│   ├── signature.html       # Standalone HTML snippet with inline CSS
│   └── signature.txt        # Clean plain-text copy-ready fallback
├── assets/                  # Brand logos, icons, and template imagery
└── README.md                # Delivery instructions & ESP installation guide
\`\`\`

---

## 📧 Email Templates: How to Import Into Your ESP

The templates in \`templates/\` are compiled into standalone HTML files with inline CSS and responsive media queries. They do not require any development tools or dependencies to use.

### 1. Mailchimp
1. Go to **Campaigns** &rarr; **Email Templates** &rarr; **Create Template**.
2. Select the **Code your own** tab &rarr; choose **Paste in code**.
3. Open the desired template (e.g., \`welcome.html\`) in any text editor, select all, copy, and paste into the Mailchimp editor.
4. Save and start your campaign.

### 2. Klaviyo
1. Navigate to **Content** &rarr; **Email Templates** &rarr; **Create Template**.
2. Choose **Classic editor** &rarr; **Import / Paste HTML**.
3. Copy the compiled HTML from \`templates/\` and paste it into the editor.
4. Preview across Desktop and Mobile tabs.

### 3. HubSpot
1. Navigate to **Marketing** &rarr; **Marketing Email** &rarr; **Create email**.
2. Choose **Custom code** or open Design Manager to create a coded template.
3. Paste the contents of the HTML template file and publish.

### 4. ActiveCampaign
1. Go to **Campaigns** &rarr; **Manage Templates** &rarr; **Create a Template**.
2. Select **Custom HTML** &rarr; paste the compiled HTML and save.

### 5. SendGrid / Marketing Campaigns
1. Go to **Design Library** &rarr; **Create Design** &rarr; **Code Editor**.
2. Paste the full HTML document and save.

---

## ✍️ Email Signature: Installation Guide

The \`signatures/signature.html\` file contains a battle-tested table layout with inline CSS for 100% compatibility across email apps.

### 1. Google Workspace / Gmail
1. Open \`signatures/signature.html\` in Google Chrome or any browser.
2. Select all on screen (\`Ctrl+A\` or \`Cmd+A\`) and copy (\`Ctrl+C\` or \`Cmd+C\`).
3. In Gmail, click the **Gear icon (Settings)** &rarr; **See all settings** &rarr; scroll to **Signature**.
4. Click **Create new**, name your signature, and paste (\`Ctrl+V\` or \`Cmd+V\`) into the rich-text box.
5. Scroll to the bottom and click **Save Changes**.

### 2. Microsoft Outlook (Windows Desktop & Microsoft 365)
1. Open \`signatures/signature.html\` in your browser, select all rendered content, and copy.
2. In Outlook, go to **File** &rarr; **Options** &rarr; **Mail** &rarr; **Signatures**.
3. Click **New**, name it, and paste into the signature editor.
4. Set default signatures for "New messages" and "Replies/forwards" &rarr; click **OK**.

### 3. Apple Mail (macOS)
1. In Apple Mail, go to **Settings** &rarr; **Signatures**.
2. Click the **+** button to create a placeholder signature.
3. Uncheck "Always match my default message font".
4. Copy the rendered signature from your browser and paste it into the signature edit box.

---

## 🌐 Image Hosting Notice

- All template and signature images in this production delivery are referenced via secure HTTPS URLs or packaged in the \`assets/\` directory.
- For signatures, ensure your logo is hosted on a permanent public server or CDN (such as ${config.hosting?.assetBaseUrl || "your company CDN"}). Local file paths will never display to outside email recipients.

---

## 🤝 Support & Revisions
If you need any adjustments to colors, layout, or dynamic ESP tags, please feel free to reach out to:
- **Email:** ${config.company.supportEmail}
- **Website:** ${config.company.website}
`;
}

export async function exportClient(slug: string): Promise<string> {
  const clientDir = getClientDir(slug);
  const configPath = path.join(clientDir, "client.config.json");

  if (!existsSync(configPath)) {
    throw new Error(`Missing client.config.json in ${clientDir}`);
  }

  const rawConfig = await fs.readFile(configPath, "utf-8");
  const config: ClientConfig = JSON.parse(rawConfig);

  // Ensure latest build is created
  logger.info(`Compiling latest assets for export: "${slug}"...`);
  await buildClient(slug);

  const clientDeliveryDir = path.join(DELIVERY_ROOT, slug);
  await ensureDir(clientDeliveryDir);

  // 1. Copy Templates
  const srcTemplates = path.join(clientDir, "dist", "templates");
  const destTemplates = path.join(clientDeliveryDir, "templates");
  const templatesCopied = await copyDirectoryContents(srcTemplates, destTemplates);

  // 2. Copy Signatures
  const srcSig = path.join(clientDir, "dist", "signatures");
  const destSig = path.join(clientDeliveryDir, "signatures");
  const sigCopied = await copyDirectoryContents(srcSig, destSig);

  // 3. Copy Assets
  const srcAssets = path.join(clientDir, "assets");
  const destAssets = path.join(clientDeliveryDir, "assets");
  const assetsCopied = await copyDirectoryContents(srcAssets, destAssets);

  // 4. Generate Client Delivery README
  const readmeContent = generateDeliveryReadme(config, slug);
  const readmeDest = path.join(clientDeliveryDir, "README.md");
  await fs.writeFile(readmeDest, readmeContent, "utf-8");

  logger.info(`Exported to ${clientDeliveryDir}:`);
  logger.info(`  • ${templatesCopied} template file(s)`);
  logger.info(`  • ${sigCopied} signature file(s)`);
  logger.info(`  • ${assetsCopied} asset file(s)`);
  logger.info(`  • 1 customized client README.md`);

  return clientDeliveryDir;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all") || args.includes("-a");
  const specificSlug = args.find((a) => !a.startsWith("-"));

  logger.banner("Client Deliverables Exporter", "Generate clean production delivery packages");

  let slugsToExport: string[] = [];

  if (isAll) {
    slugsToExport = await listClientSlugs();
    if (slugsToExport.length === 0) {
      logger.warn("No client workspaces found to export.");
      return;
    }
  } else if (specificSlug) {
    const val = validateSlug(specificSlug);
    if (!val.valid) {
      logger.error(`Invalid slug: ${val.error}`);
      process.exit(1);
    }
    slugsToExport = [specificSlug];
  } else {
    logger.error("Please specify a client slug or use --all");
    console.log("\nUsage:\n  yarn export <slug>\n  yarn export:all\n");
    process.exit(1);
  }

  for (let i = 0; i < slugsToExport.length; i++) {
    const slug = slugsToExport[i];
    logger.step(i + 1, slugsToExport.length, `Exporting package for "${slug}"`);
    try {
      const outDir = await exportClient(slug);
      logger.success(`Package ready at: ${outDir}`);
    } catch (err) {
      logger.error(`Export failed for "${slug}": ${(err as Error).message}`);
      process.exit(1);
    }
  }

  logger.banner("Export Complete", `Exported packages saved in "delivery/"`);
}

import { fileURLToPath } from "node:url";

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    logger.error(`Fatal export error: ${err.message}`);
    process.exit(1);
  });
}
