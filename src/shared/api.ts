import { invoke, isTauri } from '@tauri-apps/api/core';
let revision = 0;
export function getRevision() { return revision; }
export function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) return Promise.reject('desktopOnly');
  return invoke<T>(command, args).then(result=>{
    if(result && typeof result==='object' && 'revision' in result && typeof result.revision==='number') revision=result.revision;
    return result;
  });
}
