import React from 'react';
import { Form } from 'react-bootstrap';

interface SelecteurSemestreProps {
  value: number | undefined;
  onChange: (semestre: number | undefined) => void;
  anneeId?: number;
  dateDebutS1?: string;
  dateFinS1?: string;
  dateDebutS2?: string;
  dateFinS2?: string;
  semestreActif?: number;
  disabled?: boolean;
  size?: 'sm' | 'lg';
}

const SelecteurSemestre: React.FC<SelecteurSemestreProps> = ({
  value,
  onChange,
  dateDebutS1,
  dateFinS1,
  dateDebutS2,
  dateFinS2,
  semestreActif,
  disabled = false,
  size
}) => {
  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDateRange = (debut: string | undefined, fin: string | undefined) => {
    if (!debut || !fin) return '';
    return `(${formatDate(debut)} - ${formatDate(fin)})`;
  };

  return (
    <Form.Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
      disabled={disabled}
      size={size}
    >
      <option value="">Tous les semestres</option>
      <option value="1">
        Semestre 1 {getDateRange(dateDebutS1, dateFinS1)}
        {semestreActif === 1 ? ' ★ Actif' : ''}
      </option>
      <option value="2">
        Semestre 2 {getDateRange(dateDebutS2, dateFinS2)}
        {semestreActif === 2 ? ' ★ Actif' : ''}
      </option>
    </Form.Select>
  );
};

export default SelecteurSemestre;
