export type SalaryFascia = '0-8' | '9-14' | '15-20' | '21-27' | '28-34' | '35+';

export type ContractCategory = 'permanent' | 'annual' | 'term' | 'short';

export const CCNL_TABLES: Record<string, Record<SalaryFascia, number>> = {
  CS: {
    '0-8': 1358.50,
    '9-14': 1472.30,
    '15-20': 1558.10,
    '21-27': 1642.80,
    '28-34': 1714.60,
    '35+': 1761.90,
  },
  OS: {
    '0-8': 1412.30,
    '9-14': 1538.00,
    '15-20': 1632.00,
    '21-27': 1725.00,
    '28-34': 1802.00,
    '35+': 1854.00,
  },
  AA: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  AT: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  CU: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  GU: {
    '0-8': 1412.30,
    '9-14': 1538.00,
    '15-20': 1632.00,
    '21-27': 1725.00,
    '28-34': 1802.00,
    '35+': 1854.00,
  },
  CR: {
    '0-8': 1358.50,
    '9-14': 1472.30,
    '15-20': 1558.10,
    '21-27': 1642.80,
    '28-34': 1714.60,
    '35+': 1761.90,
  },
  DOCENTE: {
    '0-8': 1680.00,
    '9-14': 1890.00,
    '15-20': 2080.00,
    '21-27': 2260.00,
    '28-34': 2410.00,
    '35+': 2530.00,
  },
};

export const CIA_IVC_TABLE: Record<string, { cia: number; ivc: number }> = {
  CS: { cia: 79.40, ivc: 9.10 },
  OS: { cia: 79.40, ivc: 9.45 },
  AA: { cia: 79.40, ivc: 10.00 },
  AT: { cia: 79.40, ivc: 10.00 },
  CU: { cia: 79.40, ivc: 10.00 },
  GU: { cia: 79.40, ivc: 9.45 },
  CR: { cia: 79.40, ivc: 9.10 },
  DOCENTE: { cia: 174.50, ivc: 11.20 },
};

export const FASCIA_LIMITS: { fascia: SalaryFascia; minYears: number; maxYears: number }[] = [
  { fascia: '0-8', minYears: 0, maxYears: 8 },
  { fascia: '9-14', minYears: 9, maxYears: 14 },
  { fascia: '15-20', minYears: 15, maxYears: 20 },
  { fascia: '21-27', minYears: 21, maxYears: 27 },
  { fascia: '28-34', minYears: 28, maxYears: 34 },
  { fascia: '35+', minYears: 35, maxYears: 99 },
];
