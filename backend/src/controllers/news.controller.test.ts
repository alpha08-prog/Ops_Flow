import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient, NewsPriority } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('News Controller - Integration Tests', () => {
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

    describe('POST /api/news', () => {
        it('should create a news entry', async () => {
            const mockNews = {
                id: '123e4567-e89b-12d3-a456-426614174004',
                headline: 'Test News',
                priority: NewsPriority.NORMAL,
                createdById: mockUser.id
            };
            prisma.newsIntelligence.create.mockResolvedValue(mockNews as any);

            const response = await request(app)
                .post('/api/news')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    headline: 'Test News',
                    category: 'DEVELOPMENT_WORK',
                    priority: 'NORMAL',
                    mediaSource: 'Times of India',
                    region: 'Delhi'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.headline).toBe('Test News');
        });
    });

    describe('GET /api/news', () => {
        it('should return paginated news', async () => {
            prisma.newsIntelligence.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174004', headline: 'News 1' }] as any);
            prisma.newsIntelligence.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/news')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/news/alerts/critical', () => {
        it('should return critical alerts', async () => {
            prisma.newsIntelligence.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174004', headline: 'Critical Alert' }] as any);

            const response = await request(app)
                .get('/api/news/alerts/critical')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data[0].headline).toBe('Critical Alert');
        });
    });
});








