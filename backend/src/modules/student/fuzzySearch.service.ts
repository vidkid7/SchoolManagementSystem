import Fuse from 'fuse.js';
import { distance } from 'fastest-levenshtein';
import Student, { StudentStatus } from '@models/Student.model';
import StudentRepository from './student.repository';
import { logger } from '@utils/logger';

/**
 * Fuzzy Search Result
 */
export interface FuzzySearchResult {
  student: Student;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'phonetic';
  matchedField: string;
}

/**
 * Fuzzy Search Service
 * Implements advanced search algorithms for student name matching
 * Handles typos, phonetic similarities, and partial matches
 */
class FuzzySearchService {
  /**
   * Perform fuzzy search on students
   * @param query - Search query
   * @param threshold - Similarity threshold (0-1, default 0.4)
   * @param limit - Maximum results to return
   * @returns Array of fuzzy search results with scores
   */
  async searchStudents(
    query: string,
    threshold: number = 0.4,
    limit: number = 50
  ): Promise<FuzzySearchResult[]> {
    try {
      // Fetch all active students (consider caching this)
      const { students } = await StudentRepository.findAll(
        { status: StudentStatus.ACTIVE },
        { limit: 10000, offset: 0 }
      );

      // Configure Fuse.js for fuzzy matching
      const fuse = new Fuse(students, {
        keys: [
          { name: 'firstNameEn', weight: 0.3 },
          { name: 'lastNameEn', weight: 0.3 },
          { name: 'middleNameEn', weight: 0.1 },
          { name: 'firstNameNp', weight: 0.15 },
          { name: 'lastNameNp', weight: 0.15 },
          { name: 'studentCode', weight: 0.2 },
          { name: 'email', weight: 0.1 },
          { name: 'phone', weight: 0.1 }
        ],
        threshold,
        includeScore: true,
        useExtendedSearch: true,
        ignoreLocation: true,
        minMatchCharLength: 2
      });

      // Perform fuzzy search
      const fuseResults = fuse.search(query);

      // Map results to our format
      const results: FuzzySearchResult[] = fuseResults.map(result => ({
        student: result.item,
        score: 1 - (result.score || 0), // Convert to similarity score
        matchType: this.determineMatchType(query, result.item, result.score || 0),
        matchedField: this.findMatchedField(query, result.item)
      }));

      // Sort by score (highest first) and limit
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error in fuzzy search', { error, query });
      throw error;
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Distance (lower is more similar)
   */
  calculateLevenshteinDistance(str1: string, str2: string): number {
    return distance(str1.toLowerCase(), str2.toLowerCase());
  }

  /**
   * Calculate similarity score (0-1) between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (1 = identical, 0 = completely different)
   */
  calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const dist = this.calculateLevenshteinDistance(str1, str2);
    return 1 - (dist / maxLength);
  }

  /**
   * Determine match type based on score
   * @param query - Search query
   * @param student - Student record
   * @param fuseScore - Fuse.js score (0 = perfect match, 1 = no match)
   * @returns Match type
   */
  private determineMatchType(
    query: string,
    student: Student,
    fuseScore: number
  ): 'exact' | 'fuzzy' | 'phonetic' {
    const queryLower = query.toLowerCase();
    
    // Check for exact match
    const exactFields = [
      student.firstNameEn?.toLowerCase(),
      student.lastNameEn?.toLowerCase(),
      student.studentCode?.toLowerCase(),
      student.email?.toLowerCase()
    ];

    if (exactFields.some(field => field === queryLower)) {
      return 'exact';
    }

    // Check for substring match (considered exact)
    if (exactFields.some(field => field?.includes(queryLower))) {
      return 'exact';
    }

    // Fuzzy match based on score
    if (fuseScore < 0.3) {
      return 'fuzzy';
    }

    return 'phonetic';
  }

  /**
   * Find which field matched the query
   * @param query - Search query
   * @param student - Student record
   * @returns Matched field name
   */
  private findMatchedField(query: string, student: Student): string {
    const queryLower = query.toLowerCase();
    
    const fields = [
      { name: 'firstNameEn', value: student.firstNameEn },
      { name: 'lastNameEn', value: student.lastNameEn },
      { name: 'middleNameEn', value: student.middleNameEn },
      { name: 'studentCode', value: student.studentCode },
      { name: 'email', value: student.email },
      { name: 'phone', value: student.phone }
    ];

    // Find best matching field
    let bestMatch = { name: 'unknown', score: 0 };

    for (const field of fields) {
      if (!field.value) continue;
      
      const similarity = this.calculateSimilarity(queryLower, field.value.toLowerCase());
      if (similarity > bestMatch.score) {
        bestMatch = { name: field.name, score: similarity };
      }
    }

    return bestMatch.name;
  }

  /**
   * Search with multiple algorithms and combine results
   * @param query - Search query
   * @returns Combined search results
   */
  async hybridSearch(query: string): Promise<FuzzySearchResult[]> {
    try {
      // Get fuzzy search results
      const fuzzyResults = await this.searchStudents(query, 0.4, 20);

      // Get exact match results from database
      const { students: exactMatches } = await StudentRepository.findAll(
        { search: query },
        { limit: 10, offset: 0 }
      );

      // Convert exact matches to result format
      const exactResults: FuzzySearchResult[] = exactMatches.map(student => ({
        student,
        score: 1.0,
        matchType: 'exact' as const,
        matchedField: 'multiple'
      }));

      // Combine and deduplicate
      const combined = [...exactResults, ...fuzzyResults];
      const unique = this.deduplicateResults(combined);

      // Sort by score
      return unique.sort((a, b) => b.score - a.score);

    } catch (error) {
      logger.error('Error in hybrid search', { error, query });
      throw error;
    }
  }

  /**
   * Remove duplicate students from results
   * @param results - Search results
   * @returns Deduplicated results
   */
  private deduplicateResults(results: FuzzySearchResult[]): FuzzySearchResult[] {
    const seen = new Set<number>();
    return results.filter(result => {
      if (seen.has(result.student.studentId)) {
        return false;
      }
      seen.add(result.student.studentId);
      return true;
    });
  }
}

export default new FuzzySearchService();
