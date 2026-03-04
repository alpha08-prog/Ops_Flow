import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Visitor Controller - Integration Tests', () => {
    let token: string;

    const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        name: 'Staff User',
        email: 'staff@example.com',
        role: 'ADMIN',
        isActive: true,
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        token = generateToken({ id: mockUser.id, role: mockUser.role, email: mockUser.email, name: mockUser.name });

        prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(mockUser)) as any);
    });

    describe('POST /api/visitors', () => {
        it('should create a visitor entry', async () => {
            const mockVisitor = {
                id: '123e4567-e89b-12d3-a456-426614174005',
                name: 'John Doe',
                phone: '1234567890',
                purpose: 'Meeting',
                createdById: mockUser.id
            };
            prisma.visitor.create.mockResolvedValue(mockVisitor as any);

            const response = await request(app)
                .post('/api/visitors')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'John Doe',
                    phone: '1234567890',
                    purpose: 'Meeting',
                    designation: 'Manager'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe('John Doe');
        });
    });

    describe('GET /api/visitors', () => {
        it('should return paginated visitors', async () => {
            prisma.visitor.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174005', name: 'John Doe' }] as any);
            prisma.visitor.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/visitors')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.meta.total).toBe(1);
        });
    });

    describe('GET /api/visitors/date/:date', () => {
        it('should return visitors for a specific date', async () => {
            prisma.visitor.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174005', name: 'John Doe' }] as any);

            const response = await request(app)
                .get('/api/visitors/date/2023-01-01')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0].name).toBe('John Doe');
        });
    });
});








