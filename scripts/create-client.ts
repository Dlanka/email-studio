import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { TEMPLATE_DIR, validateSlug, getClientDir } from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";
import type { ClientConfig } from "../shared/types.js";

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function formatClientTitle(slug: string): string {
  return slug
    .replace(/^client-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slug = args[0];

  logger.banner("Client Workspace Creator", "Scaffold isolated client environment");

  if (!slug) {
    logger.error("Missing client slug parameter.");
    console.log("\nUsage:\n  yarn client:create <slug>");
    console.log("\nExample:\n  yarn client:create client-acme\n");
    process.exit(1);
  }

  const validation = validateSlug(slug);
  if (!validation.valid) {
    logger.error(`Invalid slug: ${validation.error}`);
    process.exit(1);
  }

  const clientDir = getClientDir(slug);
  if (existsSync(clientDir)) {
    logger.error(`Client directory already exists: ${clientDir}`);
    logger.info("To avoid data loss, existing client workspaces will never be overwritten.");
    process.exit(1);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    logger.error(`Master template directory not found at: ${TEMPLATE_DIR}`);
    process.exit(1);
  }

  logger.info(`Scaffolding new client project: "${slug}"...`);

  // Copy template folder
  await copyDir(TEMPLATE_DIR, clientDir);

  const clientTitle = formatClientTitle(slug);

  // Update client.config.json
  const configPath = path.join(clientDir, "client.config.json");
  if (existsSync(configPath)) {
    const raw = await fs.readFile(configPath, "utf-8");
    const config: ClientConfig = JSON.parse(raw);
    config.name = `${clientTitle} Corp`;
    config.slug = slug;
    config.company.name = `${clientTitle} Technologies`;
    config.company.website = `https://${slug.replace(/^client-/, "")}.example.com`;
    config.company.supportEmail = `support@${slug.replace(/^client-/, "")}.example.com`;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  }

  // Update README.md
  const readmePath = path.join(clientDir, "README.md");
  if (existsSync(readmePath)) {
    let readme = await fs.readFile(readmePath, "utf-8");
    readme = readme.replace(/\{\{CLIENT_NAME\}\}/g, `${clientTitle} Corp`);
    readme = readme.replace(/\{\{CLIENT_SLUG\}\}/g, slug);
    await fs.writeFile(readmePath, readme, "utf-8");
  }

  // Update signature-data.json
  const sigDataPath = path.join(clientDir, "signatures", "signature-data.json");
  if (existsSync(sigDataPath)) {
    const rawSig = await fs.readFile(sigDataPath, "utf-8");
    const sigData = JSON.parse(rawSig);
    sigData.companyName = `${clientTitle} Technologies`;
    sigData.websiteUrl = `https://${slug.replace(/^client-/, "")}.example.com`;
    sigData.websiteLabel = `www.${slug.replace(/^client-/, "")}.example.com`;
    sigData.email = `team@${slug.replace(/^client-/, "")}.example.com`;
    sigData.logoAlt = `${clientTitle} Logo`;
    await fs.writeFile(sigDataPath, JSON.stringify(sigData, null, 2), "utf-8");
  }

  logger.success(`Client workspace created successfully at:\n  ${clientDir}`);
  console.log("\nNext Steps:");
  console.log(`  1. Customize brand colors & assets in: clients/${slug}/brand/ & assets/`);
  console.log(`  2. Edit email templates in: clients/${slug}/templates/`);
  console.log(`  3. Edit email signature in: clients/${slug}/signatures/`);
  console.log(`  4. Compile deliverables:    yarn build ${slug}`);
  console.log(`  5. Validate HTML & assets:  yarn validate ${slug}`);
  console.log(`  6. Preview in browser:      yarn preview ${slug}`);
  console.log(`  7. Export delivery package: yarn export ${slug}\n`);
}

main().catch((err) => {
  logger.error(`Fatal error creating client: ${err.message}`);
  process.exit(1);
});
