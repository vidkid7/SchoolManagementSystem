declare module 'sanitize-html' {
  interface SanitizeHtmlOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
  }

  function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string;
  export = sanitizeHtml;
}
