import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient, TourDecision } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Tour Program Controller - Integration Tests', () => {
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

    describe('POST /api/tour-programs', () => {
        it('should create a tour program', async () => {
            const mockTour = {
                id: '123e4567-e89b-12d3-a456-426614174001',
                eventName: 'Meeting',
                organizer: 'Gov',
                decision: TourDecision.PENDING,
                createdById: mockUser.id
            };
            prisma.tourProgram.create.mockResolvedValue(mockTour as any);

            const response = await request(app)
                .post('/api/tour-programs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    eventName: 'Meeting',
                    organizer: 'Gov',
                    dateTime: new Date().toISOString(),
                    venue: 'Delhi'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.eventName).toBe('Meeting');
        });
    });

    describe('GET /api/tour-programs', () => {
        it('should get a list of tour programs', async () => {
            prisma.tourProgram.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174001', eventName: 'Event' }] as any);
            prisma.tourProgram.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/tour-programs')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/tour-programs/pending', () => {
        it('should get pending decisions', async () => {
            prisma.tourProgram.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174001', decision: TourDecision.PENDING }] as any);
            prisma.tourProgram.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/tour-programs/pending')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0].decision).toBe('PENDING');
        });
    });

    describe('PATCH /api/tour-programs/:id/decision', () => {
        it('should update the decision of a tour program', async () => {
            prisma.tourProgram.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174001', decision: TourDecision.ACCEPTED } as any);

            const response = await request(app)
                .patch('/api/tour-programs/123e4567-e89b-12d3-a456-426614174001/decision')
                .set('Authorization', `Bearer ${token}`)
                .send({ decision: 'ACCEPTED' });

            expect(response.status).toBe(200);
            expect(response.body.data.decision).toBe('ACCEPTED');
        });
    });
});








