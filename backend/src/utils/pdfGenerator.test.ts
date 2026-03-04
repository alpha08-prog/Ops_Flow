import { Response } from 'express';
import { generateTrainEQLetter, generateGrievanceLetter, generateTourProgramPDF, generateGenericLetter } from './pdfGenerator';

jest.mock('pdfkit', () => {
    return jest.fn().mockImplementation(() => ({
        page: { width: 600, height: 800 },
        x: 0,
        y: 0,
        opacity: jest.fn().mockReturnThis(),
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        fillColor: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        translate: jest.fn().mockReturnThis(),
        rotate: jest.fn().mockReturnThis(),
        save: jest.fn().mockReturnThis(),
        restore: jest.fn().mockReturnThis(),
        rect: jest.fn().mockReturnThis(),
        fill: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        addPage: jest.fn().mockReturnThis(),
        pipe: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
    }));
});

describe('PDF Generator Utils', () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockRes = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('generateTrainEQLetter', () => {
        it('should set headers and pipe to response', () => {
            const data = {
                refNumber: 'REF123',
                date: '2023-01-01',
                passengerName: 'John Doe',
                pnrNumber: 'PNR123',
                trainNumber: '12345',
                trainName: 'Express',
                journeyDate: '2023-02-01',
                journeyClass: '3A',
                fromStation: 'Delhi',
                toStation: 'Mumbai',
                senderName: 'Sender',
                senderDesignation: 'MP'
            };

            generateTrainEQLetter(data, mockRes as Response);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                expect.stringContaining('attachment; filename=TrainEQ_PNR123_')
            );
        });
    });

    describe('generateGrievanceLetter', () => {
        it('should set headers and pipe to response', () => {
            const data = {
                refNumber: 'GRV123',
                date: '2023-01-01',
                petitionerName: 'John Doe',
                mobileNumber: '1234567890',
                constituency: 'South Delhi',
                grievanceType: 'Water',
                description: 'No water',
                actionRequired: 'Fix pipe',
                toOfficial: 'Commissioner',
                toDesignation: 'DJB',
                toDepartment: 'Water',
                senderName: 'Sender',
                senderDesignation: 'MP'
            };

            generateGrievanceLetter(data, mockRes as Response);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        });
    });

    describe('generateTourProgramPDF', () => {
        it('should set headers and pipe to response', () => {
            generateTourProgramPDF([], 'Jan 2023', mockRes as Response);
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        });
    });

    describe('generateGenericLetter', () => {
        it('should set headers and pipe to response', () => {
            const config = {
                refNumber: 'GEN123',
                date: '2023-01-01',
                to: 'Someone',
                subject: 'General',
                body: ['Line 1'],
                senderName: 'Sender',
                senderDesignation: 'MP',
                senderOffice: 'Office'
            };

            generateGenericLetter(config, mockRes as Response);
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        });
    });
});
