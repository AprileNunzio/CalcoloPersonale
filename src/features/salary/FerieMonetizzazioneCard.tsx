import { useState } from 'react';
import { Calendar, AlertCircle, Printer, CheckCircle2, Info } from 'lucide-react';
import { Person } from '../../shared/types';
import { ContractCategory } from './salaryTables';
import { calculateFerieMonetizzazione } from './careerProgressionCalculations';

export interface FerieMonetizzazioneCardProps {
  person: Person;
  profile: string;
  contractCategory?: ContractCategory;
}

export function FerieMonetizzazioneCard({ person, profile, contractCategory }: FerieMonetizzazioneCardProps) {
  const [giorniFruiti, setGiorniFruiti] = useState<number>(10);
  const result = calculateFerieMonetizzazione(person, profile, giorniFruiti, contractCategory);

  const generateDiffidaText = () => {
    const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    return `RACCOMANDATA A/R / TRASMISSIONE A MEZZO P.E.C.

OGGETTO: DIFFIDA E MESSA IN MORA PER IL PAGAMENTO DELL'INDENNITÀ SOSTITUTIVA DELLE FERIE NON GODUTE
PERSONALE A.T.A. A TEMPO DETERMINATO - ANNO SCOLASTICO DI RIFERIMENTO
RIF. ORDINANZA CORTE DI CASSAZIONE N. 16715/2024 E CORTE DI GIUSTIZIA UE (CAUSE RIUNITE C-569/16 E C-570/16)

Al Dirigente Scolastico dell'Istituto Scolastico di Servizio: _________________________________________
Indirizzo PEC Istituzione Scolastica: _________________________________________

Il/La sottoscritto/a:
Cognome e Nome: ${person.lastName} ${person.firstName}
Codice Fiscale: ${person.fiscalCode}
Profilo Professionale: ${profile}
In servizio nell'anno scolastico con contratto a tempo determinato (${result.contractCategory === 'short' ? 'supplenza breve' : 'fino al termine delle attività didattiche'});

PREMESSO CHE
- Il/La sottoscritto/a ha prestato servizio a tempo determinato per un totale di ${result.totalServiceDaysInYear} giorni;
- In base al CCNL di comparto (Art. 13 e Art. 19 CCNL 18/01/2024), il monte ferie e festività soppresse maturato ammonta complessivamente a n. ${result.totalSpettanti} giorni (pro-rata su base ${result.yearlyBaseDays} giorni/anno);
- Durante il periodo di sospensione delle lezioni (vacanze di Natale, Pasqua, ponti) sono stati fruiti esclusivamente n. ${result.giorniFruitiSospensioneLezioni} giorni;
- Risultano pertanto non goduti alla data di cessazione contrattuale n. ${result.giorniResiduiNonGoduti} GIORNI DI FERIE;

CONSIDERATO CHE
- La giurisprudenza unionale e la consolidata giurisprudenza della Suprema Corte di Cassazione (da ultimo Ordinanza Sez. Lavoro n. 16715 del 17 giugno 2024) hanno chiarito che il divieto di monetizzazione ex art. 5 comma 8 D.L. 95/2012 non trova applicazione quando il dipendente a tempo determinato non sia stato formalmente e per iscritto invitato dal datore di lavoro a fruire delle ferie con espresso avviso della loro perdita economica in caso di mancata fruizione;
- Nessun formale invito scritto di tal tenore è mai stato notificato al/alla sottoscritto/a nel corso del rapporto;
- L'indennità sostitutiva spettante ammonta a € ${result.indennitaMonetizzazioneLorda.toFixed(2)} lordi (€ ${result.dailyRateGross.toFixed(2)} / die);

Tutto ciò premesso e considerato, il/la sottoscritto/a

DIFFIDA E METTE IN MORA
la S.V. in intestazione, ai sensi e per gli effetti dell'art. 1219 del Codice Civile, a provvedere entro e non oltre 15 (quindici) giorni dal ricevimento della presente al pagamento in busta paga o a mezzo cedolino speciale dell'importo lordo di € ${result.indennitaMonetizzazioneLorda.toFixed(2)}, oltre rivalutazione monetaria e interessi legali dal dovuto al saldo.

Con espressa riserva, in difetto, di adire la competente autorità giudiziaria in funzione di Giudice del Lavoro con aggravio di spese legali a carico dell'Amministrazione.

Data: ${today}

Firma del Dipendente: _________________________________________
`;
  };

  const handlePrintDiffida = () => {
    const text = generateDiffidaText();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Diffida Ferie Non Godute - ${person.lastName} ${person.firstName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 40px; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 18, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Calendar size={20} color="#059669" /> Ferie e Monetizzazione ({result.contractCategory === 'permanent' ? 'Tempo Indeterminato' : result.contractCategory === 'annual' ? 'Annuale 31/08' : result.contractCategory === 'short' ? 'Supplenza Breve' : 'Termine Attività 30/06'})
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Rif. CCNL 18/01/2024 Art. 13 & 19 - Ordinanza Corte di Cassazione n. 16715/2024.
          </span>
        </div>

        {result.isEligibleForMonetizzazione && (
          <button
            type="button"
            className="secondary"
            onClick={handlePrintDiffida}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', borderColor: '#a7f3d0' }}
          >
            <Printer size={15} /> Genera Diffida per Liquidazione
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Ferie + Festività Spettanti</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
            {result.totalSpettanti} gg
          </div>
          <small style={{ fontSize: 10, color: '#64748b' }}>
            {result.ferieMaturate} ferie + {result.festivitaSoppresseMaturate} fest. soppresse
          </small>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Giorni Fruiti a Scuola Chiusa</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="number"
              min={0}
              max={30}
              value={giorniFruiti}
              onChange={e => setGiorniFruiti(Math.max(0, Number(e.target.value)))}
              style={{ width: 60, padding: '4px 6px', fontSize: 14, fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
            <span style={{ fontSize: 13, color: '#475569' }}>giorni</span>
          </div>
          <small style={{ fontSize: 10, color: '#64748b' }}>Sospensione lezioni / ponti</small>
        </div>

        <div style={{ background: result.giorniResiduiNonGoduti > 0 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${result.giorniResiduiNonGoduti > 0 ? '#a7f3d0' : '#e2e8f0'}`, padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: result.giorniResiduiNonGoduti > 0 ? '#065f46' : '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Ferie Residue Non Godute</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: result.giorniResiduiNonGoduti > 0 ? '#059669' : '#0f172a', marginTop: 4 }}>
            {result.giorniResiduiNonGoduti} gg
          </div>
          <small style={{ fontSize: 10, color: '#64748b' }}>
            {result.isEligibleForMonetizzazione ? 'Liquidabili alla cessazione' : 'Da fruire in natura'}
          </small>
        </div>

        <div style={{ background: result.isEligibleForMonetizzazione ? '#eff6ff' : '#f1f5f9', border: `1px solid ${result.isEligibleForMonetizzazione ? '#bfdbfe' : '#cbd5e1'}`, padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: result.isEligibleForMonetizzazione ? '#1e40af' : '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Monetizzazione Spettante</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: result.isEligibleForMonetizzazione ? '#1d4ed8' : '#64748b', marginTop: 4 }}>
            {result.isEligibleForMonetizzazione ? `€ ${result.indennitaMonetizzazioneLorda.toFixed(2)}` : 'Non monetizzabile'}
          </div>
          <small style={{ fontSize: 10, color: result.isEligibleForMonetizzazione ? '#1e40af' : '#64748b' }}>
            {result.isEligibleForMonetizzazione ? `Netta stimata: ~€ ${result.indennitaMonetizzazioneNetta.toFixed(2)}` : 'Fruizione obbligatoria in servizio'}
          </small>
        </div>
      </div>

      <div style={{ background: result.isEligibleForMonetizzazione ? '#fffbeb' : '#f8fafc', border: `1px solid ${result.isEligibleForMonetizzazione ? '#fde68a' : '#e2e8f0'}`, borderRadius: 8, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {result.isEligibleForMonetizzazione ? (
          <AlertCircle color="#d97706" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        ) : (
          <Info color="#2563eb" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        )}
        <div style={{ fontSize: 11.5, color: result.isEligibleForMonetizzazione ? '#92400e' : '#334155', lineHeight: 1.5 }}>
          <strong>Regime Giuridico Ferie Applicato:</strong>
          <div style={{ marginTop: 2 }}>{result.legalNote}</div>
        </div>
      </div>
    </div>
  );
}
