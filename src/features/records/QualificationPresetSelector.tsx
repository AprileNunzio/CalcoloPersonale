import { useState } from 'react';
import { Award, GraduationCap, CheckCircle2, Info, Laptop, Languages, HeartPulse, Keyboard } from 'lucide-react';
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
    if (t.includes('oss') || t.includes('operatore socio')) return 'oss';
    if (t.includes('lingua') || t.includes('qcer') || t.includes('cambridge') || t.includes('b2') || t.includes('c1') || t.includes('c2')) return 'language';
    if (t.includes('diploma') || t.includes('maturit') || t.includes('accesso') || initialNotes.includes('isAccessTitle')) return 'diploma';
    if (t.includes('eipass') || t.includes('icdl') || t.includes('ecdl') || t.includes('digcomp') || t.includes('informatica')) return 'digital';
    if (t.includes('laurea')) return 'degree';
    if (t.includes('concorso')) return 'contest';
    return initialTitle ? 'custom' : 'diploma';
  });

  const [scoreAchieved, setScoreAchieved] = useState<number>(80);
  const [scoreBase, setScoreBase] = useState<number>(100);
  const [hasHonors, setHasHonors] = useState<boolean>(false);
  const [ciadEntity, setCiadEntity] = useState('EIPASS / Certipass');
  const [languageLevel, setLanguageLevel] = useState('B2');

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
        title: `Certificazione Internazionale di Alfabetizzazione Digitale (CIAD - Accredia ${ciadEntity})`,
        amount: 0,
        notes: JSON.stringify({
          isCiad: true,
          accreditingBody: ciadEntity,
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
      const pts = profile === 'CS' || profile === 'OS' ? 0.30 : 0.60;
      onChange({
        title: 'Certificazione Informatica (EIPASS / ICDL / DigComp / Pekit)',
        amount: pts,
        notes: JSON.stringify({
          kind: 'digital',
          calculatedPoints: pts,
          notesText: `Certificazione informatica (max ${pts} pt per ${profile || 'ATA'}).`,
        }),
      });
    } else if (presetKey === 'degree') {
      const pts = profile === 'CS' || profile === 'OS' ? 1.00 : 2.00;
      onChange({
        title: 'Diploma di Laurea (Triennale / Magistrale / Specialistica)',
        amount: pts,
        notes: JSON.stringify({
          kind: 'degree',
          calculatedPoints: pts,
          notesText: `Diploma di Laurea valutabile ${pts.toFixed(2)} punti.`,
        }),
      });
    } else if (presetKey === 'oss') {
      onChange({
        title: 'Attestato Qualifica Professionale Operatore Socio Sanitario (OSS / OSA)',
        amount: 1.0,
        notes: JSON.stringify({
          kind: 'oss',
          calculatedPoints: 1.0,
          notesText: 'Qualifica regionale valutabile 1.00 punto per Collaboratore e Operatore Scolastico.',
        }),
      });
    } else if (presetKey === 'language') {
      const pts = languageLevel === 'C2' ? 2.0 : languageLevel === 'C1' ? 1.5 : 1.0;
      onChange({
        title: `Certificazione Linguistica Internazionale QCER Livello ${languageLevel}`,
        amount: pts,
        notes: JSON.stringify({
          kind: 'language',
          level: languageLevel,
          calculatedPoints: pts,
          notesText: `Certificazione linguistica QCER livello ${languageLevel} (+${pts.toFixed(2)} pt).`,
        }),
      });
    } else if (presetKey === 'contest') {
      onChange({
        title: 'Idoneità conseguita in Concorso Pubblico per esami per il profilo',
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
    <div className="qualification-preset-block" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1.5px solid #cbd5e1', marginBottom: 14 }}>
      <FormField label="Seleziona Modello Titolo / Certificazione ATA (D.M. 89/2024)" tip="Scegli un modello conforme alle tabelle ministeriali per calcolare automaticamente il punteggio esatto.">
        <select
          value={selectedPreset}
          onChange={e => applyPreset(e.target.value)}
          style={{ fontWeight: 700, color: '#1e293b' }}
        >
          <option value="diploma">🎓 Diploma di Maturità / Titolo di Accesso (Calcolo voto ministeriale base 10)</option>
          <option value="ciad">🛡️ CIAD - Certificazione Alfabetizzazione Digitale (Obbligatorio CCNL 2024)</option>
          <option value="typing">⌨️ Corso di Addestramento alla Dattilografia (+1.00 pt per AA)</option>
          <option value="digital">💻 Certificazione Informatica (EIPASS / ICDL / Pekit / MOS) (+0.60 pt AA/AT, +0.30 CS)</option>
          <option value="degree">🏛️ Diploma di Laurea Triennale o Magistrale (+2.00 pt AA/AT, +1.00 CS)</option>
          <option value="language">🌐 Certificazione Linguistica QCER (B2, C1, C2) (+1.00 / +1.50 / +2.00 pt)</option>
          <option value="oss">🏥 Qualifica Professionale OSS / OSA (+1.00 pt per CS/OS)</option>
          <option value="contest">🏆 Idoneità in Concorso Pubblico per esami (+1.00 pt)</option>
          <option value="custom">✏️ Altro titolo o attestato personalizzato</option>
        </select>
      </FormField>

      {selectedPreset === 'diploma' && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center', background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
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
        <div style={{ marginTop: 10, background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <FormField label="Ente Rilasciante Accreditato Accredia" tip="La CIAD deve essere registrata presso Accredia sotto norma DigComp 2.2">
            <select
              value={ciadEntity}
              onChange={e => {
                setCiadEntity(e.target.value);
                onChange({
                  title: `Certificazione Internazionale di Alfabetizzazione Digitale (CIAD - Accredia ${e.target.value})`,
                  amount: 0,
                  notes: JSON.stringify({
                    isCiad: true,
                    accreditingBody: e.target.value,
                    notesText: 'Requisito di accesso obbligatorio ai sensi del CCNL 18/01/2024.',
                  }),
                });
              }}
            >
              <option value="EIPASS / Certipass">EIPASS (Certipass - Accredia)</option>
              <option value="AICA / ICDL Full Standard">AICA (ICDL Full Standard - Accredia)</option>
              <option value="Fondazione Sviluppo Europa / PEKIT">PEKIT (Fondazione Sviluppo Europa - Accredia)</option>
              <option value="IDCERT / Intertek">IDCERT (Intertek - Accredia)</option>
              <option value="Altro Ente Accreditato">Altro Organismo di Certificazione Accreditato</option>
            </select>
          </FormField>
        </div>
      )}

      {selectedPreset === 'language' && (
        <div style={{ marginTop: 10, background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <FormField label="Livello Quadro Comune Europeo di Riferimento (QCER)">
            <select
              value={languageLevel}
              onChange={e => {
                setLanguageLevel(e.target.value);
                const pts = e.target.value === 'C2' ? 2.0 : e.target.value === 'C1' ? 1.5 : 1.0;
                onChange({
                  title: `Certificazione Linguistica Internazionale QCER Livello ${e.target.value}`,
                  amount: pts,
                  notes: JSON.stringify({
                    kind: 'language',
                    level: e.target.value,
                    calculatedPoints: pts,
                    notesText: `Certificazione linguistica QCER livello ${e.target.value} (+${pts.toFixed(2)} pt).`,
                  }),
                });
              }}
            >
              <option value="B2">Livello B2 Intermedio Superiore (+1.00 pt)</option>
              <option value="C1">Livello C1 Avanzato (+1.50 pt)</option>
              <option value="C2">Livello C2 Padronanza / Madrelingua (+2.00 pt)</option>
            </select>
          </FormField>
        </div>
      )}
    </div>
  );
}
