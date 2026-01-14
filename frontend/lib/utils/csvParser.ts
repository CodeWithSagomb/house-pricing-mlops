/**
 * CSV Parser Utility
 * Parses CSV files for batch predictions
 */

import { PredictionInput } from '@/lib/api';

export interface CSVParseResult {
    data: PredictionInput[];
    errors: string[];
    rowCount: number;
}

const REQUIRED_COLUMNS = [
    'MedInc',
    'HouseAge',
    'AveRooms',
    'AveBedrms',
    'Population',
    'AveOccup',
    'Latitude',
    'Longitude',
];

export function parseCSV(content: string): CSVParseResult {
    const lines = content.trim().split('\n');
    const errors: string[] = [];
    const data: PredictionInput[] = [];

    if (lines.length < 2) {
        return { data: [], errors: ['CSV must have header and at least one data row'], rowCount: 0 };
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim());

    // Check for required columns
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
        errors.push(`Missing columns: ${missingColumns.join(', ')}`);
        return { data: [], errors, rowCount: 0 };
    }

    // Get column indices
    const columnIndices = REQUIRED_COLUMNS.reduce((acc, col) => {
        acc[col] = header.indexOf(col);
        return acc;
    }, {} as Record<string, number>);

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());

        try {
            const row: PredictionInput = {
                MedInc: parseFloat(values[columnIndices.MedInc]),
                HouseAge: parseFloat(values[columnIndices.HouseAge]),
                AveRooms: parseFloat(values[columnIndices.AveRooms]),
                AveBedrms: parseFloat(values[columnIndices.AveBedrms]),
                Population: parseFloat(values[columnIndices.Population]),
                AveOccup: parseFloat(values[columnIndices.AveOccup]),
                Latitude: parseFloat(values[columnIndices.Latitude]),
                Longitude: parseFloat(values[columnIndices.Longitude]),
            };

            // Validate numeric values
            const hasNaN = Object.values(row).some((v) => isNaN(v));
            if (hasNaN) {
                errors.push(`Row ${i}: Invalid numeric values`);
                continue;
            }

            data.push(row);
        } catch {
            errors.push(`Row ${i}: Parse error`);
        }
    }

    return { data, errors, rowCount: data.length };
}

export function generateSampleCSV(): string {
    return `MedInc,HouseAge,AveRooms,AveBedrms,Population,AveOccup,Latitude,Longitude
8.3,41,6.9,1.0,322,2.5,37.88,-122.23
5.6,20,5.5,1.1,500,3.0,34.05,-118.25
3.8,35,4.2,0.9,800,2.8,33.95,-118.40`;
}
