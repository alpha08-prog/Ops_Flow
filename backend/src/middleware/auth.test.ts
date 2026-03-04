import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, staffOnly, adminOnly, superAdminOnly } from './auth';
import prismaMock from '../lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';

jest.mock('../lib/prisma');
const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

jest.mock('../utils/jwt', () => ({
    extractToken: jest.fn((header) => {
        if (header === 'Bearer valid.token') return 'valid.token';
        if (header) return header.replace('Bearer ', '');
        return null;
    }),
    verifyToken: jest.fn((token) => {
        if (token === 'valid.token') return { id: 'user123', role: 'STAFF' };
        return null;
    })
}));

describe('Auth Middleware', () => {
    let mockReq: any;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            headers: {},
            query: {},
            path: '/api/test'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should return 401 if no token provided', async () => {
            await authenticate(mockReq as any, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'No token provided' }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            mockReq.headers.authorization = 'Bearer invalid.token';

            await authenticate(mockReq as any, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid or expired token' }));
        });

        it('should attach user and call next if token is valid', async () => {
            mockReq.headers.authorization = 'Bearer valid.token';

            const mockUser = { id: 'user123', email: 'test@example.com', role: 'STAFF', name: 'Test', isActive: true };
            prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(mockUser)) as any);

            await authenticate(mockReq as any, mockRes as Response, mockNext);

            expect(mockReq.user).toEqual({
                id: 'user123',
                email: 'test@example.com',
                role: 'STAFF',
                name: 'Test'
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should accept token from query string (e.g. for PDFs)', async () => {
            mockReq.query.token = 'valid.token';

            const mockUser = { id: 'user123', email: 'test@example.com', role: 'STAFF', name: 'Test', isActive: true };
            prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(mockUser)) as any);

            await authenticate(mockReq as any, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user?.id).toBe('user123');
        });

        it('should return 401 if user does not exist or inactive', async () => {
            mockReq.headers.authorization = 'Bearer valid.token';
            prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(null)) as any);

            await authenticate(mockReq as any, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found or inactive' }));
        });
    });

    describe('authorize', () => {
        it('should return 401 if user is not authenticated', () => {
            const middleware = authorize(UserRole.ADMIN);
            middleware(mockReq as any, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not authenticated' }));
        });

        it('should call next if user has allowed role', () => {
            mockReq.user = { role: UserRole.ADMIN };
            const middleware = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);

            middleware(mockReq as any, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should return 403 if user does not have allowed role', () => {
            mockReq.user = { role: UserRole.STAFF, email: 'test' };
            const middleware = authorize(UserRole.ADMIN);

            middleware(mockReq as any, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Access denied') }));
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('role aliases', () => {
        it('staffOnly allows STAFF', () => {
            mockReq.user = { role: UserRole.STAFF };
            staffOnly(mockReq as any, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('adminOnly blocks STAFF', () => {
            mockReq.user = { role: UserRole.STAFF, email: 'test' };
            adminOnly(mockReq as any, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('superAdminOnly blocks ADMIN', () => {
            mockReq.user = { role: UserRole.ADMIN, email: 'test' };
            superAdminOnly(mockReq as any, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });
});
