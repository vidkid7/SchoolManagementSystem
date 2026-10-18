import { extractStudentSections } from './studentListUtils';

describe('extractStudentSections', () => {
  it('uses distinct, non-empty section names from academic class rows', () => {
    expect(extractStudentSections([
      { section: 'K' },
      { section: 'A' },
      { section: 'K' },
      { section: '  B  ' },
      { section: '' },
      { section: null },
      null,
    ])).toEqual(['A', 'B', 'K']);
  });

  it('returns an empty list when the response is not an array', () => {
    expect(extractStudentSections({ data: [{ section: 'K' }] })).toEqual([]);
    expect(extractStudentSections(null)).toEqual([]);
  });
});
