const MONTH_MAP: Record<string, string> = {
  A: '01',
  B: '02',
  C: '03',
  D: '04',
  E: '05',
  H: '06',
  L: '07',
  M: '08',
  P: '09',
  R: '10',
  S: '11',
  T: '12',
};

export interface DecodedFiscalCode {
  gender: 'male' | 'female';
  birthDate: string;
  cadastralCode: string;
}

export function decodeFiscalCode(cf: string): DecodedFiscalCode | null {
  const clean = cf.trim().toUpperCase();
  if (!/^[A-Z]{6}[0-9]{2}[ABCDEHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(clean)) {
    return null;
  }

  const rawYear = parseInt(clean.slice(6, 8), 10);
  const currentYear2Digit = new Date().getFullYear() % 100;
  const fullYear = rawYear > currentYear2Digit ? 1900 + rawYear : 2000 + rawYear;

  const monthChar = clean[8];
  const month = MONTH_MAP[monthChar];
  if (!month) return null;

  let rawDay = parseInt(clean.slice(9, 11), 10);
  let gender: 'male' | 'female' = 'male';
  if (rawDay > 40) {
    gender = 'female';
    rawDay -= 40;
  }
  if (rawDay < 1 || rawDay > 31) return null;

  const dayStr = String(rawDay).padStart(2, '0');
  const birthDate = `${fullYear}-${month}-${dayStr}`;
  const cadastralCode = clean.slice(11, 15);

  return { gender, birthDate, cadastralCode };
}
