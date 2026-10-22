import { escapeHtml, escapeAttr } from "./escape.js";

/**
 * Lightweight, safe template rendering engine for signatures and simple text templates.
 * Supports:
 * - Simple substitutions: {{key}} (escaped by default)
 * - Safe attributes: {{attr key}}
 * - Conditional blocks: {{#if key}}...{{/if}}
 * - Conditional negation: {{#unless key}}...{{/unless}}
 * - Repeated blocks: {{#each arrayKey}}...{{/each}}
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let output = template;

  // 1. Process conditionals: {{#if key}}...{{/if}}
  const ifRegex = /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  output = output.replace(ifRegex, (_, prop, innerContent) => {
    const val = getNestedValue(data, prop);
    const isTruthy = Array.isArray(val) ? val.length > 0 : Boolean(val);
    return isTruthy ? innerContent : "";
  });

  // 2. Process unless: {{#unless key}}...{{/unless}}
  const unlessRegex = /\{\{#unless\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
  output = output.replace(unlessRegex, (_, prop, innerContent) => {
    const val = getNestedValue(data, prop);
    const isFalsy = Array.isArray(val) ? val.length === 0 : !val;
    return isFalsy ? innerContent : "";
  });

  // 3. Process each: {{#each listKey}}...{{/each}}
  const eachRegex = /\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(eachRegex, (_, prop, innerContent) => {
    const list = getNestedValue(data, prop);
    if (!Array.isArray(list) || list.length === 0) {
      return "";
    }
    return list
      .map((item, index) => {
        const itemContext =
          typeof item === "object" && item !== null
            ? { ...item, "@index": index }
            : { this: item, "@index": index };
        return renderTemplate(innerContent, itemContext);
      })
      .join("");
  });

  // 4. Process attribute escapes: {{attr key}}
  const attrRegex = /\{\{attr\s+([a-zA-Z0-9_.]+)\}\}/g;
  output = output.replace(attrRegex, (_, prop) => {
    const val = getNestedValue(data, prop);
    return escapeAttr(val ?? "");
  });

  // 5. Process standard variables: {{key}}
  const varRegex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
  output = output.replace(varRegex, (_, prop) => {
    const val = getNestedValue(data, prop);
    return escapeHtml(val ?? "");
  });

  return output;
}

function getNestedValue(obj: Record<string, unknown>, pathStr: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = pathStr.split(".");
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== "object") return undefined;
    curr = (curr as Record<string, unknown>)[part];
  }
  return curr;
}
