import { Archive } from './types';

export interface EncryptedBackupEnvelope {
  version: number;
  cipher: 'AES-256-GCM' | 'none';
  kdf?: 'PBKDF2-SHA256';
  iterations?: number;
  salt?: string;
  iv?: string;
  data: string;
  exportedAt: string;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptBackup(archive: Archive, password?: string): Promise<string> {
  const jsonStr = JSON.stringify({ archive, exportedAt: new Date().toISOString() });
  const encoder = new TextEncoder();

  if (!password || password.trim().length === 0) {
    const envelope: EncryptedBackupEnvelope = {
      version: 1,
      cipher: 'none',
      data: bufferToBase64(encoder.encode(jsonStr).buffer),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(envelope, null, 2);
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(jsonStr),
  );

  const envelope: EncryptedBackupEnvelope = {
    version: 1,
    cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(encrypted),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptBackup(
  rawContent: string,
  onRequirePassword: () => Promise<string>,
): Promise<Archive> {
  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error('Il file fornito non contiene un formato JSON valido.');
  }

  // Direct Archive object or legacy export
  if (parsed.archive && Array.isArray(parsed.archive.people)) {
    return parsed.archive as Archive;
  }
  if (Array.isArray(parsed.people)) {
    return parsed as Archive;
  }

  // Envelope format
  if (parsed.cipher === 'none' && parsed.data) {
    const decoder = new TextDecoder();
    const decoded = decoder.decode(base64ToBuffer(parsed.data));
    const inner = JSON.parse(decoded);
    return inner.archive || inner;
  }

  if (parsed.cipher === 'AES-256-GCM' && parsed.data && parsed.salt && parsed.iv) {
    const password = await onRequirePassword();
    if (!password) {
      throw new Error('Password di decifrazione non inserita.');
    }

    const saltBuf = base64ToBuffer(parsed.salt);
    const ivBuf = base64ToBuffer(parsed.iv);
    const dataBuf = base64ToBuffer(parsed.data);

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(saltBuf),
        iterations: parsed.iterations || 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(ivBuf),
        },
        key,
        dataBuf,
      );
      const decoder = new TextDecoder();
      const text = decoder.decode(decrypted);
      const inner = JSON.parse(text);
      return inner.archive || inner;
    } catch {
      throw new Error('Password errata o file di backup compromesso.');
    }
  }

  throw new Error('Struttura del backup non riconosciuta.');
}
