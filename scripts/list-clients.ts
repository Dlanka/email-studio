import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { listClientSlugs, getClientDir } from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";
import type { ClientConfig } from "../shared/types.js";

async function main(): Promise<void> {
  logger.banner("Client Workspaces Directory", "Active client projects");

  const slugs = await listClientSlugs();

  if (slugs.length === 0) {
    logger.info("No client workspaces found yet.");
    console.log("Create your first client workspace using:\n  yarn client:create <slug>\n");
    return;
  }

  const tableData: Array<{
    Slug: string;
    "Client Name": string;
    Templates: string;
    Signature: string;
    "Build Status": string;
  }> = [];

  for (const slug of slugs) {
    const clientDir = getClientDir(slug);
    const configPath = path.join(clientDir, "client.config.json");
    let clientName = slug;
    let templateCount = 0;
    let buildStatus = "Not built";

    if (existsSync(configPath)) {
      try {
        const raw = await fs.readFile(configPath, "utf-8");
        const config: ClientConfig = JSON.parse(raw);
        clientName = config.name || slug;
      } catch {
        clientName = `${slug} (invalid config)`;
      }
    }

    // Check templates directory
    const templatesDir = path.join(clientDir, "templates");
    if (existsSync(templatesDir)) {
      const templateDirs = await fs.readdir(templatesDir, { withFileTypes: true });
      templateCount = templateDirs.filter((d) => d.isDirectory()).length;
    }

    // Check signature
    const sigPath = path.join(clientDir, "signatures", "signature.html");
    const hasSignature = existsSync(sigPath);

    // Check build dist
    const distTemplates = path.join(clientDir, "dist", "templates");
    const distSigs = path.join(clientDir, "dist", "signatures");
    let builtTemplates = 0;
    let builtSig = false;

    if (existsSync(distTemplates)) {
      const files = await fs.readdir(distTemplates);
      builtTemplates = files.filter((f) => f.endsWith(".html")).length;
    }

    if (existsSync(distSigs)) {
      builtSig = existsSync(path.join(distSigs, "signature.html"));
    }

    if (builtTemplates > 0 || builtSig) {
      buildStatus = `Built (${builtTemplates} tpl, ${builtSig ? "sig" : "no sig"})`;
    }

    tableData.push({
      Slug: slug,
      "Client Name": clientName,
      Templates: `${templateCount} templates`,
      Signature: hasSignature ? "Yes" : "None",
      "Build Status": buildStatus,
    });
  }

  logger.table(tableData);
  console.log(`\nTotal Clients: ${slugs.length}\n`);
}

main().catch((err) => {
  logger.error(`Error listing clients: ${err.message}`);
  process.exit(1);
});
