import { createContext, Dispatch, SetStateAction, useContext, useRef, useState, useSyncExternalStore } from 'react';
import { Archive } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { flush, schedule, snapshot, subscribe, reportFailure } from './store';
import './styles.css';
export const AutoSaveContext=createContext<{archive:Archive; saved:(a:Archive)=>void}|null>(null);
export function useAutoDraft<T>(key:string,initial:T):[T,Dispatch<SetStateAction<T>>] {
 const context=useContext(AutoSaveContext);
 if(!context)throw new Error('autosaveContext');
 const [value,update]=useState<T>(()=>(context.archive.drafts?.[key] as T|undefined)??initial);
 const latest=useRef(value);latest.current=value;
 const set:Dispatch<SetStateAction<T>>=next=>{
  const result=typeof next==='function'?(next as (v:T)=>T)(latest.current):next;
  latest.current=result;update(result);schedule({key,value:result,saved:context.saved});
 };
 return [value,set];
}
export function AutoSaveStatus(){
 const status=useSyncExternalStore(subscribe,snapshot);const t=useT();
 return <div className={`autosave ${status}`} role="status" aria-live="polite"><span className="status-dot"/>{t(status)}{status==='saveFailed'&&<button onClick={()=>{void flush().catch(reportFailure);}}>{t('retry')}</button>}</div>;
}
