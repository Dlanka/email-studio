import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import {
  getClientDir,
  listClientSlugs,
  validateSlug,
  WORKSPACE_ROOT,
} from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";

const DELIVERY_ROOT = path.resolve(WORKSPACE_ROOT, "delivery");

async function cleanClient(slug: string): Promise<void> {
  const clientDir = getClientDir(slug);
  const distDir = path.join(clientDir, "dist");

  if (existsSync(distDir)) {
    const templatesDir = path.join(distDir, "templates");
    const sigDir = path.join(distDir, "signatures");

    // Clean dist/templates
    if (existsSync(templatesDir)) {
      const files = await fs.readdir(templatesDir);
      for (const f of files) {
        if (f !== ".gitkeep") {
          await fs.rm(path.join(templatesDir, f), { force: true, recursive: true });
        }
      }
    }

    // Clean dist/signatures
    if (existsSync(sigDir)) {
      const files = await fs.readdir(sigDir);
      for (const f of files) {
        if (f !== ".gitkeep") {
          await fs.rm(path.join(sigDir, f), { force: true, recursive: true });
        }
      }
    }

    logger.info(`  Cleaned dist for "${slug}"`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const specificSlug = args[0];

  logger.banner("Workspace Cleaner", "Remove compiled outputs & temporary exports");

  if (specificSlug) {
    const val = validateSlug(specificSlug);
    if (!val.valid) {
      logger.error(`Invalid slug: ${val.error}`);
      process.exit(1);
    }
    await cleanClient(specificSlug);
    logger.success(`Cleaned build outputs for "${specificSlug}".`);
  } else {
    // Clean all clients
    const slugs = await listClientSlugs();
    for (const slug of slugs) {
      await cleanClient(slug);
    }

    // Clean delivery directory
    if (existsSync(DELIVERY_ROOT)) {
      await fs.rm(DELIVERY_ROOT, { recursive: true, force: true });
      logger.info("  Cleaned global delivery/ directory");
    }

    logger.success("Cleaned all generated outputs and build directories.");
  }
}

main().catch((err) => {
  logger.error(`Fatal cleaner error: ${err.message}`);
  process.exit(1);
});
