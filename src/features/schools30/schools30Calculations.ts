import { DirectoryEntry } from '../directory/DirectoryPicker';

export interface SelectedSchoolItem {
  id: string;
  code: string;
  name: string;
  municipality: string;
  province: string;
  typeCategory: 'ic' | 'superiore' | 'liceo' | 'altro';
  address?: string;
  orderNumber: number; // 1 to 30
}

export interface ConvocationItem {
  id: string;
  date: string;
  schoolName: string;
  schoolCode?: string;
  profile: string;
  contractType: string; // '30_giugno' | '31_agosto' | 'breve' | 'spezzone'
  hours: number;
  status: 'accepted' | 'refused' | 'pending';
  notes?: string;
}

export function detectSchoolCategory(name: string, code: string): 'ic' | 'superiore' | 'liceo' | 'altro' {
  const n = (name + ' ' + code).toLowerCase();
  if (n.includes('comprensivo') || n.includes('i.c.') || n.startsWith('ic ') || code.startsWith('IC')) {
    return 'ic';
  }
  if (n.includes('liceo') || code.includes('PS') || code.includes('PC')) {
    return 'liceo';
  }
  if (
    n.includes('tecnico') ||
    n.includes('professionale') ||
    n.includes('i.i.s.') ||
    n.includes('iis') ||
    n.includes('industriale') ||
    n.includes('commerciale') ||
    n.includes('alberghiero') ||
    code.startsWith('IS')
  ) {
    return 'superiore';
  }
  return 'altro';
}

export function parseSchools30FromNotes(notes?: string | null): {
  selectedSchools: SelectedSchoolItem[];
  convocations: ConvocationItem[];
} {
  if (!notes) return { selectedSchools: [], convocations: [] };
  try {
    if (notes.startsWith('{')) {
      const parsed = JSON.parse(notes);
      return {
        selectedSchools: Array.isArray(parsed.selectedSchools) ? parsed.selectedSchools : [],
        convocations: Array.isArray(parsed.convocations) ? parsed.convocations : [],
      };
    }
  } catch {
    // fallback
  }
  return { selectedSchools: [], convocations: [] };
}
