import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

export const WORKSPACE_ROOT = path.resolve(process.cwd());
export const CLIENTS_DIR = path.resolve(WORKSPACE_ROOT, "clients");
export const TEMPLATE_DIR = path.resolve(CLIENTS_DIR, "_template");
export const SHARED_DIR = path.resolve(WORKSPACE_ROOT, "shared");

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates a client slug format and prevents directory traversal attacks.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== "string") {
    return { valid: false, error: "Client slug cannot be empty." };
  }

  const trimmed = slug.trim();

  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, error: "Client slug must be between 2 and 50 characters long." };
  }

  if (trimmed === "_template") {
    return { valid: false, error: "'_template' is a reserved workspace directory." };
  }

  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    return { valid: false, error: "Client slug contains invalid directory path characters." };
  }

  if (!SLUG_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "Slug must contain only lowercase letters, numbers, and single hyphens (e.g. 'client-acme').",
    };
  }

  return { valid: true };
}

/**
 * Resolves the client directory safely within the workspace.
 */
export function getClientDir(slug: string): string {
  const validation = validateSlug(slug);
  if (!validation.valid && slug !== "_template") {
    throw new Error(`Invalid slug "${slug}": ${validation.error}`);
  }

  const resolved = path.resolve(CLIENTS_DIR, slug);

  // Security check: Ensure resolved path stays strictly inside CLIENTS_DIR
  const relative = path.relative(CLIENTS_DIR, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path traversal violation detected for slug "${slug}".`);
  }

  return resolved;
}

/**
 * Lists all existing client slugs (excluding _template and non-directories).
 */
export async function listClientSlugs(): Promise<string[]> {
  if (!existsSync(CLIENTS_DIR)) {
    return [];
  }

  const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
  const slugs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "_template") {
      slugs.push(entry.name);
    }
  }

  return slugs.sort();
}

/**
 * Ensures a directory exists, creating parents if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
