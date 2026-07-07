export interface TableData {
  id: string;
  tableName: string;
  headers: string[];
  rows: string[][];
  fileName?: string;
  fileSize?: string;
  thumbnail?: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface CellSelection {
  rowIndex: number;
  colIndex: number;
}
