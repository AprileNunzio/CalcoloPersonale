import { CalendarDays, CheckCircle2, Award, Building2 } from 'lucide-react';
import { useT } from '../../shared/i18n';
import { FormField } from '../../shared/FormField';
import { ServiceSector, evaluateServiceDuration } from './serviceCalculations';

export function ServiceDetailFields({
  start,
  end,
  profile,
  sector,
  notes,
  onChangeSector,
}: {
  start: string;
  end: string | null;
  profile: string;
  sector: ServiceSector;
  notes: string;
  onChangeSector: (s: ServiceSector) => void;
}) {
  const t = useT();
  const evaluation = evaluateServiceDuration(start, end, sector, profile || 'CS');

  return (
    <div className="service-detail-fields-block">
      <FormField label={t('serviceSector')}>
        <select
          value={sector}
          onChange={e => onChangeSector(e.target.value as ServiceSector)}
        >
          <option value="statale_ata">{t('sectorStataleAta')}</option>
          <option value="statale_docente">{t('sectorStataleDocente')}</option>
          <option value="paritaria_ata">{t('sectorParitariaAta')}</option>
          <option value="paritaria_docente">{t('sectorParitariaDocente')}</option>
        </select>
      </FormField>

      {start && (
        <div className="service-live-calc-box">
          <div className="live-calc-header">
            <CalendarDays size={15} />
            <strong>{t('liveServiceCalculation')}</strong>
            <span className="live-days-pill">{evaluation.days} {t('days')} (~{evaluation.months} {t('months')})</span>
          </div>

          <div className="live-calc-metrics">
            <div className="live-metric">
              <small>{t('validFor24Months')}</small>
              <strong className={evaluation.validFor24Months ? 'text-green' : 'text-amber'}>
                {evaluation.validFor24Months ? t('yesEligible') : t('noNotEligible')}
              </strong>
            </div>

            <div className="live-metric">
              <small>{t('scoreSpecificMonthly')}</small>
              <strong>+{evaluation.totalSpecificScore.toFixed(2)} {t('points')}</strong>
            </div>

            <div className="live-metric">
              <small>{t('scoreOtherMonthly')}</small>
              <strong>+{evaluation.totalOtherScore.toFixed(2)} {t('points')}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
