import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('History Controller - Integration Tests', () => {
    let adminToken: string;

    const mockAdmin = {
        id: '123e4567-e89b-12d3-a456-426614174012',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        adminToken = generateToken({ id: mockAdmin.id, role: mockAdmin.role, email: mockAdmin.email, name: mockAdmin.name });

        prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(mockAdmin)) as any);
    });

    describe('GET /api/history', () => {
        it('should format and return admin history correctly', async () => {
            // Mock grievance response
            prisma.grievance.findMany.mockResolvedValue([{
                id: '123e4567-e89b-12d3-a456-426614174003',
                status: 'RESOLVED',
                grievanceType: 'Water',
                petitionerName: 'Pet',
                constituency: 'Con',
                verifiedAt: new Date('2023-01-01'),
            }] as any);

            // Mock train response
            prisma.trainRequest.findMany.mockResolvedValue([{
                id: '123e4567-e89b-12d3-a456-426614174006',
                status: 'APPROVED',
                passengerName: 'Pass',
                pnrNumber: 'PNR',
                approvedAt: new Date('2023-01-02'),
            }] as any);

            // Mock tour program response
            prisma.tourProgram.findMany.mockResolvedValue([{
                id: '123e4567-e89b-12d3-a456-426614174001',
                decision: 'ACCEPTED',
                eventName: 'Event',
                organizer: 'Org',
                venue: 'Ven',
                updatedAt: new Date('2023-01-03'),
            }] as any);

            const response = await request(app)
                .get('/api/history')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);

            // Should be sorted by date descending (Newest first)
            expect(response.body.data[0].type).toBe('TOUR_PROGRAM');
            expect(response.body.data[1].type).toBe('TRAIN_REQUEST');
            expect(response.body.data[2].type).toBe('GRIEVANCE');
        });
    });

    describe('GET /api/history/stats', () => {
        it('should return combined history statistics', async () => {
            // Setup count mock to return sequential values or just spy
            prisma.grievance.count.mockResolvedValue(5);
            prisma.trainRequest.count.mockResolvedValue(2);
            prisma.tourProgram.count.mockResolvedValue(3);

            const response = await request(app)
                .get('/api/history/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.grievances).toBeDefined();
            expect(response.body.data.trainRequests).toBeDefined();
            expect(response.body.data.tourPrograms).toBeDefined();
        });
    });
});







