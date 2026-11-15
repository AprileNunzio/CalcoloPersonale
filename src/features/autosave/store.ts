import { call } from '../../shared/api';
import { Archive } from '../../shared/types';
type Job = { key: string; value: unknown; saved: (a: Archive) => void };
const pending = new Map<string, Job>();
const subscribers = new Set<()=>void>();
let timer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | undefined;
let status = 'saved';
export function reportFailure() { publish('saveFailed'); }
function publish(value: string) { status=value; subscribers.forEach(fn=>fn()); }
export const subscribe=(fn:()=>void)=>{subscribers.add(fn);return()=>{subscribers.delete(fn);};};
export const snapshot=()=>status;
export function schedule(job:Job) {
 pending.set(job.key,job);publish('saving');clearTimeout(timer);
 timer=setTimeout(()=>{void flush().catch(reportFailure);},400);
}
export function flush():Promise<void> {
 clearTimeout(timer);
 if(running)return running.then(()=>pending.size?flush():undefined);
 running=(async()=>{
  while(pending.size){
   const job=pending.values().next().value as Job;
   pending.delete(job.key);
   try {job.saved(await call<Archive>('save_draft',{key:job.key,value:job.value}));}
   catch(error){if(!pending.has(job.key))pending.set(job.key,job);publish('saveFailed');throw error;}
  }
  publish('saved');
 })().finally(()=>{running=undefined;});
 return running;
}
