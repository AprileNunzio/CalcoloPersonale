import { Analysis } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { ShieldCheck, CalendarDays, GraduationCap, Clock3, BarChart3 } from 'lucide-react';
export function Dashboard({data,year,setYear}:{data:Analysis|null;year:number;setYear:(y:number)=>void}) {
 const t=useT();
 const stats=[{key:'serviceDays',value:data?.serviceDays,icon:CalendarDays},{key:'absenceDays',value:data?.recordedAbsenceDays,icon:Clock3},{key:'qualifications',value:data?.qualifications,icon:GraduationCap},{key:'score',value:t('pending'),icon:BarChart3}];
 return <><div className="section-heading"><div><h2>{t('dashboard')}</h2><p className="muted">{t('reference')}</p></div><label>{t('schoolYear')}<select value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:30},(_,i)=>new Date().getFullYear()+1-i).map(y=><option key={y} value={y}>{y}/{y+1}</option>)}</select></label></div><div className="stats">{stats.map(s=><div className="panel stat" key={s.key}><s.icon size={21}/><strong>{s.value ?? '—'}</strong><span>{t(s.key)}</span></div>)}</div><div className="panel evidence"><ShieldCheck/><h3>{t('evidence')}</h3>{data?.warnings.map(w=><p key={w}>{t(w)}</p>)}</div><div className="panel"><h3>{t('children')}</h3>{data?.children.length ? data.children.map((c,i)=><div className="entry" key={i}><strong>{c.name}</strong><span>{c.age} {t('age')}</span></div>) : <p className="muted">{t('noRecords')}</p>}</div></>;
}
