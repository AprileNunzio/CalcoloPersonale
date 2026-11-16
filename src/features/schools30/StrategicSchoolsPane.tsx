import { useState, useEffect, useContext } from 'react';
import {
  School,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { Person, Entry, Archive } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { AutoSaveContext } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { DirectoryEntry } from '../directory/DirectoryPicker';
import {
  SelectedSchoolItem,
  ConvocationItem,
  detectSchoolCategory,
  parseSchools30FromNotes,
} from './schools30Calculations';
import './schools30.css';

export function StrategicSchoolsPane({ person }: { person: Person }) {
  const context = useContext(AutoSaveContext);

  // Find or create the 30 schools application entry
  const existingApp = (person.records || []).find(
    r => r.kind === 'application' && (r.notes?.includes('selectedSchools') || r.title.includes('30 Scuole')),
  );

  const initialData = parseSchools30FromNotes(existingApp?.notes);

  const [selectedSchools, setSelectedSchools] = useState<SelectedSchoolItem[]>(initialData.selectedSchools);
  const [convocations, setConvocations] = useState<ConvocationItem[]>(initialData.convocations);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DirectoryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Convocation form
  const [newConvDate, setNewConvDate] = useState('');
  const [newConvSchool, setNewConvSchool] = useState('');
  const [newConvProfile, setNewConvProfile] = useState(person.profile || 'CS');
  const [newConvContract, setNewConvContract] = useState('30_giugno');
  const [newConvHours, setNewConvHours] = useState(36);
  const [newConvStatus, setNewConvStatus] = useState<'accepted' | 'refused' | 'pending'>('accepted');

  // Search schools in directory
  useEffect(() => {
    let active = true;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      call<DirectoryEntry[]>('search_directory', {
        kind: 'school',
        query: searchQuery.trim(),
      })
        .then(res => {
          if (active) setSearchResults(res.slice(0, 15));
        })
        .catch(() => {
          if (active) setSearchResults([]);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleAddSchool = (entry: DirectoryEntry) => {
    if (selectedSchools.some(s => s.code === entry.code)) return;
    if (selectedSchools.length >= 30) return;

    const newItem: SelectedSchoolItem = {
      id: crypto.randomUUID(),
      code: entry.code,
      name: entry.name,
      municipality: entry.municipality,
      province: entry.province,
      typeCategory: detectSchoolCategory(entry.name, entry.code),
      address: entry.address,
      orderNumber: selectedSchools.length + 1,
    };

    setSelectedSchools([...selectedSchools, newItem]);
    setSuccessMsg('');
  };

  const handleRemoveSchool = (id: string) => {
    const filtered = selectedSchools.filter(s => s.id !== id);
    const reordered = filtered.map((s, idx) => ({ ...s, orderNumber: idx + 1 }));
    setSelectedSchools(reordered);
    setSuccessMsg('');
  };

  const handleAddConvocation = () => {
    if (!newConvDate || !newConvSchool) return;
    const newConv: ConvocationItem = {
      id: crypto.randomUUID(),
      date: newConvDate,
      schoolName: newConvSchool,
      profile: newConvProfile,
      contractType: newConvContract,
      hours: newConvHours,
      status: newConvStatus,
    };
    setConvocations([newConv, ...convocations]);
    setNewConvSchool('');
    setNewConvDate('');
  };

  const handleRemoveConvocation = (id: string) => {
    setConvocations(convocations.filter(c => c.id !== id));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await flush();
      const entryId = existingApp?.id || crypto.randomUUID();
      const updatedEntry: Entry = {
        id: entryId,
        kind: 'application',
        title: `Scelta 30 Scuole ATA (${selectedSchools.length}/30)`,
        start: new Date().toISOString().slice(0, 10),
        end: null,
        amount: null,
        notes: JSON.stringify({
          selectedSchools,
          convocations,
        }),
        profile: person.profile || 'CS',
        school: null,
      };

      const updatedArchive = await call<Archive>('save_record', {
        personId: person.id,
        entryId,
        entry: updatedEntry,
        revision: getRevision(),
      });

      context?.saved(updatedArchive);
      setSuccessMsg('Paniere delle 30 scuole e registro convocazioni salvati con successo!');
    } catch {
      // error
    } finally {
      setIsSaving(false);
    }
  };

  const icCount = selectedSchools.filter(s => s.typeCategory === 'ic').length;
  const superioreCount = selectedSchools.filter(s => s.typeCategory === 'superiore').length;
  const liceoCount = selectedSchools.filter(s => s.typeCategory === 'liceo').length;

  return (
    <div className="schools30-root">
      {/* HEADER HERO */}
      <div className="schools30-header-card">
        <div>
          <h3>
            <School size={26} /> Scelta Strategica delle 30 Scuole & Registro Convocazioni
          </h3>
          <p>
            Componi il tuo paniere ottimale di 30 istituzioni scolastiche per la graduatoria provinciale ATA e monitora le convocazioni ricevute.
          </p>
        </div>

        <div className="schools30-progress-pill">
          <span>Paniere Scelto:</span>
          <strong>{selectedSchools.length} / 30 scuole</strong>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STRATEGIC KPIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <small className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Istituti Comprensivi (IC)</small>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{icCount} scuole</div>
          <small className="muted" style={{ fontSize: 11 }}>Massima concentrazione posti Collaboratore Scolastico</small>
        </div>

        <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <small className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Istituti Tecnici & Prof.</small>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{superioreCount} scuole</div>
          <small className="muted" style={{ fontSize: 11 }}>Laboratori per Assistenti Tecnici (AT) e Cuochi</small>
        </div>

        <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <small className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Licei Statali</small>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5' }}>{liceoCount} scuole</div>
          <small className="muted" style={{ fontSize: 11 }}>Posti per Assistenti Amministrativi e CS</small>
        </div>
      </div>

      {/* GRID: SEARCH & SELECTED */}
      <div className="schools30-grid">
        {/* SEARCH PANEL */}
        <div className="schools30-search-panel">
          <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} /> Cerca Scuole nella Provincia
          </h4>

          <input
            type="search"
            placeholder="Cerca per nome scuola, comune o codice meccanografico..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />

          <div className="schools30-list">
            {isSearching ? (
              <p className="muted" style={{ padding: 12 }}>Ricerca istituti in corso...</p>
            ) : searchResults.length === 0 ? (
              <p className="muted" style={{ padding: 12, fontSize: 13 }}>
                {searchQuery.trim().length < 2 ? 'Digita almeno 2 lettere per visualizzare le scuole.' : 'Nessuna scuola trovata con questa chiave.'}
              </p>
            ) : (
              searchResults.map(school => {
                const isAlreadySelected = selectedSchools.some(s => s.code === school.code);
                const cat = detectSchoolCategory(school.name, school.code);
                return (
                  <div className="school-card-row" key={school.code}>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <span className={`school-category-tag ${cat}`}>
                          {cat === 'ic' ? 'I.C.' : cat === 'superiore' ? 'Tecnico/Prof.' : cat === 'liceo' ? 'Liceo' : 'Altro'}
                        </span>
                        <strong style={{ fontSize: 12 }}>{school.code}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>· {school.municipality}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{school.name}</div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadySelected || selectedSchools.length >= 30}
                      onClick={() => handleAddSchool(school)}
                      style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={14} /> {isAlreadySelected ? 'Aggiunta' : 'Aggiungi'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SELECTED PANEL */}
        <div className="schools30-selected-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} /> Le Tue 30 Scuole ({selectedSchools.length}/30)
            </h4>
            <button
              type="button"
              className="primary"
              disabled={isSaving}
              onClick={handleSaveAll}
              style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={15} /> {isSaving ? 'Salvataggio...' : 'Salva Paniere'}
            </button>
          </div>

          <div className="schools30-list">
            {selectedSchools.length === 0 ? (
              <p className="muted" style={{ padding: 12, fontSize: 13 }}>
                Non hai ancora aggiunto nessuna scuola. Utilizza la ricerca a sinistra per selezionare fino a 30 istituzioni scolastiche.
              </p>
            ) : (
              selectedSchools.map(school => (
                <div className="school-card-row" key={school.id}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="school-order-badge">{school.orderNumber}</div>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                        <span className={`school-category-tag ${school.typeCategory}`}>
                          {school.typeCategory === 'ic' ? 'I.C.' : school.typeCategory === 'superiore' ? 'Tecnico' : 'Liceo'}
                        </span>
                        <strong style={{ fontSize: 12 }}>{school.code}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>· {school.municipality}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{school.name}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="icon secondary danger"
                    onClick={() => handleRemoveSchool(school.id)}
                    title="Rimuovi scuola"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* REGISTRO CONVOCAZIONI */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
        <h4 style={{ margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} /> Registro Personale delle Convocazioni Ricevute
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto', gap: 10, alignItems: 'end', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Data Ricezione</label>
            <input type="date" value={newConvDate} onChange={e => setNewConvDate(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Scuola / Istituto</label>
            <input type="text" placeholder="es. I.C. De Amicis" value={newConvSchool} onChange={e => setNewConvSchool(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tipo Contratto</label>
            <select value={newConvContract} onChange={e => setNewConvContract(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <option value="30_giugno">Fino al 30 giugno</option>
              <option value="31_agosto">Annuale 31 agosto</option>
              <option value="breve">Supplenza breve</option>
              <option value="spezzone">Spezzone orario</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Esito</label>
            <select value={newConvStatus} onChange={e => setNewConvStatus(e.target.value as 'accepted' | 'refused' | 'pending')} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <option value="accepted">Accettata</option>
              <option value="refused">Rifiutata / Rinuncia</option>
              <option value="pending">In attesa di riscontro</option>
            </select>
          </div>
          <button type="button" className="primary" onClick={handleAddConvocation} style={{ padding: '7px 14px' }}>
            Aggiungi Convocazione
          </button>
        </div>

        {convocations.length > 0 && (
          <table className="convocations-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Scuola</th>
                <th>Profilo</th>
                <th>Incarico</th>
                <th>Stato</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {convocations.map(c => (
                <tr key={c.id}>
                  <td>{c.date}</td>
                  <td><strong>{c.schoolName}</strong></td>
                  <td>{c.profile}</td>
                  <td>{c.contractType.replace('_', ' ')} ({c.hours}h)</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: c.status === 'accepted' ? '#dcfce7' : c.status === 'refused' ? '#fee2e2' : '#fef3c7',
                      color: c.status === 'accepted' ? '#15803d' : c.status === 'refused' ? '#b91c1c' : '#b45309',
                    }}>
                      {c.status === 'accepted' ? 'Accettata' : c.status === 'refused' ? 'Rinunciata' : 'In attesa'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="icon secondary danger" onClick={() => handleRemoveConvocation(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
