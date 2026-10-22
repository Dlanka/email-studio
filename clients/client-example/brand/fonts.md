# Font Stack Specifications

Email clients have notoriously inconsistent support for web fonts. Therefore, this project uses battle-tested system font fallbacks.

## Recommended Stack

- **Primary Body**: `Arial, Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings**: `Arial, Helvetica, sans-serif`
- **Editorial / Serif Fallback**: `Georgia, 'Times New Roman', serif`
- **Monospace / Code**: `'Courier New', Courier, monospace`

## Outlook MSO Notice

Outlook for Windows uses Word's rendering engine and will default to Times New Roman if a custom font is declared without explicit MSO font-family declarations or safe web fonts.
