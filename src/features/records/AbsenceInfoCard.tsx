import { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { useT } from '../../shared/i18n';
import { ContractType } from '../../shared/entitlements';
import { ABSENCE_STATUTORY_DATA } from './absenceInfo';

export function AbsenceInfoCard({
  kind,
  defaultContractType = 'permanent',
}: {
  kind: string;
  defaultContractType?: ContractType;
}) {
  const t = useT();
  const [selectedContract, setSelectedContract] = useState<ContractType>(defaultContractType);
  const info = ABSENCE_STATUTORY_DATA[kind];

  if (!info) return null;

  const currentRule = info[selectedContract] || info.permanent;

  return (
    <div className="absence-statutory-card">
      <div className="absence-statutory-header">
        <div className="absence-statutory-title">
          <ShieldCheck size={18} />
          <strong>
            {t('statutoryInfoTitle')}: {t(info.titleKey)}
          </strong>
        </div>
        <span className="absence-legal-pill">{info.legalReference}</span>
      </div>

      <div style={{ margin: '10px 0 14px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #64748b)', marginBottom: 6 }}>
          {t('contractTypeLabel')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['permanent', 'annual', 'short'] as const).map(ct => (
            <button
              key={ct}
              type="button"
              className={selectedContract === ct ? 'mini-btn' : 'mini-btn secondary'}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '14px',
              }}
              onClick={() => setSelectedContract(ct)}
            >
              <Briefcase size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
              {t(ct === 'permanent' ? 'contractPermanent' : ct === 'annual' ? 'contractAnnual' : 'contractShort')}
            </button>
          ))}
        </div>
      </div>

      <div className="absence-statutory-grid">
        <div className="absence-statutory-item">
          <Clock size={15} />
          <div>
            <small>{t('entitlementLimit')}</small>
            <strong>{t(currentRule.daysAllowedKey)}</strong>
          </div>
        </div>

        <div className="absence-statutory-item">
          <DollarSign size={15} />
          <div>
            <small>{t('economicTreatment')}</small>
            <strong>{t(currentRule.economicTreatmentKey)}</strong>
          </div>
        </div>

        <div className="absence-statutory-item wide">
          <Building size={15} />
          <div>
            <small>{t('jobRetentionTitle')}</small>
            <p style={{ margin: 0, fontWeight: 500 }}>{t(currentRule.retentionKey)}</p>
          </div>
        </div>

        {info.visiteFiscaliKey && (
          <div className="absence-statutory-item wide" style={{ borderLeft: '3px solid #3b82f6' }}>
            <Clock size={15} color="#2563eb" />
            <div>
              <small style={{ color: '#1d4ed8' }}>{t('visiteFiscaliHours')}</small>
              <p style={{ margin: 0, fontSize: '12px' }}>{t(info.visiteFiscaliKey)}</p>
            </div>
          </div>
        )}

        {info.decurtazioneBrunettaKey && (
          <div className="absence-statutory-item wide" style={{ borderLeft: '3px solid #f59e0b' }}>
            <AlertTriangle size={15} color="#d97706" />
            <div>
              <small style={{ color: '#b45309' }}>{t('brunettaCutTitle')}</small>
              <p style={{ margin: 0, fontSize: '12px' }}>{t(info.decurtazioneBrunettaKey)}</p>
            </div>
          </div>
        )}

        <div className="absence-statutory-item wide">
          <FileText size={15} />
          <div>
            <small>{t('requiredDocumentation')}</small>
            <p style={{ margin: 0, fontSize: '12px' }}>{t(info.documentationKey)}</p>
          </div>
        </div>
      </div>

      <p className="absence-statutory-summary">{t(info.summaryKey)}</p>
    </div>
  );
}
