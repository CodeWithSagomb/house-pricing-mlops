import { describe, it, expect } from 'vitest';
import { parseCSV, generateSampleCSV, CSVParseResult } from '@/lib/utils/csvParser';

describe('csvParser', () => {
    describe('parseCSV', () => {
        it('parses valid CSV with all required columns', () => {
            const csv = generateSampleCSV();
            const result = parseCSV(csv);

            expect(result.errors).toHaveLength(0);
            expect(result.rowCount).toBe(3);
            expect(result.data).toHaveLength(3);
        });

        it('extracts correct values from first row', () => {
            const csv = generateSampleCSV();
            const result = parseCSV(csv);

            expect(result.data[0]).toEqual({
                MedInc: 8.3,
                HouseAge: 41,
                AveRooms: 6.9,
                AveBedrms: 1.0,
                Population: 322,
                AveOccup: 2.5,
                Latitude: 37.88,
                Longitude: -122.23,
            });
        });

        it('returns error for missing required columns', () => {
            const csv = 'MedInc,HouseAge,AveRooms\n8.3,41,6.9';
            const result = parseCSV(csv);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Missing columns');
            expect(result.data).toHaveLength(0);
        });

        it('returns error for empty CSV', () => {
            const csv = '';
            const result = parseCSV(csv);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.rowCount).toBe(0);
        });

        it('returns error for header-only CSV', () => {
            const csv = 'MedInc,HouseAge,AveRooms,AveBedrms,Population,AveOccup,Latitude,Longitude';
            const result = parseCSV(csv);

            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('handles invalid numeric values gracefully', () => {
            const csv = `MedInc,HouseAge,AveRooms,AveBedrms,Population,AveOccup,Latitude,Longitude
8.3,41,6.9,1.0,322,2.5,37.88,-122.23
invalid,21,5.5,1.1,500,3.0,34.05,-118.25`;
            const result = parseCSV(csv);

            // First row should parse, second should error
            expect(result.data).toHaveLength(1);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('trims whitespace from values', () => {
            const csv = `MedInc,HouseAge,AveRooms,AveBedrms,Population,AveOccup,Latitude,Longitude
  8.3  ,  41  ,  6.9  ,  1.0  ,  322  ,  2.5  ,  37.88  ,  -122.23  `;
            const result = parseCSV(csv);

            expect(result.data[0].MedInc).toBe(8.3);
            expect(result.errors).toHaveLength(0);
        });

        it('skips empty lines', () => {
            const csv = `MedInc,HouseAge,AveRooms,AveBedrms,Population,AveOccup,Latitude,Longitude
8.3,41,6.9,1.0,322,2.5,37.88,-122.23

5.6,20,5.5,1.1,500,3.0,34.05,-118.25
`;
            const result = parseCSV(csv);

            expect(result.rowCount).toBe(2);
        });
    });

    describe('generateSampleCSV', () => {
        it('generates valid CSV with header and 3 rows', () => {
            const csv = generateSampleCSV();
            const lines = csv.trim().split('\n');

            expect(lines).toHaveLength(4); // header + 3 data rows
            expect(lines[0]).toContain('MedInc');
            expect(lines[0]).toContain('Longitude');
        });

        it('generates CSV that passes validation', () => {
            const csv = generateSampleCSV();
            const result = parseCSV(csv);

            expect(result.errors).toHaveLength(0);
            expect(result.rowCount).toBe(3);
        });
    });
});
