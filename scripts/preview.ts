import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { existsSync, createReadStream } from "node:fs";
import {
  WORKSPACE_ROOT,
  listClientSlugs,
  validateSlug,
  getClientDir,
} from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";
import { buildClient } from "./build.js";
import type { ClientConfig } from "../shared/types.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

interface DeliverableItem {
  label: string;
  type: "template" | "signature";
  path: string;
  size: string;
}

interface ClientManifest {
  name: string;
  slug: string;
  items: DeliverableItem[];
}

/**
 * Scans all clients to build the preview manifest of compiled deliverables.
 */
async function buildManifest(): Promise<Record<string, ClientManifest>> {
  const slugs = await listClientSlugs();
  const manifest: Record<string, ClientManifest> = {};

  for (const slug of slugs) {
    const clientDir = getClientDir(slug);
    const configPath = path.join(clientDir, "client.config.json");
    let name = slug;

    if (existsSync(configPath)) {
      try {
        const raw = await fs.readFile(configPath, "utf-8");
        const conf: ClientConfig = JSON.parse(raw);
        name = conf.name || slug;
      } catch {
        // ignore
      }
    }

    const items: DeliverableItem[] = [];

    // Scan templates
    const templatesDir = path.join(clientDir, "dist", "templates");
    if (existsSync(templatesDir)) {
      const files = await fs.readdir(templatesDir);
      for (const file of files) {
        if (file.endsWith(".html")) {
          const stats = await fs.stat(path.join(templatesDir, file));
          items.push({
            label: `Template: ${file.replace(".html", "")}`,
            type: "template",
            path: `/clients/${slug}/dist/templates/${file}`,
            size: `${(stats.size / 1024).toFixed(1)} KB`,
          });
        }
      }
    }

    // Scan signatures
    const sigDir = path.join(clientDir, "dist", "signatures");
    if (existsSync(sigDir)) {
      const previewFile = path.join(sigDir, "signature-preview.html");
      const snippetFile = path.join(sigDir, "signature.html");
      if (existsSync(previewFile)) {
        const stats = await fs.stat(previewFile);
        items.push({
          label: "Signature: Preview & Copy Tool",
          type: "signature",
          path: `/clients/${slug}/dist/signatures/signature-preview.html`,
          size: `${(stats.size / 1024).toFixed(1)} KB`,
        });
      }
      if (existsSync(snippetFile)) {
        const stats = await fs.stat(snippetFile);
        items.push({
          label: "Signature: Raw HTML Snippet",
          type: "signature",
          path: `/clients/${slug}/dist/signatures/signature.html`,
          size: `${(stats.size / 1024).toFixed(1)} KB`,
        });
      }
    }

    manifest[slug] = {
      name,
      slug,
      items,
    };
  }

  return manifest;
}

async function startServer(initialSlug?: string): Promise<void> {
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || "/", `http://localhost:${PORT}`);
      const pathname = decodeURIComponent(parsedUrl.pathname);

      // API: Preview Manifest
      if (pathname === "/api/manifest") {
        const manifest = await buildManifest();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(manifest, null, 2));
        return;
      }

      // Root: Serve previews/index.html
      if (pathname === "/" || pathname === "/index.html") {
        const indexPath = path.join(WORKSPACE_ROOT, "previews", "index.html");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        createReadStream(indexPath).pipe(res);
        return;
      }

      // Static files: safe resolution inside WORKSPACE_ROOT
      const safePath = path.resolve(WORKSPACE_ROOT, pathname.replace(/^\//, ""));
      const relative = path.relative(WORKSPACE_ROOT, safePath);

      // Traversal protection
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
      }

      if (existsSync(safePath)) {
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        createReadStream(safePath).pipe(res);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not Found: ${pathname}`);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Server Error: ${(err as Error).message}`);
    }
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}${initialSlug ? `?client=${initialSlug}` : ""}`;
    logger.banner("Email Preview Server Running", `Dashboard URL: ${url}`);
    logger.info("Features:");
    logger.info("  • Client and template switcher");
    logger.info("  • Desktop (650px), Mobile (375px), and Fluid viewports");
    logger.info("  • Live HTML size & Gmail 102KB clipping check");
    logger.info("  • One-click copy HTML button");
    logger.info("\nPress Ctrl+C in your terminal to stop the preview server.");
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const specificSlug = args.find((a) => !a.startsWith("-"));

  logger.banner("Email Preview Studio", "Live browser workspace preview");

  if (specificSlug) {
    const val = validateSlug(specificSlug);
    if (!val.valid) {
      logger.error(`Invalid slug: ${val.error}`);
      process.exit(1);
    }
    // Build specific client to ensure fresh preview
    logger.info(`Building "${specificSlug}" prior to preview...`);
    await buildClient(specificSlug);
  } else {
    // Build all if no dist exists
    const slugs = await listClientSlugs();
    for (const slug of slugs) {
      const clientDir = getClientDir(slug);
      const distDir = path.join(clientDir, "dist");
      if (!existsSync(distDir)) {
        logger.info(`Building "${slug}" for preview...`);
        await buildClient(slug);
      }
    }
  }

  await startServer(specificSlug);
}

main().catch((err) => {
  logger.error(`Fatal preview error: ${err.message}`);
  process.exit(1);
});
