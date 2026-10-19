export const extractTemplateVariables = (html: string): string[] => Array.from(
  new Set(Array.from(html.matchAll(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi), match => match[1])),
);
