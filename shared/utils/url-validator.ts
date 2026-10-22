const DEFAULT_ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

/**
 * Validates whether a given string is a safe and well-formed URL.
 * Strictly disallows javascript:, data:, file:, and vbscript: protocols.
 */
export function isValidUrl(
  urlStr: unknown,
  allowedProtocols: string[] = DEFAULT_ALLOWED_PROTOCOLS
): { valid: boolean; reason?: string } {
  if (typeof urlStr !== "string" || !urlStr.trim()) {
    return { valid: false, reason: "URL must be a non-empty string." };
  }

  const trimmed = urlStr.trim();

  // Explicitly reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:")
  ) {
    return {
      valid: false,
      reason: `Protocol not allowed in email context: ${trimmed.split(":")[0]}`,
    };
  }

  // Handle mailto: and tel:
  if (trimmed.startsWith("mailto:")) {
    const email = trimmed.replace("mailto:", "").split("?")[0];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: `Malformed email in mailto link: ${email}` };
    }
    return { valid: true };
  }

  if (trimmed.startsWith("tel:")) {
    const phone = trimmed.replace("tel:", "");
    if (!phone || phone.length < 3) {
      return { valid: false, reason: `Malformed phone number in tel link: ${phone}` };
    }
    return { valid: true };
  }

  // Standard web URL
  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return {
        valid: false,
        reason: `Disallowed protocol "${parsed.protocol}". Expected one of: ${allowedProtocols.join(", ")}`,
      };
    }
    if (!parsed.hostname) {
      return { valid: false, reason: "URL is missing a valid hostname." };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: `Invalid URL format: ${(err as Error).message}` };
  }
}

/**
 * Sanitizes URL and throws if unsafe.
 */
export function assertSafeUrl(url: string, context = "link"): string {
  const result = isValidUrl(url);
  if (!result.valid) {
    throw new Error(`Unsafe or invalid URL in ${context}: ${url} (${result.reason})`);
  }
  return url.trim();
}
