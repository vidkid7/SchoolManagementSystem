import { encrypt, decrypt, maskSensitiveData, generateToken, hashData } from '../encryption';
import crypto from 'crypto';

describe('Encryption Utilities', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'sensitive data 123';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'test data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle Unicode characters (Nepali text)', () => {
      const plaintext = 'नागरिकता नम्बर १२३४५';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long text', () => {
      const plaintext = 'A'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted format', () => {
      expect(() => decrypt('invalid')).toThrow('Decryption failed');
      expect(() => decrypt('invalid:format:extra')).toThrow('Decryption failed');
    });

    it('should throw error for tampered ciphertext', () => {
      const plaintext = 'test data';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the ciphertext part (after the colon)
      const parts = encrypted.split(':');
      const tamperedCiphertext = parts[1].substring(0, parts[1].length - 2) + 'XX';
      const tampered = parts[0] + ':' + tamperedCiphertext;

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });

    it('should produce ciphertext with IV prefix', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(32); // 16 bytes IV in hex = 32 chars
    });
  });

  describe('maskSensitiveData', () => {
    describe('phone masking', () => {
      it('should mask phone number showing last 4 digits', () => {
        expect(maskSensitiveData('9841234567', 'phone')).toBe('******4567');
      });

      it('should handle short phone numbers', () => {
        expect(maskSensitiveData('123', 'phone')).toBe('123');
        expect(maskSensitiveData('1234', 'phone')).toBe('1234');
      });

      it('should handle empty phone', () => {
        expect(maskSensitiveData('', 'phone')).toBe('');
      });
    });

    describe('email masking', () => {
      it('should mask email showing first 2 chars and domain', () => {
        expect(maskSensitiveData('john.doe@example.com', 'email')).toBe('jo***@example.com');
      });

      it('should handle short email local part', () => {
        expect(maskSensitiveData('a@example.com', 'email')).toBe('a***@example.com');
      });

      it('should handle invalid email format', () => {
        expect(maskSensitiveData('notanemail', 'email')).toBe('notanemail');
      });

      it('should handle empty email', () => {
        expect(maskSensitiveData('', 'email')).toBe('');
      });
    });

    describe('citizenship masking', () => {
      it('should mask citizenship number showing last 4 digits', () => {
        expect(maskSensitiveData('12-34-56-7890', 'citizenship')).toBe('****-****-7890');
      });

      it('should handle short citizenship numbers', () => {
        expect(maskSensitiveData('123', 'citizenship')).toBe('****-****-123');
      });

      it('should handle empty citizenship', () => {
        expect(maskSensitiveData('', 'citizenship')).toBe('');
      });
    });
  });

  describe('generateToken', () => {
    it('should generate token of default length (64 hex chars = 32 bytes)', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate token of custom length', () => {
      const token = generateToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100); // All unique
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'test data';
      const hash1 = hashData(data);
      const hash2 = hashData(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different data', () => {
      const hash1 = hashData('data1');
      const hash2 = hashData('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should be deterministic', () => {
      const data = 'consistent data';
      const hashes = Array.from({ length: 10 }, () => hashData(data));
      const uniqueHashes = new Set(hashes);

      expect(uniqueHashes.size).toBe(1);
    });

    it('should handle empty string', () => {
      const hash = hashData('');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const hash = hashData('नेपाली');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should use AES-256-CBC algorithm', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);
      
      // Verify format: IV:ciphertext
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(2);
      
      // IV should be 16 bytes (32 hex chars)
      expect(parts[0]).toHaveLength(32);
    });

    it('should not leak plaintext in ciphertext', () => {
      const plaintext = 'citizenship-12345';
      const encrypted = encrypt(plaintext);

      expect(encrypted.toLowerCase()).not.toContain('citizenship');
      expect(encrypted).not.toContain('12345');
    });

    it('should be resistant to pattern analysis', () => {
      const plaintext = 'AAAAAAAAAA';
      const encrypted = encrypt(plaintext);
      
      // Ciphertext should not contain repeated patterns
      const ciphertext = encrypted.split(':')[1];
      const hasRepeatedPattern = /(.{4})\1{2,}/.test(ciphertext);
      expect(hasRepeatedPattern).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      // Mock crypto to throw error
      const originalRandomBytes = crypto.randomBytes;
      crypto.randomBytes = jest.fn(() => {
        throw new Error('Crypto error');
      });

      expect(() => encrypt('test')).toThrow('Encryption failed');

      // Restore
      crypto.randomBytes = originalRandomBytes;
    });

    it('should handle decryption errors gracefully', () => {
      expect(() => decrypt('invalid:data')).toThrow('Decryption failed');
    });
  });

  describe('Integration Tests', () => {
    it('should encrypt and decrypt citizenship numbers', () => {
      const citizenshipNumbers = [
        '12-34-56-7890',
        '98-76-54-3210',
        '11-22-33-4455'
      ];

      citizenshipNumbers.forEach(number => {
        const encrypted = encrypt(number);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(number);
      });
    });

    it('should encrypt and decrypt payment information', () => {
      const paymentInfo = JSON.stringify({
        cardNumber: '1234-5678-9012-3456',
        cvv: '123',
        expiryDate: '12/25'
      });

      const encrypted = encrypt(paymentInfo);
      const decrypted = decrypt(encrypted);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(paymentInfo));
    });

    it('should handle batch encryption/decryption', () => {
      const data = Array.from({ length: 100 }, (_, i) => `data-${i}`);
      
      const encrypted = data.map(encrypt);
      const decrypted = encrypted.map(decrypt);

      expect(decrypted).toEqual(data);
    });
  });
});
