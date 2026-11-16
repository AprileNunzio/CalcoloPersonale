import { FileText, ShieldCheck, DollarSign, Clock } from 'lucide-react';
import { useT } from '../../shared/i18n';
import { ABSENCE_STATUTORY_DATA } from './absenceInfo';

export function AbsenceInfoCard({ kind }: { kind: string }) {
  const t = useT();
  const info = ABSENCE_STATUTORY_DATA[kind];

  if (!info) return null;

  return (
    <div className="absence-statutory-card">
      <div className="absence-statutory-header">
        <div className="absence-statutory-title">
          <ShieldCheck size={16} />
          <strong>{t('statutoryInfoTitle')}: {t(info.titleKey)}</strong>
        </div>
        <span className="absence-legal-pill">{info.legalReference}</span>
      </div>

      <div className="absence-statutory-grid">
        <div className="absence-statutory-item">
          <Clock size={14} />
          <div>
            <small>{t('entitlementLimit')}</small>
            <strong>{t(info.daysAllowedKey)}</strong>
          </div>
        </div>

        <div className="absence-statutory-item">
          <DollarSign size={14} />
          <div>
            <small>{t('economicTreatment')}</small>
            <strong>{t(info.economicTreatmentKey)}</strong>
          </div>
        </div>

        <div className="absence-statutory-item wide">
          <FileText size={14} />
          <div>
            <small>{t('requiredDocumentation')}</small>
            <p>{t(info.documentationKey)}</p>
          </div>
        </div>
      </div>

      <p className="absence-statutory-summary">{t(info.summaryKey)}</p>
    </div>
  );
}
