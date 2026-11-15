import { useState } from 'react';
import { call } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import './styles.css';

export function GeminiPanel() {
  const t = useT();
  const [key, setKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [draft, setDraft] = useAutoDraft('assistant', { model: '', prompt: '', answer: '' });
  const { model, prompt, answer } = draft;
  const setModel = (model: string) => setDraft(previous => ({ ...previous, model }));
  const setPrompt = (prompt: string) => setDraft(previous => ({ ...previous, prompt }));
  const setAnswer = (answer: string) => setDraft(previous => ({ ...previous, answer }));
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function execute(work: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (reason) { setError(typeof reason === 'string' ? reason : 'error'); }
    finally { setBusy(false); }
  }

  async function loadModels() {
    const found = await call<string[]>('gemini_models');
    setModels(found); setModel(found[0] ?? '');
  }

  return <section>
    <h1>{t('assistant')}</h1>
    <AutoSaveStatus/>
    <p className="muted">{t('geminiDescription')}</p>
    {error && <div className="error" role="alert">{t(error)}</div>}
    {notice && <div className="notice" role="status">{t(notice)}</div>}
    <form className="panel" onSubmit={event => { event.preventDefault(); void execute(async () => {
      await call('configure_gemini', { key }); setKey(''); setNotice('credentialSaved'); await loadModels();
    }); }}>
      <label>{t('apiKey')}<input type="password" autoComplete="off" value={key} required minLength={20} maxLength={256} onChange={event => setKey(event.target.value)}/></label>
      <div className="actions">
        <button disabled={busy}>{t('saveKey')}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => void execute(loadModels)}>{t('loadModels')}</button>
        <button type="button" className="danger" disabled={busy} onClick={() => void execute(async () => { await call('remove_gemini_key'); setModels([]); setModel(''); setNotice('credentialRemoved'); })}>{t('removeKey')}</button>
      </div>
    </form>
    <form className="panel" onSubmit={event => { event.preventDefault(); void execute(async () => {
      setAnswer(''); setAnswer(await call<string>('ask_gemini', { prompt, model, consent })); setConsent(false);
    }); }}>
      <label>{t('model')}<select value={model} onChange={event => setModel(event.target.value)} required>
        <option value="">{t('chooseModel')}</option>{models.map(name => <option key={name}>{name}</option>)}
      </select></label>
      <label>{t('question')}<textarea rows={7} maxLength={32000} value={prompt} required onChange={event => { setPrompt(event.target.value); setConsent(false); }}/></label>
      <label className="consent"><input type="checkbox" checked={consent} required onChange={event => setConsent(event.target.checked)}/>{t('geminiConsent')}</label>
      <button disabled={busy || !consent || !model}>{t(busy ? 'loading' : 'askAssistant')}</button>
    </form>
    {answer && <article className="panel assistant-answer" aria-live="polite"><h2>{t('answer')}</h2><p>{answer}</p><small>{t('aiLimit')}</small></article>}
  </section>;
}
