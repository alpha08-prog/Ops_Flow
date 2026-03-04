import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, ApiError } from './errorHandler';
import { Prisma } from '@prisma/client';

describe('Error Handler Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            method: 'GET',
            originalUrl: '/api/not-found'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('errorHandler', () => {
        it('should handle standard Error as 500', () => {
            const error = new Error('Something went wrong');
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Internal server error'
            }));
        });

        it('should handle custom ApiError', () => {
            const error = new ApiError('Custom Bad Request', 400);
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Custom Bad Request'
            }));
        });

        it('should handle Prisma P2002 Unique Constraint', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Mock', {
                code: 'P2002',
                clientVersion: '1.0'
            });
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'A record with this value already exists'
            }));
        });

        it('should handle Prisma P2025 Not Found', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Mock', {
                code: 'P2025',
                clientVersion: '1.0'
            });
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle Prisma Validation Error', () => {
            const error = new Prisma.PrismaClientValidationError('Validation failed', { clientVersion: '1' });
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid data provided'
            }));
        });

        it('should handle express-validator Error', () => {
            const error = new Error('Val');
            error.name = 'ValidationError';
            errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(422);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation failed'
            }));
        });
    });

    describe('notFoundHandler', () => {
        it('should return 404 with route info', () => {
            notFoundHandler(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Route GET /api/not-found not found'
            }));
        });
    });
});
