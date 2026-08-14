import React from 'react';
import { Form } from 'react-bootstrap';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface SelecteurAnneeAcademiqueProps {
  value: number | undefined;
  onChange: (anneeId: number | undefined) => void;
  annees: AnneeAcademique[];
  includeArchivees?: boolean;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
}

const SelecteurAnneeAcademique: React.FC<SelecteurAnneeAcademiqueProps> = ({
  value,
  onChange,
  annees,
  includeArchivees = false,
  placeholder = 'Sélectionner une année',
  disabled = false,
  size
}) => {

  const filteredAnnees = includeArchivees 
    ? annees 
    : annees.filter(a => a.statut !== 'archivee');

  const groupedAnnees = filteredAnnees.reduce((acc, annee) => {
    const group = annee.is_current ? 'current' : annee.statut;
    if (!acc[group]) acc[group] = [];
    acc[group].push(annee);
    return acc;
  }, {} as Record<string, AnneeAcademique[]>);

  const groupOrder = ['current', 'en_cours', 'ouverte', 'cloturee', 'brouillon', 'archivee'];
  const groupLabels: Record<string, string> = {
    current: '★ Année courante',
    en_cours: 'En cours',
    ouverte: 'Ouvertes',
    cloturee: 'Clôturées',
    brouillon: 'Brouillons',
    archivee: 'Archivées'
  };

  return (
    <Form.Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
      disabled={disabled}
      size={size}
    >
      <option value="">{placeholder}</option>
      {groupOrder.map(group => {
        const groupAnnees = groupedAnnees[group];
        if (!groupAnnees || groupAnnees.length === 0) return null;

        return (
          <optgroup key={group} label={groupLabels[group]}>
            {groupAnnees.map(annee => (
              <option key={annee.id} value={annee.id}>
                {annee.code} - {annee.libelle}
                {annee.is_current ? ' ★' : ''}
              </option>
            ))}
          </optgroup>
        );
      })}
    </Form.Select>
  );
};

export default SelecteurAnneeAcademique;
