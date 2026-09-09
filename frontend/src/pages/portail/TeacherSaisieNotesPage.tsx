import React from 'react';
import SaisieNotesPage from '../bootstrap/evaluations/SaisieNotesPage';

/** Saisie notes - portail enseignant (matières filtrées par séances). */
const TeacherSaisieNotesPage: React.FC = () => (
  <SaisieNotesPage portalMode="teacher" />
);

export default TeacherSaisieNotesPage;
