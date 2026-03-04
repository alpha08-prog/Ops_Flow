import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient, GrievanceStatus } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Grievance Controller - Integration Tests', () => {
    let token: string;
    let adminToken: string;

    const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        name: 'Staff User',
        email: 'staff@example.com',
        role: 'STAFF',
        isActive: true,
    } as any;

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
        token = generateToken({ id: mockUser.id, role: mockUser.role, email: mockUser.email, name: mockUser.name });
        adminToken = generateToken({ id: mockAdmin.id, role: mockAdmin.role, email: mockAdmin.email, name: mockAdmin.name });

        // Mock user lookup for authenticate middleware
        prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(
            args.where.id === '123e4567-e89b-12d3-a456-426614174010' ? mockUser :
                args.where.id === '123e4567-e89b-12d3-a456-426614174012' ? mockAdmin : null
        )) as any);
    });

    describe('POST /api/grievances', () => {
        it('should create a new grievance', async () => {
            const mockGrievance = {
                id: '123e4567-e89b-12d3-a456-426614174003',
                petitionerName: 'John Doe',
                mobileNumber: '1234567890',
                constituency: 'Delhi',
                grievanceType: 'Water',
                description: 'No supply',
                createdById: mockUser.id
            };
            prisma.grievance.create.mockResolvedValue(mockGrievance as any);

            const response = await request(app)
                .post('/api/grievances')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    petitionerName: 'John Doe',
                    mobileNumber: '1234567890',
                    constituency: 'Delhi',
                    grievanceType: 'WATER',
                    description: 'No supply',
                    actionRequired: 'FORWARD_TO_DEPT'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.petitionerName).toBe('John Doe');
        });
    });

    describe('GET /api/grievances', () => {
        it('should get a list of grievances', async () => {
            prisma.grievance.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174003', petitionerName: 'Jane' }] as any);
            prisma.grievance.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/grievances')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/grievances/:id', () => {
        it('should return a grievance by id', async () => {
            prisma.grievance.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174003', petitionerName: 'Jane' } as any);

            const response = await request(app)
                .get('/api/grievances/123e4567-e89b-12d3-a456-426614174003')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.petitionerName).toBe('Jane');
        });
    });

    describe('PUT /api/grievances/:id', () => {
        it('should update a grievance', async () => {
            prisma.grievance.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174003', description: 'Updated info' } as any);

            const response = await request(app)
                .put('/api/grievances/123e4567-e89b-12d3-a456-426614174003')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'Updated info' });

            expect(response.status).toBe(200);
            expect(response.body.data.description).toBe('Updated info');
        });
    });

    describe('PATCH /api/grievances/:id/verify', () => {
        it('should allow admin to verify grievance', async () => {
            prisma.grievance.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174003', isVerified: true, status: GrievanceStatus.RESOLVED } as any);

            const response = await request(app)
                .patch('/api/grievances/123e4567-e89b-12d3-a456-426614174003/verify')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.isVerified).toBe(true);
        });

        it('should deny staff from verifying grievance', async () => {
            const response = await request(app)
                .patch('/api/grievances/123e4567-e89b-12d3-a456-426614174003/verify')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });
    });

    describe('PATCH /api/grievances/:id/status', () => {
        it('should update grievance status', async () => {
            prisma.grievance.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174003', status: GrievanceStatus.IN_PROGRESS } as any);

            const response = await request(app)
                .patch('/api/grievances/123e4567-e89b-12d3-a456-426614174003/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: GrievanceStatus.IN_PROGRESS });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('IN_PROGRESS');
        });
    });

    describe('DELETE /api/grievances/:id', () => {
        it('should allow admin to delete grievance', async () => {
            prisma.grievance.delete.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174003' } as any);

            const response = await request(app)
                .delete('/api/grievances/123e4567-e89b-12d3-a456-426614174003')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it('should deny staff from deleting grievance', async () => {
            const response = await request(app)
                .delete('/api/grievances/123e4567-e89b-12d3-a456-426614174003')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });
    });
});








