import { hashPassword, comparePassword, validatePasswordStrength } from './password';
import bcrypt from 'bcryptjs';

describe('Password Utility', () => {
    describe('Hash & Compare Password', () => {
        it('should hash a password consistently and verify correctly', async () => {
            const password = 'StrongPassword123#';
            const hash = await hashPassword(password);

            expect(hash).not.toBe(password);
            expect(typeof hash).toBe('string');

            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);

            const isInvalid = await comparePassword('wrongpassword', hash);
            expect(isInvalid).toBe(false);
        });
    });

    describe('Password Strength Validation', () => {
        it('should validate a strong password', () => {
            const result = validatePasswordStrength('StrongPassword123#');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require minimum length', () => {
            const result = validatePasswordStrength('S1#');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should require uppercase letter', () => {
            const result = validatePasswordStrength('strongpassword123#');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should require lowercase letter', () => {
            const result = validatePasswordStrength('STRONGPASSWORD123#');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should require a number', () => {
            const result = validatePasswordStrength('StrongPassword#');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should require a special character', () => {
            const result = validatePasswordStrength('StrongPassword123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });
    });
});
