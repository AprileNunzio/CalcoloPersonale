import { SchoolYearServiceBreakdown } from '../../shared/scoring';

interface SchoolYearBreakdownTableProps {
  breakdowns: SchoolYearServiceBreakdown[];
  baseAccessScore: number;
  culturalScore: number;
  specificServiceScore: number;
  otherServiceScore: number;
  isIncremental?: boolean;
}

export function SchoolYearBreakdownTable({
  breakdowns,
  baseAccessScore,
  culturalScore,
  specificServiceScore,
  otherServiceScore,
  isIncremental,
}: SchoolYearBreakdownTableProps) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6, lineHeight: 1.6 }}>
        {isIncremental ? (
          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            • Modalità Incrementale: i titoli di accesso e i servizi storici sono inclusi nella Base Convalidata. Di seguito sono esposti solo i servizi e i titoli maturati successivamente:
          </span>
        ) : (
          <>
            • Titolo d’Accesso in decimi: <strong>{baseAccessScore.toFixed(2)} pt</strong>
            <br />
            • Titoli Culturali e Certificazioni: <strong>{culturalScore.toFixed(2)} pt</strong>
            <br />
            • Servizio Specifico Netto: <strong>{specificServiceScore.toFixed(2)} pt</strong>
            <br />
            • Altro Servizio/Docente Netto: <strong>{otherServiceScore.toFixed(2)} pt</strong>
          </>
        )}
      </div>

      {breakdowns.length > 0 ? (
        <div className="val-sy-table-wrap">
          <table className="val-sy-table">
            <thead>
              <tr>
                <th>Anno Scolastico</th>
                <th>Giorni</th>
                <th>Mesi Utili</th>
                <th>Punti Specifici</th>
                <th>Altri Punti</th>
                <th>Punti Anno</th>
                <th>Stato Tetto Max 6 pt</th>
              </tr>
            </thead>
            <tbody>
              {breakdowns.map(sy => (
                <tr key={sy.schoolYear}>
                  <td><strong>{sy.schoolYear}</strong></td>
                  <td>{sy.days} gg</td>
                  <td>{sy.months} mesi</td>
                  <td>{sy.specificScore.toFixed(2)}</td>
                  <td>{sy.otherScore.toFixed(2)}</td>
                  <td><strong>{sy.cappedScore.toFixed(2)} pt</strong></td>
                  <td>
                    {sy.isCapped ? (
                      <span className="capped-tag">
                        Applicato tetto 6.00 pt (lordi: {sy.totalAnnualScore.toFixed(2)})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Entro il limite</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontStyle: 'italic', marginTop: 4 }}>
          {isIncremental
            ? 'Nessun nuovo servizio registrato successivamente alla data di consolidamento.'
            : 'Nessun servizio scolastico registrato per questo profilo.'}
        </div>
      )}
    </div>
  );
}
