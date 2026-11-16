import { useState } from 'react';
import { Award, GraduationCap, CheckCircle2, Info } from 'lucide-react';
import { FormField } from '../../shared/FormField';

export interface QualificationPresetData {
  title: string;
  amount: number | null;
  notes: string;
  profile?: string | null;
}

interface QualificationPresetSelectorProps {
  initialTitle: string;
  initialAmount: number | null;
  initialNotes: string;
  profile?: string | null;
  onChange: (data: QualificationPresetData) => void;
}

export function QualificationPresetSelector({
  initialTitle,
  initialAmount,
  initialNotes,
  profile,
  onChange,
}: QualificationPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    const t = initialTitle.toLowerCase();
    if (t.includes('ciad') || t.includes('alfabetizzazione')) return 'ciad';
    if (t.includes('dattilografia')) return 'typing';
    if (t.includes('diploma') || t.includes('maturit') || t.includes('accesso') || initialNotes.includes('isAccessTitle')) return 'diploma';
    if (t.includes('eipass') || t.includes('icdl') || t.includes('ecdl') || t.includes('digcomp') || t.includes('informatica')) return 'digital';
    if (t.includes('laurea')) return 'degree';
    if (t.includes('concorso')) return 'contest';
    return initialTitle ? 'custom' : 'diploma';
  });

  const [scoreAchieved, setScoreAchieved] = useState<number>(80);
  const [scoreBase, setScoreBase] = useState<number>(100);
  const [hasHonors, setHasHonors] = useState<boolean>(false);

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);

    if (presetKey === 'diploma') {
      const pts = Number(((scoreAchieved / (scoreBase || 100)) * 10).toFixed(2));
      onChange({
        title: `Diploma di Scuola Secondaria (${scoreAchieved}/${scoreBase}${hasHonors ? ' con Lode' : ''})`,
        amount: pts,
        notes: JSON.stringify({
          isAccessTitle: true,
          scoreAchieved,
          scoreBase,
          hasHonors,
          calculatedPoints: pts,
        }),
      });
    } else if (presetKey === 'ciad') {
      onChange({
        title: 'Certificazione Internazionale di Alfabetizzazione Digitale (CIAD - Reg. Accredia)',
        amount: 0,
        notes: JSON.stringify({
          isCiad: true,
          notesText: 'Requisito di accesso obbligatorio ai sensi del CCNL 18/01/2024.',
        }),
      });
    } else if (presetKey === 'typing') {
      onChange({
        title: 'Attestato di Addestramento Professionale per la Dattilografia',
        amount: 1.0,
        notes: JSON.stringify({
          kind: 'typing',
          calculatedPoints: 1.0,
          notesText: 'Valutabile 1.00 punto per il profilo di Assistente Amministrativo (AA).',
        }),
      });
    } else if (presetKey === 'digital') {
      const pts = profile === 'CS' ? 0.30 : 0.60;
      onChange({
        title: 'Certificazione Informatica (EIPASS 7 Moduli / ICDL / DigComp)',
        amount: pts,
        notes: JSON.stringify({
          kind: 'digital',
          calculatedPoints: pts,
          notesText: 'Certificazione informatica aggiuntiva (max 1 valutabile da tabella ministeriale).',
        }),
      });
    } else if (presetKey === 'degree') {
      onChange({
        title: 'Diploma di Laurea (Triennale o Magistrale)',
        amount: 2.0,
        notes: JSON.stringify({
          kind: 'degree',
          calculatedPoints: 2.0,
          notesText: 'Titolo culturale valutabile 2.00 punti (AA/AT).',
        }),
      });
    } else if (presetKey === 'contest') {
      onChange({
        title: 'Idoneità conseguita in Concorso Pubblico per il profilo',
        amount: 1.0,
        notes: JSON.stringify({
          kind: 'contest',
          calculatedPoints: 1.0,
          notesText: 'Idoneità in concorso pubblico per esami/titoli a posti del medesimo profilo o superiore.',
        }),
      });
    }
  };

  const handleScoreChange = (achieved: number, base: number, honors: boolean) => {
    setScoreAchieved(achieved);
    setScoreBase(base);
    setHasHonors(honors);
    const pts = Number(((achieved / (base || 100)) * 10).toFixed(2));
    onChange({
      title: `Diploma di Scuola Secondaria (${achieved}/${base}${honors ? ' con Lode' : ''})`,
      amount: pts,
      notes: JSON.stringify({
        isAccessTitle: true,
        scoreAchieved: achieved,
        scoreBase: base,
        hasHonors: honors,
        calculatedPoints: pts,
      }),
    });
  };

  return (
    <div className="qualification-preset-block" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12 }}>
      <FormField label="Seleziona Modello Titolo / Certificazione ATA" tip="Scegli un modello preimpostato per calcolare automaticamente il punteggio ministeriale ed evitare errori di digitazione.">
        <select
          value={selectedPreset}
          onChange={e => applyPreset(e.target.value)}
          style={{ fontWeight: 600, color: '#1e293b' }}
        >
          <option value="diploma">🎓 Diploma di Maturità / Titolo di Accesso (Calcolo voto ministeriale)</option>
          <option value="ciad">⭐ CIAD - Certificazione Alfabetizzazione Digitale (Requisito Obbligatorio CCNL 2024)</option>
          <option value="typing">⌨️ Corso di Addestramento alla Dattilografia (+1.00 pt per AA)</option>
          <option value="digital">💻 Certificazione Informatica (EIPASS / ICDL / DigComp / Pekit) (+0.60 pt AA/AT, +0.30 CS)</option>
          <option value="degree">🏛️ Diploma di Laurea Triennale / Magistrale (+2.00 pt)</option>
          <option value="contest">🏆 Idoneità in Concorso Pubblico (+1.00 pt)</option>
          <option value="custom">✏️ Altro titolo o attestato personalizzato</option>
        </select>
      </FormField>

      {selectedPreset === 'diploma' && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center', background: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              Voto Conseguito
            </label>
            <input
              type="number"
              min={1}
              max={scoreBase || 100}
              value={scoreAchieved}
              onChange={e => handleScoreChange(parseFloat(e.target.value) || 0, scoreBase, hasHonors)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              Base del Voto
            </label>
            <select
              value={scoreBase}
              onChange={e => handleScoreChange(scoreAchieved, parseInt(e.target.value, 10), hasHonors)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value={100}>in centesimi (100/100)</option>
              <option value={60}>in sessantesimi (60/60)</option>
              <option value={10}>in decimi (10/10)</option>
              <option value={110}>in centodieci (110/110)</option>
            </select>
          </div>

          <div style={{ textAlign: 'center', paddingLeft: 8 }}>
            <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>Punteggio Decimi</span>
            <strong style={{ fontSize: 18, color: '#059669' }}>
              {((scoreAchieved / (scoreBase || 100)) * 10).toFixed(2)} pt
            </strong>
          </div>
        </div>
      )}

      {selectedPreset === 'ciad' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#0369a1', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Info size={16} />
          <span>
            <strong>Requisito di Accesso Obbligatorio:</strong> Il CIAD non attribuisce punteggio numerico aggiuntivo ma è indispensabile per la validità della domanda ATA (CCNL 18 gennaio 2024).
          </span>
        </div>
      )}
    </div>
  );
}
