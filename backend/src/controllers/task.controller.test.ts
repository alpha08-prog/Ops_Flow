import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Task Controller - Integration Tests', () => {
    let adminToken: string;
    let staffToken: string;

    const mockAdmin = {
        id: '123e4567-e89b-12d3-a456-426614174014',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
    } as any;

    const mockStaff = {
        id: '123e4567-e89b-12d3-a456-426614174015',
        name: 'Staff',
        email: 'staff@example.com',
        role: 'STAFF',
        isActive: true,
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        adminToken = generateToken({ id: mockAdmin.id, role: mockAdmin.role, email: mockAdmin.email, name: mockAdmin.name });
        staffToken = generateToken({ id: mockStaff.id, role: mockStaff.role, email: mockStaff.email, name: mockStaff.name });

        prisma.user.findUnique.mockImplementation(((args: any) => {
            if (args.where.id === '123e4567-e89b-12d3-a456-426614174014') return Promise.resolve(mockAdmin);
            if (args.where.id === '123e4567-e89b-12d3-a456-426614174015') return Promise.resolve(mockStaff);
            return Promise.resolve(null);
        }) as any);
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            prisma.taskAssignment.create.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174006', title: 'Task 1' } as any);

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Task 1',
                    assignedToId: '123e4567-e89b-12d3-a456-426614174015',
                    taskType: 'GENERAL'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('Task 1');
        });
    });

    describe('GET /api/tasks/my-tasks', () => {
        it('should get tasks for current user', async () => {
            prisma.taskAssignment.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174006', title: 'Task 1' }] as any);
            prisma.taskAssignment.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/tasks/my-tasks')
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('PATCH /api/tasks/:id/progress', () => {
        it('should update task progress', async () => {
            prisma.taskAssignment.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174006', assignedToId: '123e4567-e89b-12d3-a456-426614174015' } as any);
            prisma.taskProgressHistory.create.mockResolvedValue({} as any);
            prisma.taskAssignment.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174006', status: 'IN_PROGRESS' } as any);

            const response = await request(app)
                .patch('/api/tasks/123e4567-e89b-12d3-a456-426614174006/progress')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ status: 'IN_PROGRESS', progressNotes: 'Started' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('IN_PROGRESS');
        });
    });
});







