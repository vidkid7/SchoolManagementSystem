import en from '../locales/en/translation.json';
import ne from '../locales/ne/translation.json';

function flattenKeys(value: unknown, prefix = '', keys: string[] = []): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) keys.push(prefix);
    return keys;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenKeys(child, nextPrefix, keys);
  }

  return keys;
}

describe('locale key parity', () => {
  it('provides English and Nepali text for the same translation keys', () => {
    const englishKeys = new Set(flattenKeys(en));
    const nepaliKeys = new Set(flattenKeys(ne));

    expect([...nepaliKeys].filter((key) => !englishKeys.has(key))).toEqual([]);
    expect([...englishKeys].filter((key) => !nepaliKeys.has(key))).toEqual([]);
  });

  it('labels total examination marks in both locales', () => {
    expect(en.reports.totalMarks).toBe('Total Marks');
    expect(ne.reports.totalMarks).toBe('कुल अंक');
  });
});
