import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Stats Controller - Integration Tests', () => {
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

    describe('GET /api/stats/summary', () => {
        it('should retrieve dashboard statistics', async () => {
            // Mock all counts to return 0 to simplify test
            prisma.grievance.count.mockResolvedValue(5);
            prisma.visitor.count.mockResolvedValue(2);
            prisma.trainRequest.count.mockResolvedValue(1);
            prisma.newsIntelligence.count.mockResolvedValue(0);
            prisma.tourProgram.count.mockResolvedValue(0);
            prisma.$queryRaw.mockResolvedValue([{ count: 2n }]);

            const response = await request(app)
                .get('/api/stats/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.grievances.total).toBe(5);
            expect(response.body.data.birthdays.today).toBe(2);
        });
    });

    describe('GET /api/stats/recent-activity', () => {
        it('should retrieve recent activity', async () => {
            prisma.grievance.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174003', status: 'OPEN' }] as any);
            prisma.visitor.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174005' }] as any);
            prisma.newsIntelligence.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174004' }] as any);
            prisma.trainRequest.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174006' }] as any);

            const response = await request(app)
                .get('/api/stats/recent-activity')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.grievances).toHaveLength(1);
            expect(response.body.data.visitors).toHaveLength(1);
        });
    });
});








