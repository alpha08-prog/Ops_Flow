import { Request, Response, NextFunction } from 'express';
import { validate } from './validate';
import { body, query } from 'express-validator';

describe('Validate Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next if validation passes', async () => {
        mockReq = { body: { name: 'John' } };
        const middleware = validate([body('name').isString()]);

        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 422 with formatted errors if validation fails', async () => {
        mockReq = { body: { age: 'not-a-number' } };
        const middleware = validate([
            body('age').isInt().withMessage('Age must be an integer')
        ]);

        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Validation failed',
            errors: expect.arrayContaining([
                expect.objectContaining({ field: 'age', message: 'Age must be an integer' })
            ])
        }));
    });
});
