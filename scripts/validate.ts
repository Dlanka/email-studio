import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import mjml2html from "mjml";
import { getClientDir, listClientSlugs, validateSlug } from "../shared/utils/path-utils.js";
import { isValidUrl } from "../shared/utils/url-validator.js";
import { logger } from "../shared/utils/logger.js";
import type {
  ClientConfig,
  SignatureData,
  ValidationResult,
  ValidationIssue,
} from "../shared/types.js";

type MjmlCompiler = (
  content: string,
  options?: Record<string, unknown>
) => Promise<{ html: string; errors?: Array<{ line: number; message: string }> }>;
const compileMjml = mjml2html as unknown as MjmlCompiler;

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
const GMAIL_CLIPPING_LIMIT_BYTES = 102 * 1024; // 102 KB limit

export async function validateClient(slug: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const metrics = {
    templatesChecked: 0,
    signaturesChecked: 0,
    assetsChecked: 0,
    htmlSizeWarnings: 0,
  };

  const clientDir = getClientDir(slug);

  // 1. Check client.config.json
  const configPath = path.join(clientDir, "client.config.json");
  let config: ClientConfig | null = null;

  if (!existsSync(configPath)) {
    issues.push({
      type: "error",
      code: "MISSING_CONFIG",
      message: `client.config.json not found in ${clientDir}`,
      file: configPath,
    });
  } else {
    try {
      const raw = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(raw);
    } catch (err) {
      issues.push({
        type: "error",
        code: "INVALID_CONFIG_JSON",
        message: `client.config.json is not valid JSON: ${(err as Error).message}`,
        file: configPath,
      });
    }
  }

  if (config) {
    if (config.slug !== slug) {
      issues.push({
        type: "error",
        code: "SLUG_MISMATCH",
        message: `Config slug "${config.slug}" does not match folder directory "${slug}".`,
        file: configPath,
      });
    }

    if (!config.name || config.name.trim() === "") {
      issues.push({
        type: "error",
        code: "EMPTY_CLIENT_NAME",
        message: "Client name cannot be empty in client.config.json.",
        file: configPath,
      });
    }

    // Validate brand colors
    if (config.brand?.colors) {
      for (const [colorKey, colorVal] of Object.entries(config.brand.colors)) {
        if (!HEX_COLOR_REGEX.test(colorVal)) {
          issues.push({
            type: "warning",
            code: "INVALID_COLOR_HEX",
            message: `Brand color "${colorKey}" has non-standard hex value: "${colorVal}"`,
            file: configPath,
          });
        }
      }
    } else {
      issues.push({
        type: "warning",
        code: "MISSING_BRAND_COLORS",
        message: "No brand.colors defined in client.config.json",
        file: configPath,
      });
    }

    // Validate logo asset path
    if (config.brand?.logo?.path) {
      const logoLocalPath = path.resolve(clientDir, config.brand.logo.path);
      if (!existsSync(logoLocalPath)) {
        issues.push({
          type: "warning",
          code: "MISSING_LOCAL_LOGO",
          message: `Local logo file does not exist at: ${config.brand.logo.path}`,
          file: configPath,
        });
      } else {
        metrics.assetsChecked++;
      }
    }

    // Validate company website URL
    if (config.company?.website) {
      const urlCheck = isValidUrl(config.company.website);
      if (!urlCheck.valid) {
        issues.push({
          type: "error",
          code: "INVALID_COMPANY_URL",
          message: `Invalid company website URL "${config.company.website}": ${urlCheck.reason}`,
          file: configPath,
        });
      }
    }

    // Validate support email
    if (config.company?.supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.company.supportEmail)) {
        issues.push({
          type: "error",
          code: "INVALID_SUPPORT_EMAIL",
          message: `Invalid support email address "${config.company.supportEmail}".`,
          file: configPath,
        });
      }
    }
  }

  // 2. Validate MJML Templates
  const templatesDir = path.join(clientDir, "templates");
  if (existsSync(templatesDir)) {
    const templateFolders = await fs.readdir(templatesDir, { withFileTypes: true });

    for (const entry of templateFolders) {
      if (!entry.isDirectory()) continue;
      const tplName = entry.name;
      const mjmlPath = path.join(templatesDir, tplName, "email.mjml");

      if (!existsSync(mjmlPath)) {
        issues.push({
          type: "warning",
          code: "MISSING_TEMPLATE_MJML",
          message: `Directory "templates/${tplName}" has no email.mjml file.`,
          file: mjmlPath,
        });
        continue;
      }

      metrics.templatesChecked++;
      const mjmlContent = await fs.readFile(mjmlPath, "utf-8");

      // Check image alt attributes
      const imgRegex = /<mj-image\s+([^>]*?)>/g;
      let imgMatch: RegExpExecArray | null;
      while ((imgMatch = imgRegex.exec(mjmlContent)) !== null) {
        const attrs = imgMatch[1];
        if (!attrs.includes("alt=") || /alt=["']\s*["']/.test(attrs)) {
          issues.push({
            type: "warning",
            code: "MISSING_IMAGE_ALT",
            message: `Template "${tplName}" contains <mj-image> missing or empty alt attribute.`,
            file: mjmlPath,
          });
        }
      }

      // MJML compilation dry-run
      try {
        const compile = await compileMjml(mjmlContent, {
          filePath: mjmlPath,
          validationLevel: "strict",
        });

        if (compile.errors && compile.errors.length > 0) {
          for (const err of compile.errors) {
            issues.push({
              type: "warning",
              code: "MJML_SYNTAX_WARNING",
              message: `[Line ${err.line}] ${err.message}`,
              file: mjmlPath,
              line: err.line,
            });
          }
        }

        // Check HTML output byte size against Gmail's 102KB limit
        if (compile.html) {
          const byteLength = Buffer.byteLength(compile.html, "utf-8");
          if (byteLength > GMAIL_CLIPPING_LIMIT_BYTES) {
            metrics.htmlSizeWarnings++;
            issues.push({
              type: "warning",
              code: "GMAIL_CLIPPING_RISK",
              message: `Compiled HTML size (${(byteLength / 1024).toFixed(1)} KB) exceeds 102 KB. Gmail may clip this email!`,
              file: mjmlPath,
            });
          }
        }
      } catch (compileErr) {
        issues.push({
          type: "error",
          code: "MJML_COMPILE_FAIL",
          message: `Fatal compile error in "${tplName}": ${(compileErr as Error).message}`,
          file: mjmlPath,
        });
      }
    }
  }

  // 3. Validate HTML Email Signatures
  const sigDir = path.join(clientDir, "signatures");
  const sigHtmlPath = path.join(sigDir, "signature.html");
  const sigDataPath = path.join(sigDir, "signature-data.json");

  if (existsSync(sigHtmlPath) && existsSync(sigDataPath)) {
    metrics.signaturesChecked++;
    try {
      const rawData = await fs.readFile(sigDataPath, "utf-8");
      const sigData: SignatureData = JSON.parse(rawData);

      // Validate required signature fields
      if (!sigData.fullName?.trim()) {
        issues.push({
          type: "error",
          code: "MISSING_SIG_FULLNAME",
          message: "Signature data missing fullName.",
          file: sigDataPath,
        });
      }

      if (!sigData.jobTitle?.trim()) {
        issues.push({
          type: "warning",
          code: "MISSING_SIG_JOBTITLE",
          message: "Signature data missing jobTitle.",
          file: sigDataPath,
        });
      }

      if (!sigData.companyName?.trim()) {
        issues.push({
          type: "error",
          code: "MISSING_SIG_COMPANY",
          message: "Signature data missing companyName.",
          file: sigDataPath,
        });
      }

      // Check email
      if (sigData.email) {
        const emailCheck = isValidUrl(`mailto:${sigData.email}`);
        if (!emailCheck.valid) {
          issues.push({
            type: "error",
            code: "INVALID_SIG_EMAIL",
            message: `Signature email "${sigData.email}" is invalid.`,
            file: sigDataPath,
          });
        }
      }

      // Check website URL
      if (sigData.websiteUrl) {
        const urlCheck = isValidUrl(sigData.websiteUrl);
        if (!urlCheck.valid) {
          issues.push({
            type: "error",
            code: "INVALID_SIG_WEBSITE",
            message: `Signature websiteUrl "${sigData.websiteUrl}": ${urlCheck.reason}`,
            file: sigDataPath,
          });
        }
      }

      // Check logo URL
      if (sigData.logoUrl) {
        const logoUrlCheck = isValidUrl(sigData.logoUrl);
        if (!logoUrlCheck.valid) {
          issues.push({
            type: "error",
            code: "INVALID_SIG_LOGO_URL",
            message: `Signature logoUrl "${sigData.logoUrl}": ${logoUrlCheck.reason}`,
            file: sigDataPath,
          });
        }
      }

      // Check social links
      if (sigData.socialLinks) {
        for (const link of sigData.socialLinks) {
          const check = isValidUrl(link.url);
          if (!check.valid) {
            issues.push({
              type: "error",
              code: "INVALID_SIG_SOCIAL_URL",
              message: `Social link "${link.label}" (${link.url}): ${check.reason}`,
              file: sigDataPath,
            });
          }
        }
      }

      // Check signature HTML markup rules
      const sigHtml = await fs.readFile(sigHtmlPath, "utf-8");

      // Check for forbidden techniques: CSS Grid, Flexbox, <script> tags
      if (/<script\b/i.test(sigHtml)) {
        issues.push({
          type: "error",
          code: "FORBIDDEN_SCRIPT_TAG",
          message: "Email signatures must not contain <script> tags.",
          file: sigHtmlPath,
        });
      }

      if (/display:\s*flex|display:\s*grid/i.test(sigHtml)) {
        issues.push({
          type: "error",
          code: "FORBIDDEN_FLEX_OR_GRID",
          message:
            "Email signatures must use table layouts; display:flex/grid is incompatible with major email clients.",
          file: sigHtmlPath,
        });
      }

      // Check table reset attributes
      if (
        /<table(?![^>]*cellpadding)/i.test(sigHtml) ||
        /<table(?![^>]*cellspacing)/i.test(sigHtml)
      ) {
        issues.push({
          type: "warning",
          code: "MISSING_TABLE_ATTRIBUTES",
          message:
            'Table elements should explicitly include cellpadding="0" cellspacing="0" border="0".',
          file: sigHtmlPath,
        });
      }
    } catch (sigErr) {
      issues.push({
        type: "error",
        code: "INVALID_SIG_DATA",
        message: `Failed to parse signature-data.json: ${(sigErr as Error).message}`,
        file: sigDataPath,
      });
    }
  }

  // 4. Client Isolation Check: Ensure dist doesn't contain files or absolute paths from other clients
  const distDir = path.join(clientDir, "dist");
  if (existsSync(distDir)) {
    const otherSlugs = (await listClientSlugs()).filter((s) => s !== slug);
    async function scanDistFiles(dir: string): Promise<void> {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          await scanDistFiles(full);
        } else if (item.name.endsWith(".html") || item.name.endsWith(".txt")) {
          const content = await fs.readFile(full, "utf-8");
          for (const otherSlug of otherSlugs) {
            if (
              content.includes(`clients/${otherSlug}`) ||
              content.includes(`clients\\${otherSlug}`)
            ) {
              issues.push({
                type: "error",
                code: "CROSS_CLIENT_LEAK",
                message: `Output file "${path.relative(clientDir, full)}" references another client directory: ${otherSlug}`,
                file: full,
              });
            }
          }
        }
      }
    }
    await scanDistFiles(distDir);
  }

  const errors = issues.filter((i) => i.type === "error");
  return {
    clientSlug: slug,
    valid: errors.length === 0,
    issues,
    metrics,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all") || args.includes("-a");
  const specificSlug = args.find((a) => !a.startsWith("-"));

  logger.banner(
    "Workspace Validator & Compatibility Checker",
    "Automated code, asset & layout linting"
  );

  let slugsToValidate: string[] = [];

  if (isAll) {
    slugsToValidate = await listClientSlugs();
    if (slugsToValidate.length === 0) {
      logger.warn("No client workspaces found to validate.");
      return;
    }
  } else if (specificSlug) {
    const val = validateSlug(specificSlug);
    if (!val.valid) {
      logger.error(`Invalid slug: ${val.error}`);
      process.exit(1);
    }
    slugsToValidate = [specificSlug];
  } else {
    logger.error("Please specify a client slug or use --all");
    console.log("\nUsage:\n  yarn validate <slug>\n  yarn validate:all\n");
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const slug of slugsToValidate) {
    logger.info(`Validating client workspace: "${slug}"...`);
    const result = await validateClient(slug);

    for (const issue of result.issues) {
      const loc = issue.file
        ? ` (${path.basename(issue.file)}${issue.line ? `:${issue.line}` : ""})`
        : "";
      if (issue.type === "error") {
        totalErrors++;
        logger.error(`  [${issue.code}] ${issue.message}${loc}`);
      } else {
        totalWarnings++;
        logger.warn(`  [${issue.code}] ${issue.message}${loc}`);
      }
    }

    if (result.valid) {
      logger.success(
        `✓ "${slug}" passed validation (${result.metrics.templatesChecked} templates, ${result.metrics.signaturesChecked} signatures checked)`
      );
    } else {
      logger.error(
        `✖ "${slug}" failed validation with ${result.issues.filter((i) => i.type === "error").length} error(s).`
      );
    }
  }

  console.log(`\nValidation Summary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

  if (totalErrors > 0) {
    logger.error("Validation failed. Please resolve all errors before deploying.");
    process.exit(1);
  } else {
    logger.success("All client workspaces validated successfully!");
  }
}

import { fileURLToPath } from "node:url";

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    logger.error(`Fatal validation error: ${err.message}`);
    process.exit(1);
  });
}
