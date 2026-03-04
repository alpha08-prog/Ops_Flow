import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient, TrainRequestStatus } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Train Request Controller - Integration Tests', () => {
    let staffToken: string;
    let adminToken: string;

    const mockStaff = {
        id: '123e4567-e89b-12d3-a456-426614174011',
        name: 'Staff',
        email: 'staff@example.com',
        role: 'STAFF',
        isActive: true,
    } as any;

    const mockAdmin = {
        id: '123e4567-e89b-12d3-a456-426614174013',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        staffToken = generateToken({ id: mockStaff.id, role: mockStaff.role, email: mockStaff.email, name: mockStaff.name });
        adminToken = generateToken({ id: mockAdmin.id, role: mockAdmin.role, email: mockAdmin.email, name: mockAdmin.name });

        prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(
            args.where.id === '123e4567-e89b-12d3-a456-426614174011' ? mockStaff :
                args.where.id === '123e4567-e89b-12d3-a456-426614174013' ? mockAdmin : null
        )) as any);
    });

    describe('POST /api/train-requests', () => {
        it('should create a train request', async () => {
            prisma.trainRequest.create.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', passengerName: 'John Doe' } as any);

            const response = await request(app)
                .post('/api/train-requests')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    passengerName: 'John Doe',
                    pnrNumber: '1234567890',
                    journeyClass: '3A',
                    dateOfJourney: new Date(),
                    fromStation: 'NDLS',
                    toStation: 'BCT'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.passengerName).toBe('John Doe');
        });
    });

    describe('GET /api/train-requests', () => {
        it('should return paginated train requests', async () => {
            prisma.trainRequest.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', passengerName: 'John' }] as any);
            prisma.trainRequest.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/train-requests')
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('PATCH /api/train-requests/:id/approve', () => {
        it('should allow admin to approve', async () => {
            prisma.trainRequest.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', status: TrainRequestStatus.APPROVED } as any);

            const response = await request(app)
                .patch('/api/train-requests/123e4567-e89b-12d3-a456-426614174000/approve')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('APPROVED');
        });

        it('should deny staff from approving', async () => {
            const response = await request(app)
                .patch('/api/train-requests/123e4567-e89b-12d3-a456-426614174000/approve')
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/train-requests/queue/pending', () => {
        it('should return pending train requests', async () => {
            prisma.trainRequest.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', status: TrainRequestStatus.PENDING }] as any);
            prisma.trainRequest.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/train-requests/queue/pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0].status).toBe('PENDING');
        });
    });
});








