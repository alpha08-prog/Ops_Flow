import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock deep PrismaClient
const prismaMock = mockDeep<PrismaClient>();

export default prismaMock;
export const prisma = prismaMock;

export const withRetry = jest.fn().mockImplementation(async (fn) => {
    return await fn();
});
