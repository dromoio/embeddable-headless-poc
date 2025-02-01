// Base interface for the standard fields
interface BaseRowData {
  id: string;
  diagnosisCode1?: string | number;
  diagnosisCode2?: string | number;
  diagnosisCode3?: string | number;
  diagnosisCode4?: string | number;
  diagnosisCode5?: string | number;
  diagnosisCode6?: string | number;
  diagnosisCode7?: string | number;
  diagnosisCode8?: string | number;
  diagnosisCode9?: string | number;
}

// Extended interface that includes the index signature
export interface RowData extends BaseRowData {
  [key: string]: string | number | boolean | undefined;
}

// Internal type used during merging process
interface MergedRow extends BaseRowData {
  _diagnosisCodes: (string | number)[];
  [key: string]: string | number | boolean | undefined | (string | number)[];
}

export function mergeRowsById(rows: RowData[]): RowData[] {
  const mergedData = rows.reduce<Record<string, MergedRow>>((acc, row) => {
    const id = row.id;

    if (!acc[id]) {
      // Keep first occurrence of the row as base and initialize diagnosis codes array
      acc[id] = { ...row, _diagnosisCodes: [] } as MergedRow;
    }

    // Collect non-empty diagnosis codes
    for (let i = 1; i <= 9; i++) {
      const code = row[`diagnosisCode${i}`];
      if (
        code !== undefined &&
        code !== null &&
        code !== "" &&
        typeof code !== "boolean"
      ) {
        acc[id]._diagnosisCodes.push(code);
      }
    }

    return acc;
  }, {});

  // Convert back to array and spread diagnosis codes into columns
  return Object.values(mergedData).map((row) => {
    const { _diagnosisCodes, ...finalRow } = row;

    // Clear existing diagnosis code fields
    for (let i = 1; i <= 9; i++) {
      finalRow[`diagnosisCode${i}`] = undefined;
    }

    // Spread collected codes back into numbered fields
    _diagnosisCodes.forEach((code, index) => {
      if (index < 9) {
        finalRow[`diagnosisCode${index + 1}`] = code;
      }
    });

    return finalRow as RowData;
  });
}
