const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes unsafe HTML characters to prevent XSS and broken email client layout.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) {
    return "";
  }
  return String(str).replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_LOOKUP[char] || char);
}

/**
 * Escapes characters safe for HTML attribute values.
 */
export function escapeAttr(str: unknown): string {
  return escapeHtml(str);
}
