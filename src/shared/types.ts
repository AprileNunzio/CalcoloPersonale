import type { DirectoryEntry } from '../features/directory/DirectoryPicker';
export type Entry = { id: string; kind: string; school?: DirectoryEntry | null; title: string; start: string; end: string | null; amount: number | null; notes: string };
export type Person = { id: string; firstName: string; lastName: string; gender: string; birthDate: string | null; fiscalCode: string; profile: string; municipality?: DirectoryEntry | null; records: Entry[] };
export type Archive = { revision: number; people: Person[]; drafts: Record<string, unknown> };
export type Analysis = { schoolYear: number; serviceDays: number; recordedAbsenceDays: number; qualifications: number; score: number | null; children: { name: string; age: number }[]; warnings: string[] };
