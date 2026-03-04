import { Response } from 'express';
import {
    sendSuccess,
    sendError,
    sendValidationError,
    sendUnauthorized,
    sendForbidden,
    sendNotFound,
    sendServerError
} from './response';

describe('Response Utils', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn().mockReturnThis();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = {
            status: mockStatus,
            json: mockJson
        };
        jest.clearAllMocks();
    });

    describe('sendSuccess', () => {
        it('should send default success response', () => {
            sendSuccess(mockRes as Response, { user: 'test' });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'Success',
                data: { user: 'test' }
            });
        });

        it('should send custom success message and status', () => {
            sendSuccess(mockRes as Response, { id: 1 }, 'Created', 201);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'Created',
                data: { id: 1 }
            });
        });
    });

    describe('sendError', () => {
        it('should send standard error response', () => {
            sendError(mockRes as Response, 'Bad Request');
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: 'Bad Request',
                error: 'Bad Request'
            });
        });
    });

    describe('sendValidationError', () => {
        it('should send validation errors', () => {
            const errors = [{ field: 'email', message: 'Invalid email' }];
            sendValidationError(mockRes as Response, errors);
            expect(mockStatus).toHaveBeenCalledWith(422);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors
            });
        });
    });

    describe('HTTP status helpers', () => {
        it('should send unauthorized (401)', () => {
            sendUnauthorized(mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(401);
        });

        it('should send forbidden (403)', () => {
            sendForbidden(mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(403);
        });

        it('should send not found (404)', () => {
            sendNotFound(mockRes as Response);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        it('should send server error (500)', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            sendServerError(mockRes as Response, 'Internal Error', new Error('test'));
            expect(mockStatus).toHaveBeenCalledWith(500);
            consoleErrorSpy.mockRestore();
        });
    });
});
