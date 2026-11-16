import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import './FormField.css';

export type FieldStatus = 'idle' | 'saved' | 'error';

interface FormFieldProps {
  label: string;
  tip?: string;
  status?: FieldStatus;
  errorMessage?: string;
  className?: string;
  children: ReactNode;
  id?: string;
}

export function FormField({
  label,
  tip,
  status = 'idle',
  errorMessage,
  className = '',
  children,
  id,
}: FormFieldProps) {
  return (
    <div className={`form-field ${status} ${className}`}>
      <div className="form-field-header">
        <label htmlFor={id} className="field-label-text">
          {label}
        </label>
        {tip && (
          <span className="field-tip-anchor" tabIndex={-1} aria-label={tip} role="note">
            <Info size={14} className="tip-icon" />
            <span className="field-tooltip" role="tooltip">
              {tip}
            </span>
          </span>
        )}
      </div>
      <div className={`input-wrapper ${status}`}>
        {children}
      </div>
      {status === 'error' && errorMessage && (
        <span className="field-error-text" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
