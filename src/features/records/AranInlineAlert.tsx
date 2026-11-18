import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Copy, Check } from 'lucide-react';

interface AranItem {
  id: string;
  ruleCode: string;
  title: string;
  severity: 'critical_red' | 'warning_amber' | 'info_blue';
  summary: string;
  consequence: string;
  secretariatNote?: string;
}

export function AranInlineAlert({ alerts }: { alerts: AranItem[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!alerts || alerts.length === 0) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
      {alerts.map(al => {
        const isRed = al.severity === 'critical_red';
        const isAmber = al.severity === 'warning_amber';

        return (
          <div
            key={al.id}
            className="aran-inline-warning-box"
            style={{
              borderColor: isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#3b82f6',
              background: isRed
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(185, 28, 28, 0.08) 100%)'
                : isAmber
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(180, 83, 9, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(29, 78, 216, 0.08) 100%)',
            }}
          >
            {isRed ? (
              <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : isAmber ? (
              <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <Info size={24} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  color: isRed ? '#fca5a5' : isAmber ? '#fde68a' : '#bae6fd',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  marginBottom: 3,
                }}
              >
                ⚠️ {al.ruleCode}: {al.title}
              </div>

              <div style={{ fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.45 }}>{al.summary}</div>

              <div
                style={{
                  marginTop: 6,
                  fontWeight: 700,
                  color: isRed ? '#fecaca' : isAmber ? '#fef08a' : '#e0f2fe',
                  fontSize: '0.82rem',
                }}
              >
                {al.consequence}
              </div>

              {al.secretariatNote && (
                <div
                  style={{
                    marginTop: 8,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8' }}>
                      📝 Nota di tutela da presentare alla Segreteria Scolastica:
                    </span>
                    <button
                      type="button"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: copiedId === al.id ? '#34d399' : '#e2e8f0',
                        fontSize: '0.72rem',
                        fontWeight: 650,
                        padding: '3px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onClick={() => handleCopy(al.id, al.secretariatNote!)}
                    >
                      {copiedId === al.id ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === al.id ? 'Copiato!' : 'Copia testo'}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      color: '#cbd5e1',
                      lineHeight: 1.4,
                    }}
                  >
                    "{al.secretariatNote}"
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
