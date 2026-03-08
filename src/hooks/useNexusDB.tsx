import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

// --- Schema Definitions ---
export interface NexusSchema {
  id: string;      // Database ID
  name: string;    // Database Name
  icon: string;
}

export interface NexusField {
  id: string;
  databaseId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'relation';
  options?: string[]; // For 'select' type
}

export interface NexusRow {
  id: string;
  databaseId: string;
  createdAt: number;
  // Dynamic fields stored as a record
  data: Record<string, any>;
}

// --- Dexie Database Setup ---
class NexusDatabaseEngine extends Dexie {
  databases!: Table<NexusSchema, string>;
  fields!: Table<NexusField, string>;
  rows!: Table<NexusRow, string>;

  constructor() {
    super('NexusEngineDB');
    this.version(1).stores({
      databases: 'id, name',
      fields: 'id, databaseId, name, type',
      rows: 'id, databaseId, createdAt'
    });
  }
}

export const db = new NexusDatabaseEngine();

// --- Hook for Components ---
export function useNexusDB(databaseId?: string) {
  // Global
  const allDatabases = useLiveQuery(() => db.databases.toArray(), []) || [];
  
  // Scoped to specific DB
  const currentDB = useLiveQuery(() => databaseId ? db.databases.get(databaseId) : undefined, [databaseId]);
  const fields = useLiveQuery(() => databaseId ? db.fields.where('databaseId').equals(databaseId).toArray() : [], [databaseId]) || [];
  const rows = useLiveQuery(() => databaseId ? db.rows.where('databaseId').equals(databaseId).sortBy('createdAt') : [], [databaseId]) || [];

  return {
    dbEngine: db,
    allDatabases,
    currentDB,
    fields,
    rows
  };
}
