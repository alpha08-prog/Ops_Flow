import {
    getQueryString,
    getParamString,
    parsePagination,
    getPagination,
    calculatePaginationMeta,
    getPaginatedResponse
} from './pagination';

describe('Pagination Utils', () => {
    describe('getQueryString', () => {
        it('should extract string from array', () => {
            expect(getQueryString(['val1', 'val2'])).toBe('val1');
        });
        it('should return string as is', () => {
            expect(getQueryString('value')).toBe('value');
        });
        it('should return undefined for undefined', () => {
            expect(getQueryString(undefined)).toBeUndefined();
        });
    });

    describe('getParamString', () => {
        it('should extract string from array or return empty', () => {
            expect(getParamString(['val1'])).toBe('val1');
            expect(getParamString([])).toBe('');
        });
        it('should return string as is', () => {
            expect(getParamString('value')).toBe('value');
        });
        it('should return empty string for undefined', () => {
            expect(getParamString(undefined)).toBe('');
        });
    });

    describe('parsePagination', () => {
        it('should return default pagination when no queries provided', () => {
            const result = parsePagination({});
            expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
        });

        it('should parse valid string inputs', () => {
            const result = parsePagination({ page: '2', limit: '20' });
            expect(result).toEqual({ page: 2, limit: 20, skip: 20 });
        });

        it('should enforce maximum limit of 100', () => {
            const result = parsePagination({ page: '1', limit: '200' });
            expect(result.limit).toBe(100);
        });

        it('should enforce minimum page and limit of 1', () => {
            const result = parsePagination({ page: '0', limit: '-5' });
            expect(result).toEqual({ page: 1, limit: 1, skip: 0 });
        });
    });

    describe('getPagination', () => {
        it('should alias parsePagination correctly', () => {
            const result = getPagination({ page: '3', limit: '15' });
            expect(result).toEqual({ page: 3, limit: 15, skip: 30 });
        });
    });

    describe('calculatePaginationMeta', () => {
        it('should calculate metadata correctly', () => {
            const result = calculatePaginationMeta(55, 2, 10);
            expect(result).toEqual({
                page: 2,
                limit: 10,
                total: 55,
                totalPages: 6
            });
        });
    });

    describe('getPaginatedResponse', () => {
        it('should format paginated response correctly', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = getPaginatedResponse(data, 12, 1, 2);
            expect(result).toEqual({
                success: true,
                data,
                pagination: {
                    page: 1,
                    limit: 2,
                    total: 12,
                    totalPages: 6
                }
            });
        });
    });
});
