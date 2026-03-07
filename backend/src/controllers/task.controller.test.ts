import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient, User, TaskAssignment, TaskProgressHistory, TaskStatus, TaskType, UserRole } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Task Controller - Integration Tests', () => {
    let adminToken: string;
    let staffToken: string;

    const mockAdmin: User = {
        id: '123e4567-e89b-12d3-a456-426614174014',
        name: 'Admin',
        email: 'admin@example.com',
        phone: '1234567890',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockStaff: User = {
        id: '123e4567-e89b-12d3-a456-426614174015',
        name: 'Staff',
        email: 'staff@example.com',
        phone: '0987654321',
        password: 'hashed-password',
        role: UserRole.STAFF,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        adminToken = generateToken({ id: mockAdmin.id, role: mockAdmin.role, email: mockAdmin.email, name: mockAdmin.name });
        staffToken = generateToken({ id: mockStaff.id, role: mockStaff.role, email: mockStaff.email, name: mockStaff.name });
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            // First call: auth middleware (adminToken). Second call: createTask assignee validation (staff)
            prisma.user.findUnique.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(mockStaff);

            const mockTask: TaskAssignment = {
                id: '123e4567-e89b-12d3-a456-426614174006',
                title: 'Task 1',
                description: null,
                taskType: TaskType.GENERAL,
                status: TaskStatus.ASSIGNED,
                priority: 'NORMAL',
                referenceId: null,
                referenceType: null,
                progressNotes: null,
                progressPercent: 0,
                assignedAt: new Date(),
                dueDate: null,
                startedAt: null,
                completedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                assignedToId: '123e4567-e89b-12d3-a456-426614174015',
                assignedById: '123e4567-e89b-12d3-a456-426614174014',
            };

            prisma.taskAssignment.create.mockResolvedValue(mockTask);

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Task 1',
                    assignedToId: '123e4567-e89b-12d3-a456-426614174015',
                    taskType: TaskType.GENERAL
                });

            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('Task 1');
        });
    });

    describe('GET /api/tasks/my-tasks', () => {
        it('should get tasks for current user', async () => {
            prisma.user.findUnique.mockResolvedValue(mockStaff);
            const mockTask: TaskAssignment = {
                id: '123e4567-e89b-12d3-a456-426614174006',
                title: 'Task 1',
                description: null,
                taskType: TaskType.GENERAL,
                status: TaskStatus.ASSIGNED,
                priority: 'NORMAL',
                referenceId: null,
                referenceType: null,
                progressNotes: null,
                progressPercent: 0,
                assignedAt: new Date(),
                dueDate: null,
                startedAt: null,
                completedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                assignedToId: '123e4567-e89b-12d3-a456-426614174015',
                assignedById: '123e4567-e89b-12d3-a456-426614174014',
            };

            prisma.taskAssignment.findMany.mockResolvedValue([mockTask]);
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
            prisma.user.findUnique.mockResolvedValue(mockStaff);
            const mockTask: TaskAssignment = {
                id: '123e4567-e89b-12d3-a456-426614174006',
                title: 'Task 1',
                description: null,
                taskType: TaskType.GENERAL,
                status: TaskStatus.ASSIGNED,
                priority: 'NORMAL',
                referenceId: null,
                referenceType: null,
                progressNotes: null,
                progressPercent: 0,
                assignedAt: new Date(),
                dueDate: null,
                startedAt: null,
                completedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                assignedToId: '123e4567-e89b-12d3-a456-426614174015',
                assignedById: '123e4567-e89b-12d3-a456-426614174014',
            };

            const updatedTask: TaskAssignment = {
                ...mockTask,
                status: TaskStatus.IN_PROGRESS,
            };

            const mockHistory: TaskProgressHistory = {
                id: 'history-id',
                taskId: '123e4567-e89b-12d3-a456-426614174006',
                note: 'Started',
                status: TaskStatus.IN_PROGRESS,
                createdAt: new Date(),
                createdById: '123e4567-e89b-12d3-a456-426614174015',
            };

            prisma.taskAssignment.findUnique.mockResolvedValue(mockTask);
            prisma.taskProgressHistory.create.mockResolvedValue(mockHistory);
            prisma.taskAssignment.update.mockResolvedValue(updatedTask);

            const response = await request(app)
                .patch('/api/tasks/123e4567-e89b-12d3-a456-426614174006/progress')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ status: 'IN_PROGRESS', progressNotes: 'Started' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('IN_PROGRESS');
        });
    });
});








