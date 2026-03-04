import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('Birthday Controller - Integration Tests', () => {
    let token: string;
    const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        name: 'Test Setup',
        email: 'test@example.com',
        role: 'ADMIN',
        isActive: true,
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        token = generateToken({ id: mockUser.id, role: mockUser.role, email: mockUser.email, name: mockUser.name });
        // Mock auth middleware looking up user
        prisma.user.findUnique.mockImplementation(((args: any) => Promise.resolve(mockUser)) as any);
    });

    describe('POST /api/birthdays', () => {
        it('should create a new birthday entry', async () => {
            const mockBirthday = {
                id: '123e4567-e89b-12d3-a456-426614174002',
                name: 'John Doe',
                phone: '1234567890',
                dob: new Date('1990-01-01'),
                relation: 'Friend',
                notes: 'None',
                createdById: mockUser.id
            };
            prisma.birthday.create.mockResolvedValue(mockBirthday as any);

            const response = await request(app)
                .post('/api/birthdays')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'John Doe',
                    phone: '1234567890',
                    dob: '1990-01-01',
                    relation: 'Friend',
                    notes: 'None'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('John Doe');
        });
    });

    describe('GET /api/birthdays', () => {
        it('should return paginated birthdays', async () => {
            prisma.birthday.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174002', name: 'John Doe' }] as any);
            prisma.birthday.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/birthdays?page=1&limit=10')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.total).toBe(1);
        });
    });

    describe('GET /api/birthdays/today', () => {
        it('should return todays birthdays', async () => {
            prisma.$queryRaw.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174002', name: 'Today Birthday' }]);

            const response = await request(app)
                .get('/api/birthdays/today')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0].name).toBe('Today Birthday');
        });
    });

    describe('GET /api/birthdays/:id', () => {
        it('should return a single birthday element', async () => {
            prisma.birthday.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', name: 'John Doe' } as any);

            const response = await request(app)
                .get('/api/birthdays/123e4567-e89b-12d3-a456-426614174002')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('John Doe');
        });

        it('should return 404 if not found', async () => {
            prisma.birthday.findUnique.mockResolvedValue(null as any);

            const response = await request(app)
                .get('/api/birthdays/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/birthdays/:id', () => {
        it('should update birthday entry', async () => {
            prisma.birthday.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', name: 'Old Name' } as any);
            prisma.birthday.update.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', name: 'New Name' } as any);

            const response = await request(app)
                .put('/api/birthdays/123e4567-e89b-12d3-a456-426614174002')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'New Name' });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('New Name');
        });
    });

    describe('DELETE /api/birthdays/:id', () => {
        it('should delete birthday entry', async () => {
            prisma.birthday.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002' } as any);
            prisma.birthday.delete.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002' } as any);

            const response = await request(app)
                .delete('/api/birthdays/123e4567-e89b-12d3-a456-426614174002')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });
    });
});








