import { Coins } from 'lucide-react';
import { SalaryBreakdownResult } from './salaryCalculations';

export interface SalaryBreakdownTableProps {
  result: SalaryBreakdownResult;
  profile: string;
  sicknessDaysInMonth: number;
  strikeDaysInMonth: number;
}

export function SalaryBreakdownTable({
  result,
  profile,
  sicknessDaysInMonth,
  strikeDaysInMonth,
}: SalaryBreakdownTableProps) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
      <h4 style={{ margin: '0 0 14px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Coins size={18} color="#059669" /> Voci del Cedolino NoiPA & Ritenute di Legge (Fascia {result.fascia})
      </h4>

      <table className="salary-breakdown-table">
        <thead>
          <tr>
            <th>Voce Cedolino</th>
            <th>Descrizione e Riferimento Normativo</th>
            <th style={{ textAlign: 'right' }}>Importo Mensile</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Stipendio Tabellare (Fascia {result.fascia} anni)</strong></td>
            <td className="muted">Retribuzione base CCNL 2024 per anzianità maturata</td>
            <td style={{ textAlign: 'right' }}>+ € {result.baseSalary.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>{profile === 'DOCENTE' ? 'RPD' : 'CIA'}</strong></td>
            <td className="muted">{profile === 'DOCENTE' ? 'Retribuzione Professionale Docenti' : 'Compenso Individuale Accessorio ATA'}</td>
            <td style={{ textAlign: 'right' }}>+ € {result.ciaOrRpd.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Indennità Vacanza Contrattuale</strong></td>
            <td className="muted">Elemento perequativo / anticipazione contrattuale</td>
            <td style={{ textAlign: 'right' }}>+ € {result.ivc.toFixed(2)}</td>
          </tr>

          {result.sicknessDeductions > 0 && (
            <tr>
              <td style={{ color: '#ef4444' }}><strong>Trattenute per Malattia</strong></td>
              <td className="muted">
                {result.sicknessRuleApplied} ({sicknessDaysInMonth} gg)
              </td>
              <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.sicknessDeductions.toFixed(2)}</td>
            </tr>
          )}

          {result.strikeDeductions > 0 && (
            <tr>
              <td style={{ color: '#ef4444' }}><strong>Trattenuta Sciopero</strong></td>
              <td className="muted">Decurtazione per astensione dal lavoro ({strikeDaysInMonth} gg)</td>
              <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.strikeDeductions.toFixed(2)}</td>
            </tr>
          )}

          <tr>
            <td><strong>Ritenuta Previdenziale INPS</strong></td>
            <td className="muted">Contributi IVS fondo pensione a carico dipendente (9.15%)</td>
            <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.inpsPensionContribution.toFixed(2)}</td>
          </tr>

          <tr>
            <td><strong>IRPEF Netta Mensile</strong></td>
            <td className="muted">IRPEF lorda (€ {result.irpefGross.toFixed(2)}) al netto detrazione lavoro (€ {result.employmentTaxCredit.toFixed(2)})</td>
            <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.irpefNet.toFixed(2)}</td>
          </tr>

          <tr>
            <td><strong>Addizionale Regionale & Comunale</strong></td>
            <td className="muted">Aliquote medie stimate (Regionale 1.73%, Comunale 0.80%)</td>
            <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {(result.regionalTax + result.municipalTax).toFixed(2)}</td>
          </tr>

          {result.cuneoTaxRelief > 0 && (
            <tr>
              <td style={{ color: '#10b981' }}><strong>Esonero Contributivo (Cuneo Fiscale)</strong></td>
              <td className="muted">Sgravio contributivo del 6% o 7% a sostegno dei redditi medio-bassi</td>
              <td style={{ textAlign: 'right' }} className="salary-credit-badge">+ € {result.cuneoTaxRelief.toFixed(2)}</td>
            </tr>
          )}

          <tr>
            <td><strong>NETTO IN BUSTA PAGA</strong></td>
            <td className="muted">Stipendio effettivo accreditato sul conto corrente tramite NoiPA</td>
            <td style={{ textAlign: 'right', fontSize: 16, color: '#059669' }}>€ {result.monthlyNetSalary.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
