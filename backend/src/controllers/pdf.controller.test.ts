import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';
import prismaMock from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

jest.mock('../lib/prisma');
import * as pdfGenerator from '../utils/pdfGenerator';

const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;

describe('PDF Controller - Integration Tests', () => {
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

        // Spy on PDF generator methods
        jest.spyOn(pdfGenerator, 'generateTrainEQLetter').mockImplementation((data, res) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.end(); // End response properly
        });
        jest.spyOn(pdfGenerator, 'generateGrievanceLetter').mockImplementation((data, res) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.end();
        });
        jest.spyOn(pdfGenerator, 'generateTourProgramPDF').mockImplementation((data, dateRange, res) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.end();
        });
    });

    describe('GET /api/pdf/train-eq/:id', () => {
        it('should generate Train EQ PDF', async () => {
            prisma.trainRequest.findUnique.mockResolvedValue({
                id: '123e4567-e89b-12d3-a456-426614174000',
                passengerName: 'Passenger',
                pnrNumber: 'PNR123',
                dateOfJourney: new Date(),
                fromStation: 'A',
                toStation: 'B',
                journeyClass: '3A',
            } as any);

            const response = await request(app)
                .get('/api/pdf/train-eq/123e4567-e89b-12d3-a456-426614174000')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.header['content-type']).toBe('application/pdf');
        });

        it('should return 404 if request not found', async () => {
            prisma.trainRequest.findUnique.mockResolvedValue(null as any);

            const response = await request(app)
                .get('/api/pdf/train-eq/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/pdf/grievance/:id', () => {
        it('should generate Grievance PDF', async () => {
            prisma.grievance.findUnique.mockResolvedValue({
                id: '123e4567-e89b-12d3-a456-426614174003',
                petitionerName: 'Pet',
                mobileNumber: '123',
                constituency: 'Con',
                grievanceType: 'WATER',
                description: 'Desc',
                actionRequired: 'Action'
            } as any);

            const response = await request(app)
                .get('/api/pdf/grievance/123e4567-e89b-12d3-a456-426614174003')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.header['content-type']).toBe('application/pdf');
        });
    });

    describe('GET /api/pdf/tour-program', () => {
        it('should generate Tour Program PDF', async () => {
            prisma.tourProgram.findMany.mockResolvedValue([{
                id: '123e4567-e89b-12d3-a456-426614174001',
                eventName: 'Event',
                organizer: 'Org',
                dateTime: new Date(),
                venue: 'Ven',
                decision: 'ACCEPTED'
            }] as any);

            const response = await request(app)
                .get('/api/pdf/tour-program')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.header['content-type']).toBe('application/pdf');
        });

        it('should return 404 if no events found', async () => {
            prisma.tourProgram.findMany.mockResolvedValue([] as any);

            const response = await request(app)
                .get('/api/pdf/tour-program')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});








