import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import mjml2html from "mjml";
import juice from "juice";
import {
  getClientDir,
  listClientSlugs,
  validateSlug,
  ensureDir,
  SHARED_DIR,
} from "../shared/utils/path-utils.js";
import { logger } from "../shared/utils/logger.js";
import { renderTemplate } from "../shared/utils/template-engine.js";
import type { ClientConfig, SignatureData } from "../shared/types.js";

type MjmlCompiler = (
  content: string,
  options?: Record<string, unknown>
) => Promise<{ html: string; errors?: Array<{ line: number; message: string }> }>;
const compileMjml = mjml2html as unknown as MjmlCompiler;

interface BuildResult {
  templatesBuilt: number;
  signatureBuilt: boolean;
  errors: string[];
}

/**
 * Builds all MJML email templates for a single client.
 */
async function buildTemplates(
  clientSlug: string,
  clientDir: string,
  config: ClientConfig
): Promise<number> {
  const templatesSrcDir = path.join(clientDir, "templates");
  const distTemplatesDir = path.join(clientDir, "dist", "templates");

  if (!existsSync(templatesSrcDir)) {
    return 0;
  }

  await ensureDir(distTemplatesDir);
  const templateFolders = await fs.readdir(templatesSrcDir, { withFileTypes: true });
  let count = 0;

  for (const entry of templateFolders) {
    if (!entry.isDirectory()) continue;

    const tplName = entry.name;
    const mjmlFile = path.join(templatesSrcDir, tplName, "email.mjml");

    if (!existsSync(mjmlFile)) {
      continue;
    }

    const mjmlContent = await fs.readFile(mjmlFile, "utf-8");

    const compileResult = await compileMjml(mjmlContent, {
      filePath: mjmlFile,
      validationLevel: "soft",
      minify: config.buildOptions?.minify ?? false,
      beautify: config.buildOptions?.beautify ?? true,
      keepComments: config.buildOptions?.keepComments ?? false,
    });

    if (compileResult.errors && compileResult.errors.length > 0) {
      const errorDetails = compileResult.errors
        .map((e) => `  - [Line ${e.line}] ${e.message}`)
        .join("\n");
      logger.warn(`MJML warnings in "${tplName}/email.mjml":\n${errorDetails}`);
    }

    if (!compileResult.html) {
      throw new Error(`Failed to compile MJML template: ${mjmlFile}`);
    }

    const outputPath = path.join(distTemplatesDir, `${tplName}.html`);
    await fs.writeFile(outputPath, compileResult.html, "utf-8");

    const stats = await fs.stat(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    logger.info(`  • Template: ${tplName}.html (${sizeKb} KB)`);
    count++;
  }

  return count;
}

/**
 * Builds HTML and plain text email signature for a single client.
 */
async function buildSignatures(
  clientSlug: string,
  clientDir: string,
  _config: ClientConfig
): Promise<boolean> {
  const sigSrcDir = path.join(clientDir, "signatures");
  const distSigDir = path.join(clientDir, "dist", "signatures");
  const htmlTemplatePath = path.join(sigSrcDir, "signature.html");
  const dataPath = path.join(sigSrcDir, "signature-data.json");
  const customCssPath = path.join(sigSrcDir, "signature.css");
  const sharedCssPath = path.join(SHARED_DIR, "signatures", "base.css");

  if (!existsSync(htmlTemplatePath) || !existsSync(dataPath)) {
    return false;
  }

  await ensureDir(distSigDir);

  const rawTemplate = await fs.readFile(htmlTemplatePath, "utf-8");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const sigData: SignatureData = JSON.parse(rawData);

  // 1. Substitute variables into signature HTML template (with safe HTML escaping)
  const populatedHtml = renderTemplate(rawTemplate, sigData as unknown as Record<string, unknown>);

  // 2. Load shared CSS + custom client CSS
  let combinedCss = "";
  if (existsSync(sharedCssPath)) {
    combinedCss += (await fs.readFile(sharedCssPath, "utf-8")) + "\n";
  }
  if (existsSync(customCssPath)) {
    combinedCss += (await fs.readFile(customCssPath, "utf-8")) + "\n";
  }

  // 3. Inline CSS onto HTML tables using Juice
  const inlinedHtml = juice.inlineContent(populatedHtml, combinedCss, {
    applyAttributesTableElements: true,
    applyHeightAttributes: true,
    applyWidthAttributes: true,
    removeStyleTags: true,
  });

  // Write standalone copy-ready HTML signature snippet
  const outputHtmlPath = path.join(distSigDir, "signature.html");
  await fs.writeFile(outputHtmlPath, inlinedHtml.trim(), "utf-8");

  // 4. Generate Plain Text Fallback
  const plainText = generatePlainTextSignature(sigData);
  const outputTxtPath = path.join(distSigDir, "signature.txt");
  await fs.writeFile(outputTxtPath, plainText.trim(), "utf-8");

  // 5. Generate Browser Preview Page with Copy Helper
  const previewHtml = generateSignaturePreviewPage(inlinedHtml, sigData, clientSlug);
  const outputPreviewPath = path.join(distSigDir, "signature-preview.html");
  await fs.writeFile(outputPreviewPath, previewHtml, "utf-8");

  const stats = await fs.stat(outputHtmlPath);
  logger.info(`  • Signature: signature.html (${(stats.size / 1024).toFixed(1)} KB)`);
  logger.info(`  • Plain text: signature.txt`);
  logger.info(`  • Preview: signature-preview.html`);

  return true;
}

/**
 * Creates formatted plain-text signature.
 */
function generatePlainTextSignature(data: SignatureData): string {
  const lines: string[] = [
    "--",
    data.fullName,
    data.jobTitle + (data.department ? ` | ${data.department}` : ""),
    data.companyName,
    "",
  ];

  if (data.phone) lines.push(`Phone: ${data.phone}`);
  if (data.mobile) lines.push(`Mobile: ${data.mobile}`);
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.websiteUrl) lines.push(`Website: ${data.websiteUrl}`);
  if (data.address) lines.push(`Address: ${data.address}`);

  if (data.socialLinks && data.socialLinks.length > 0) {
    lines.push("");
    lines.push("Connect:");
    for (const link of data.socialLinks) {
      lines.push(`- ${link.label}: ${link.url}`);
    }
  }

  if (data.disclaimer) {
    lines.push("");
    lines.push(data.disclaimer);
  }

  return lines.join("\n");
}

/**
 * Generates an interactive preview HTML wrapper for the signature.
 */
function generateSignaturePreviewPage(
  signatureSnippet: string,
  data: SignatureData,
  clientSlug: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Signature Preview - ${data.companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .preview-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 680px;
      padding: 30px;
      margin-bottom: 24px;
    }
    .header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }
    .badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .signature-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      background: #ffffff;
      overflow-x: auto;
    }
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 12px;
    }
    .btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .instructions {
      font-size: 13px;
      line-height: 20px;
      color: #64748b;
      margin-top: 20px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .instructions ol {
      padding-left: 20px;
      margin: 8px 0 0 0;
    }
    .alert-success {
      display: none;
      background: #dcfce7;
      color: #166534;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="preview-card">
    <div class="header">
      <div>
        <h1>HTML Email Signature Preview</h1>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Client: ${clientSlug} &bull; ${data.fullName}</div>
      </div>
      <span class="badge">Standalone Output</span>
    </div>

    <!-- Live Signature Render -->
    <div class="signature-box" id="signatureContainer">
${signatureSnippet}
    </div>

    <div class="actions">
      <button class="btn" onclick="copySignatureHtml()">Copy HTML Markup</button>
      <button class="btn" style="background:#475569;" onclick="copyRenderedSignature()">Copy Formatted Signature</button>
    </div>
    <div id="copyAlert" class="alert-success">✓ Copied to clipboard! Ready to paste into your email client settings.</div>

    <div class="instructions">
      <strong>Installation Instructions:</strong>
      <ol>
        <li><strong>Gmail:</strong> Click "Copy Formatted Signature", go to Gmail Settings &rarr; General &rarr; Signature, and paste directly.</li>
        <li><strong>Outlook Desktop / Web:</strong> Go to Settings &rarr; Signatures &rarr; New Signature &rarr; Paste.</li>
        <li><strong>Apple Mail:</strong> Create a dummy signature, replace with this HTML snippet.</li>
      </ol>
    </div>
  </div>

  <script>
    const rawHtml = ${JSON.stringify(signatureSnippet)};

    function showToast(msg) {
      const alert = document.getElementById('copyAlert');
      alert.textContent = msg;
      alert.style.display = 'block';
      setTimeout(() => { alert.style.display = 'none'; }, 3000);
    }

    function copySignatureHtml() {
      navigator.clipboard.writeText(rawHtml).then(() => {
        showToast('✓ Raw HTML copied to clipboard!');
      });
    }

    function copyRenderedSignature() {
      const container = document.getElementById('signatureContainer');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(container);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      showToast('✓ Formatted signature copied! Paste directly into Gmail/Outlook.');
    }
  </script>
</body>
</html>`;
}

/**
 * Builds a single client project.
 */
export async function buildClient(slug: string): Promise<BuildResult> {
  const clientDir = getClientDir(slug);
  const configPath = path.join(clientDir, "client.config.json");

  if (!existsSync(configPath)) {
    throw new Error(`Missing client.config.json in ${clientDir}`);
  }

  const rawConfig = await fs.readFile(configPath, "utf-8");
  const config: ClientConfig = JSON.parse(rawConfig);

  logger.info(`Building client: "${config.name}" (${slug})...`);

  // 1. Build MJML Templates
  const templatesCount = await buildTemplates(slug, clientDir, config);

  // 2. Build HTML Signatures
  const signatureBuilt = await buildSignatures(slug, clientDir, config);

  return {
    templatesBuilt: templatesCount,
    signatureBuilt,
    errors: [],
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all") || args.includes("-a");
  const specificSlug = args.find((a) => !a.startsWith("-"));

  logger.banner("Email Workspace Compiler", "Compile MJML templates & HTML signatures");

  let slugsToBuild: string[] = [];

  if (isAll) {
    slugsToBuild = await listClientSlugs();
    if (slugsToBuild.length === 0) {
      logger.warn("No client workspaces found to build.");
      return;
    }
  } else if (specificSlug) {
    const val = validateSlug(specificSlug);
    if (!val.valid) {
      logger.error(`Invalid slug: ${val.error}`);
      process.exit(1);
    }
    slugsToBuild = [specificSlug];
  } else {
    logger.error("Please specify a client slug or use --all");
    console.log("\nUsage:\n  yarn build <slug>\n  yarn build:all\n");
    process.exit(1);
  }

  let totalTemplates = 0;
  let totalSignatures = 0;

  for (let i = 0; i < slugsToBuild.length; i++) {
    const slug = slugsToBuild[i];
    logger.step(i + 1, slugsToBuild.length, `Compiling client "${slug}"`);

    try {
      const result = await buildClient(slug);
      totalTemplates += result.templatesBuilt;
      if (result.signatureBuilt) totalSignatures++;
      logger.success(`Successfully built "${slug}".`);
    } catch (err) {
      logger.error(`Build failed for "${slug}": ${(err as Error).message}`);
      process.exit(1);
    }
  }

  logger.banner(
    "Build Complete",
    `Compiled ${totalTemplates} template(s) and ${totalSignatures} signature(s) across ${slugsToBuild.length} client(s).`
  );
}

import { fileURLToPath } from "node:url";

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    logger.error(`Fatal build error: ${err.message}`);
    process.exit(1);
  });
}
