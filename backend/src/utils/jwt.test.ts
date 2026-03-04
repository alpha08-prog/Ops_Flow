import { generateToken, verifyToken, extractToken } from './jwt';
import jwt from 'jsonwebtoken';

jest.mock('../config', () => ({
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
}));

describe('JWT Utils', () => {
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const payload = { id: 'test-id', role: 'STAFF' as any, email: 'test@example.com', name: 'Test' };
            const token = generateToken(payload);

            expect(typeof token).toBe('string');
            // Token should have 3 parts separated by dots
            expect(token.split('.').length).toBe(3);
        });
    });

    describe('verifyToken', () => {
        it('should verify and decode a valid token', () => {
            const payload = { id: 'test-id', role: 'STAFF' as any, email: 'test@example.com', name: 'Test' };
            const token = generateToken(payload);

            const decoded = verifyToken(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.id).toBe(payload.id);
            expect(decoded?.role).toBe(payload.role);
        });

        it('should return null for invalid token', () => {
            const decoded = verifyToken('invalid.token.here');
            expect(decoded).toBeNull();
        });
    });

    describe('extractToken', () => {
        it('should extract token from valid Bearer header', () => {
            const header = 'Bearer some.valid.token';
            const extracted = extractToken(header);
            expect(extracted).toBe('some.valid.token');
        });

        it('should return null if header is missing', () => {
            expect(extractToken(undefined)).toBeNull();
        });

        it('should return null if header does not start with Bearer', () => {
            expect(extractToken('Basic some-token')).toBeNull();
        });
    });
});
