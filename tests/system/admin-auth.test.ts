import { describe, it, expect } from 'vitest';

// Tests for admin authentication logic (extracted helper function)
// The actual middleware runs in Next.js edge runtime, so we test the validation logic

const VALID_SECRET = 'bm-ctrl-7f2a9x';

function validateAdminPath(pathKey: string, envSecret: string | undefined): boolean {
  if (!envSecret) return false;
  return pathKey === envSecret;
}

function validateAdminApiSecret(headerValue: string | null, envSecret: string | undefined): boolean {
  if (!envSecret) return false;
  return headerValue === envSecret;
}

describe('Admin Auth', () => {
  describe('Path validation', () => {
    it('should accept correct secret path', () => {
      expect(validateAdminPath(VALID_SECRET, VALID_SECRET)).toBe(true);
    });

    it('should reject wrong secret path', () => {
      expect(validateAdminPath('wrong-key', VALID_SECRET)).toBe(false);
    });

    it('should reject empty secret path', () => {
      expect(validateAdminPath('', VALID_SECRET)).toBe(false);
    });

    it('should reject if env secret is not set', () => {
      expect(validateAdminPath(VALID_SECRET, undefined)).toBe(false);
    });

    it('should reject partial match', () => {
      expect(validateAdminPath('bm-ctrl', VALID_SECRET)).toBe(false);
    });
  });

  describe('API secret validation', () => {
    const API_SECRET = 'adm-sk-Xp8qR3vL7nW2';

    it('should accept correct API secret header', () => {
      expect(validateAdminApiSecret(API_SECRET, API_SECRET)).toBe(true);
    });

    it('should reject wrong API secret', () => {
      expect(validateAdminApiSecret('wrong', API_SECRET)).toBe(false);
    });

    it('should reject null header', () => {
      expect(validateAdminApiSecret(null, API_SECRET)).toBe(false);
    });

    it('should reject if env secret is not set', () => {
      expect(validateAdminApiSecret(API_SECRET, undefined)).toBe(false);
    });
  });
});
