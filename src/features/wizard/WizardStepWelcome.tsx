import { Sparkles, Briefcase, Calculator, ShieldCheck, HelpCircle } from 'lucide-react';

export function WizardStepWelcome() {
  return (
    <div className="wizard-step-content">
      <div className="wizard-intro-hero">
        <div className="wizard-hero-icon">
          <Sparkles size={32} />
        </div>
        <h2 className="wizard-hero-title">Benvenuto nel Personale ATA: Guida Passo Passo</h2>
        <p className="wizard-hero-subtitle">
          Questa procedura ti guida nella compilazione corretta del tuo fascicolo scolastico, spiegando in modo trasparente e comprensibile ogni singola voce, requisito e formula di calcolo del punteggio ministeriale.
        </p>
      </div>

      <div className="dash-cards-grid">
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: 'var(--primary-container)', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <Briefcase size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Cos’è il Personale ATA?</h3>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Il personale ATA (Amministrativo, Tecnico e Ausiliario) opera negli istituti scolastici statali. Comprende figure essenziali come Collaboratori Scolastici (vigilanza e ausilio), Assistenti Amministrativi (segreteria e pratiche) e Assistenti Tecnici (laboratori).
          </p>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: 'var(--primary-container)', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <Calculator size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Come Funziona il Punteggio?</h3>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            La graduatoria di Terza Fascia si basa sulla somma di tre componenti: il <strong>Titolo di Studio d'accesso</strong> (il voto del tuo diploma o qualifica), i <strong>Titoli Culturali/Informatici</strong> (certificazioni, dattilografia, lauree) e i <strong>Mesi di Servizio Lavorativo</strong> prestati nella scuola.
          </p>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: 'var(--tertiary-container)', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Nuovo CCNL 2024 & CIAD</h3>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Il CCNL Istruzione e Ricerca 2019-2021 ha introdotto la <strong>Certificazione Internazionale di Alfabetizzazione Digitale (CIAD)</strong> registrata Accredia come requisito d'accesso obbligatorio per tutti i profili ad esclusione dei Collaboratori Scolastici.
          </p>
        </div>
      </div>

      <div className="wizard-info-callout" style={{ marginTop: 24 }}>
        <HelpCircle size={22} style={{ flexShrink: 0, color: 'var(--primary)' }} />
        <div>
          <h4>Cosa ti serve per iniziare?</h4>
          <p>
            Tieni a portata di mano: 1) Documento d’identità e Codice Fiscale; 2) Diploma di maturità o titolo d'accesso con votazione esatta; 3) Eventuali attestati informatici conseguiti; 4) Contratti di lavoro o certificati di servizio scolastico con date di inizio e fine.
          </p>
        </div>
      </div>
    </div>
  );
}
