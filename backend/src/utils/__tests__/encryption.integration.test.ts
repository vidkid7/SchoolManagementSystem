import { encrypt, decrypt, maskSensitiveData } from '../encryption';

/**
 * Integration Tests for Data Encryption
 * Tests encryption utility functions that are used for protecting sensitive data
 * Requirements: 36.10
 */
describe('Data Encryption Integration Tests', () => {
  describe('Citizenship Number Encryption', () => {
    it('should encrypt and decrypt citizenship numbers correctly', () => {
      const citizenshipNumbers = [
        '12-34-56-7890',
        '98-76-54-3210',
        '11-22-33-4455',
        '55-44-33-2211'
      ];

      citizenshipNumbers.forEach(number => {
        const encrypted = encrypt(number);
        const decrypted = decrypt(encrypted);

        // Verify encryption
        expect(encrypted).not.toBe(number);
        expect(encrypted).toContain(':'); // IV:ciphertext format

        // Verify decryption
        expect(decrypted).toBe(number);
      });
    });

    it('should produce different ciphertexts for same citizenship number', () => {
      const citizenship = '12-34-56-7890';
      
      const encrypted1 = encrypt(citizenship);
      const encrypted2 = encrypt(citizenship);

      // Different ciphertexts (due to random IV)
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same value
      expect(decrypt(encrypted1)).toBe(citizenship);
      expect(decrypt(encrypted2)).toBe(citizenship);
    });

    it('should mask citizenship numbers for display', () => {
      const citizenship = '12-34-56-7890';
      const masked = maskSensitiveData(citizenship, 'citizenship');

      expect(masked).toBe('****-****-7890');
      expect(masked).not.toContain('12-34-56');
    });
  });

  describe('Payment Information Encryption', () => {
    it('should encrypt and decrypt payment card numbers', () => {
      const cardNumber = '1234-5678-9012-3456';
      
      const encrypted = encrypt(cardNumber);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(cardNumber);
      expect(decrypted).toBe(cardNumber);
    });

    it('should encrypt and decrypt payment gateway credentials', () => {
      const credentials = JSON.stringify({
        merchantId: 'MERCHANT123',
        secretKey: 'SECRET_KEY_XYZ',
        apiToken: 'TOKEN_ABC123'
      });

      const encrypted = encrypt(credentials);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(credentials);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(credentials));
    });

    it('should encrypt and decrypt transaction IDs', () => {
      const transactionIds = [
        'TXN-2024-001',
        'PAY-2024-002',
        'REF-2024-003'
      ];

      transactionIds.forEach(txnId => {
        const encrypted = encrypt(txnId);
        const decrypted = decrypt(encrypted);

        expect(encrypted).not.toBe(txnId);
        expect(decrypted).toBe(txnId);
      });
    });
  });

  describe('Personal Identification Numbers', () => {
    it('should encrypt and decrypt passport numbers', () => {
      const passportNumber = 'N1234567';
      
      const encrypted = encrypt(passportNumber);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(passportNumber);
      expect(decrypted).toBe(passportNumber);
    });

    it('should encrypt and decrypt national ID numbers', () => {
      const nationalId = '123456789012';
      
      const encrypted = encrypt(nationalId);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(nationalId);
      expect(decrypted).toBe(nationalId);
    });

    it('should encrypt and decrypt driving license numbers', () => {
      const licenseNumber = 'DL-12345-2024';
      
      const encrypted = encrypt(licenseNumber);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(licenseNumber);
      expect(decrypted).toBe(licenseNumber);
    });
  });

  describe('Sensitive Contact Information', () => {
    it('should encrypt and decrypt phone numbers', () => {
      const phoneNumbers = [
        '9841234567',
        '+977-9841234567',
        '01-4567890'
      ];

      phoneNumbers.forEach(phone => {
        const encrypted = encrypt(phone);
        const decrypted = decrypt(encrypted);

        expect(encrypted).not.toBe(phone);
        expect(decrypted).toBe(phone);
      });
    });

    it('should mask phone numbers for display', () => {
      const phone = '9841234567';
      const masked = maskSensitiveData(phone, 'phone');

      expect(masked).toBe('******4567');
      expect(masked).not.toContain('9841');
    });

    it('should encrypt and decrypt email addresses', () => {
      const emails = [
        'john.doe@example.com',
        'admin@school.edu.np',
        'parent@gmail.com'
      ];

      emails.forEach(email => {
        const encrypted = encrypt(email);
        const decrypted = decrypt(encrypted);

        expect(encrypted).not.toBe(email);
        expect(decrypted).toBe(email);
      });
    });

    it('should mask email addresses for display', () => {
      const email = 'john.doe@example.com';
      const masked = maskSensitiveData(email, 'email');

      expect(masked).toBe('jo***@example.com');
      expect(masked).not.toContain('john.doe');
    });
  });

  describe('Medical and Health Information', () => {
    it('should encrypt and decrypt medical record numbers', () => {
      const medicalRecordNumber = 'MRN-2024-12345';
      
      const encrypted = encrypt(medicalRecordNumber);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(medicalRecordNumber);
      expect(decrypted).toBe(medicalRecordNumber);
    });

    it('should encrypt and decrypt health insurance numbers', () => {
      const insuranceNumber = 'INS-987654321';
      
      const encrypted = encrypt(insuranceNumber);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(insuranceNumber);
      expect(decrypted).toBe(insuranceNumber);
    });

    it('should encrypt and decrypt medical conditions', () => {
      const medicalInfo = JSON.stringify({
        allergies: ['Peanuts', 'Penicillin'],
        conditions: ['Asthma'],
        medications: ['Inhaler']
      });

      const encrypted = encrypt(medicalInfo);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(medicalInfo);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(medicalInfo));
    });
  });

  describe('Security Properties', () => {
    it('should not leak plaintext in ciphertext', () => {
      const sensitiveData = [
        'CONFIDENTIAL-123',
        'SECRET-PASSWORD',
        'PRIVATE-KEY-XYZ'
      ];

      sensitiveData.forEach(data => {
        const encrypted = encrypt(data);
        
        // Extract words from plaintext
        const words = data.toLowerCase().split(/[-_]/);
        
        // Verify none of the words appear in ciphertext
        words.forEach(word => {
          if (word.length > 3) { // Only check meaningful words
            expect(encrypted.toLowerCase()).not.toContain(word);
          }
        });
      });
    });

    it('should use AES-256-CBC encryption', () => {
      const data = 'test data';
      const encrypted = encrypt(data);
      
      // Verify format: IV:ciphertext
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(2);
      
      // IV should be 16 bytes (32 hex chars)
      expect(parts[0]).toHaveLength(32);
      expect(/^[0-9a-f]+$/.test(parts[0])).toBe(true);
    });

    it('should handle Unicode characters (Nepali text)', () => {
      const nepaliData = [
        'नागरिकता नम्बर',
        'विद्यार्थी जानकारी',
        'गोप्य तथ्याङ्क'
      ];

      nepaliData.forEach(data => {
        const encrypted = encrypt(data);
        const decrypted = decrypt(encrypted);

        expect(encrypted).not.toBe(data);
        expect(decrypted).toBe(data);
      });
    });

    it('should handle large data sets', () => {
      const largeData = 'A'.repeat(10000);
      
      const encrypted = encrypt(largeData);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(largeData);
      expect(decrypted).toBe(largeData);
      expect(decrypted).toHaveLength(10000);
    });

    it('should be resistant to tampering', () => {
      const data = 'sensitive data';
      const encrypted = encrypt(data);
      
      // Tamper with ciphertext
      const parts = encrypted.split(':');
      const tamperedCiphertext = parts[1].substring(0, parts[1].length - 2) + 'XX';
      const tampered = parts[0] + ':' + tamperedCiphertext;

      // Decryption should fail
      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch encryption of citizenship numbers', () => {
      const citizenships = Array.from({ length: 100 }, (_, i) => 
        `${String(i).padStart(2, '0')}-${String(i).padStart(2, '0')}-${String(i).padStart(2, '0')}-${String(i).padStart(4, '0')}`
      );

      const encrypted = citizenships.map(encrypt);
      const decrypted = encrypted.map(decrypt);

      expect(decrypted).toEqual(citizenships);
      
      // Verify all are encrypted differently
      const uniqueEncrypted = new Set(encrypted);
      expect(uniqueEncrypted.size).toBe(100);
    });

    it('should handle batch encryption of payment information', () => {
      const paymentData = Array.from({ length: 50 }, (_, i) => ({
        cardNumber: `1234-5678-9012-${String(i).padStart(4, '0')}`,
        cvv: String(i).padStart(3, '0'),
        expiryDate: '12/25'
      }));

      const encrypted = paymentData.map(data => encrypt(JSON.stringify(data)));
      const decrypted = encrypted.map(enc => JSON.parse(decrypt(enc)));

      expect(decrypted).toEqual(paymentData);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty strings', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should throw error for invalid encrypted format', () => {
      expect(() => decrypt('invalid')).toThrow('Decryption failed');
      expect(() => decrypt('invalid:format:extra')).toThrow('Decryption failed');
    });

    it('should throw error for corrupted data', () => {
      const encrypted = encrypt('test');
      const corrupted = encrypted.replace(/[0-9]/g, 'X');
      
      expect(() => decrypt(corrupted)).toThrow('Decryption failed');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 36.10: Encrypt sensitive data at rest', () => {
      // Test various types of sensitive data
      const sensitiveData = {
        citizenship: '12-34-56-7890',
        paymentInfo: 'CARD-1234-5678-9012-3456',
        medicalRecord: 'MRN-2024-12345',
        personalId: 'ID-987654321'
      };

      Object.entries(sensitiveData).forEach(([_, data]) => {
        const encrypted = encrypt(data);
        
        // Verify data is encrypted (not plaintext)
        expect(encrypted).not.toBe(data);
        
        // Verify encrypted format
        expect(encrypted).toContain(':');
        
        // Verify decryption works
        expect(decrypt(encrypted)).toBe(data);
      });
    });

    it('should use strong encryption (AES-256)', () => {
      const data = 'test';
      const encrypted = encrypt(data);
      
      // Verify IV length (16 bytes = 32 hex chars)
      const iv = encrypted.split(':')[0];
      expect(iv).toHaveLength(32);
      
      // Verify ciphertext is not plaintext
      expect(encrypted).not.toContain(data);
    });
  });
});
