import request from 'supertest';
import app from '../app';
import { hashPassword } from '../utils/password';

// Use jest-mock-extended from the __mocks__ directory
jest.mock('../lib/prisma');

import prismaMock from '../lib/prisma'; // This resolves to the mock from __mocks__/prisma.ts
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Auth Controller - Integration Tests (BDD Style)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough';
    });

    describe('POST /api/auth/register', () => {
        it('given valid user data, when registering, then it should return 201 and user info', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                name: 'Test Setup',
                email: 'test@example.com',
                phone: '1234567890',
                role: 'STAFF',
                password: 'hashed-password',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            prisma.user.findFirst.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);

            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup',
                    email: 'test@example.com',
                    phone: '1234567890',
                    password: 'StrongPassword123!',
                });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.token).toBeDefined();
        });

        it('given existing email, when registering, then it should return 409 conflict', async () => {
            // Arrange
            prisma.user.findFirst.mockResolvedValue({ id: 'existing-id' } as any);

            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup',
                    email: 'existing@example.com',
                    password: 'StrongPassword123!',
                });

            // Assert
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('given weak password, when registering, then it should return 422 bad request', async () => {
            // Arrange
            prisma.user.findFirst.mockResolvedValue(null);

            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup',
                    email: 'test@example.com',
                    password: 'weak',
                });

            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('given valid credentials, when logging in, then it should return 200 and auth token', async () => {
            // Arrange
            const passwordUtils = require('../utils/password');
            jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);

            const mockUser = {
                id: 'user-123',
                name: 'Test Setup',
                email: 'test@example.com',
                phone: null,
                role: 'STAFF',
                password: 'mock-hashed-password',
                isActive: true,
            } as any;

            prisma.user.findFirst.mockResolvedValue(mockUser);

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'StrongPassword123!',
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.token).toBeDefined();
        });

        it('given invalid password, when logging in, then it should return 401 unauthorized', async () => {
            // Arrange
            const hashedPassword = await hashPassword('StrongPassword123!');

            const mockUser = {
                id: 'user-123',
                name: 'Test Setup',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            } as any;

            prisma.user.findFirst.mockResolvedValue(mockUser);

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'WrongPassword123!',
                });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });
});
