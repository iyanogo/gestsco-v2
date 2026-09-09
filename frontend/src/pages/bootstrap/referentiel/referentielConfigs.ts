import {
  getUniversites,
  createUniversite,
  updateUniversite,
  deleteUniversite,
} from '../../../services/universiteService';
import {
  getEtablissements,
  createEtablissement,
  updateEtablissement,
  deleteEtablissement,
} from '../../../services/etablissementService';
import {
  getDepartements,
  createDepartement,
  updateDepartement,
  deleteDepartement,
} from '../../../services/departementService';
import {
  getCycles,
  createCycle,
  updateCycle,
  deleteCycle,
} from '../../../services/cycleService';
import {
  getFilieres,
  createFiliere,
  updateFiliere,
  deleteFiliere,
} from '../../../services/filiereService';
import {
  getNiveaux,
  createNiveau,
  updateNiveau,
  deleteNiveau,
} from '../../../services/niveauService';
import {
  getModules,
  createModule,
  updateModule,
  deleteModule,
} from '../../../services/moduleService';
import {
  getMatieres,
  createMatiere,
  updateMatiere,
  deleteMatiere,
} from '../../../services/matiereService';
import type {
  Universite,
  Etablissement,
  Departement,
  Cycle,
  Filiere,
  Niveau,
  Module,
  Matiere,
} from '../../../types/reference';

export type ReferentielFieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'select';
  required?: boolean;
  colMd?: number;
  placeholder?: string;
  showInTable?: boolean;
  tableHeader?: string;
  width?: string;
  staticOptions?: { value: string; label: string }[];
  selectLabelKey?: string;
};

export type ReferentielCrudConfig<T extends { id: number }> = {
  title: string;
  subtitle: string;
  breadcrumbLabel: string;
  entityName: string;
  entityNamePlural: string;
  createLabel: string;
  searchPlaceholder: string;
  fields: ReferentielFieldConfig[];
  searchKeys: string[];
  defaultForm: Record<string, string | number | undefined>;
  load: () => Promise<T[]>;
  create: (data: Record<string, unknown>) => Promise<T>;
  update: (id: number, data: Record<string, unknown>) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
  toForm: (item: T) => Record<string, string | number | undefined>;
  toPayload: (form: Record<string, string | number | undefined>) => Record<string, unknown>;
  getDisplayLabel: (item: T) => string;
  selectFields?: {
    name: string;
    loadOptions: () => Promise<{ value: string; label: string }[]>;
  }[];
};

const str = (value: unknown) => (value == null ? '' : String(value));

const numOrUndefined = (value: string | number | undefined) => {
  if (value === '' || value === undefined) return undefined;
  return Number(value);
};

const baseFields = {
  code: { name: 'code', label: 'Code', colMd: 4, width: '100px' },
  libelle: { name: 'libelle', label: 'Libellé', required: true, colMd: 8 },
  sigle: { name: 'sigle', label: 'Sigle', colMd: 4 },
};

export const universitesConfig: ReferentielCrudConfig<Universite> = {
  title: 'Universités',
  subtitle: 'Gestion des universités',
  breadcrumbLabel: 'Universités',
  entityName: 'université',
  entityNamePlural: 'les universités',
  createLabel: 'Nouvelle université',
  searchPlaceholder: 'Rechercher une université...',
  fields: [
    baseFields.code,
    { name: 'nom', label: 'Nom', required: true, colMd: 8, tableHeader: 'Nom' },
    baseFields.sigle,
    { name: 'ville', label: 'Ville', colMd: 4 },
    { name: 'email', label: 'Email', type: 'email', colMd: 4, showInTable: false },
    { name: 'telephone', label: 'Téléphone', colMd: 4, showInTable: false },
    { name: 'site', label: 'Site web', colMd: 6, showInTable: false },
  ],
  searchKeys: ['code', 'nom', 'sigle', 'ville'],
  defaultForm: { code: '', nom: '', sigle: '', ville: '', email: '', telephone: '', site: '' },
  load: getUniversites,
  create: createUniversite,
  update: updateUniversite,
  remove: deleteUniversite,
  toForm: (item) => ({
    code: str(item.code),
    nom: str(item.nom),
    sigle: str(item.sigle),
    ville: str(item.ville),
    email: str(item.email),
    telephone: str(item.telephone),
    site: str(item.site),
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    nom: form.nom || undefined,
    sigle: form.sigle || undefined,
    ville: form.ville || undefined,
    email: form.email || undefined,
    telephone: form.telephone || undefined,
    site: form.site || undefined,
  }),
  getDisplayLabel: (item) => item.nom || item.libelle || item.code || `#${item.id}`,
};

export const etablissementsConfig: ReferentielCrudConfig<Etablissement> = {
  title: 'Établissements',
  subtitle: 'Gestion des établissements',
  breadcrumbLabel: 'Établissements',
  entityName: 'établissement',
  entityNamePlural: 'les établissements',
  createLabel: 'Nouvel établissement',
  searchPlaceholder: 'Rechercher un établissement...',
  fields: [
    baseFields.code,
    { name: 'nom', label: 'Nom', required: true, colMd: 8 },
    baseFields.sigle,
    { name: 'ville', label: 'Ville', colMd: 4 },
    {
      name: 'universite_id',
      label: 'Université',
      type: 'select',
      colMd: 6,
      showInTable: false,
    },
    { name: 'email', label: 'Email', type: 'email', colMd: 6, showInTable: false },
  ],
  searchKeys: ['code', 'nom', 'sigle', 'ville'],
  defaultForm: { code: '', nom: '', sigle: '', ville: '', universite_id: '', email: '' },
  load: getEtablissements,
  create: createEtablissement,
  update: updateEtablissement,
  remove: deleteEtablissement,
  selectFields: [
    {
      name: 'universite_id',
      loadOptions: async () => {
        const items = await getUniversites();
        return items.map((u) => ({
          value: String(u.id),
          label: u.nom || u.libelle || u.code || `#${u.id}`,
        }));
      },
    },
  ],
  toForm: (item) => ({
    code: str(item.code),
    nom: str(item.nom),
    sigle: str(item.sigle),
    ville: str(item.ville),
    universite_id: item.universite_id ?? '',
    email: str(item.email),
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    nom: form.nom || undefined,
    sigle: form.sigle || undefined,
    ville: form.ville || undefined,
    universite_id: numOrUndefined(form.universite_id),
    email: form.email || undefined,
  }),
  getDisplayLabel: (item) => item.nom || item.libelle || item.code || `#${item.id}`,
};

export const departementsConfig: ReferentielCrudConfig<Departement> = {
  title: 'Départements',
  subtitle: 'Gestion des départements',
  breadcrumbLabel: 'Départements',
  entityName: 'département',
  entityNamePlural: 'les départements',
  createLabel: 'Nouveau département',
  searchPlaceholder: 'Rechercher un département...',
  fields: [
    baseFields.code,
    baseFields.libelle,
    baseFields.sigle,
    {
      name: 'etablissement_id',
      label: 'Établissement',
      type: 'select',
      colMd: 6,
      showInTable: false,
    },
  ],
  searchKeys: ['code', 'libelle', 'sigle'],
  defaultForm: { code: '', libelle: '', sigle: '', etablissement_id: '' },
  load: getDepartements,
  create: createDepartement,
  update: updateDepartement,
  remove: deleteDepartement,
  selectFields: [
    {
      name: 'etablissement_id',
      loadOptions: async () => {
        const items = await getEtablissements();
        return items.map((e) => ({
          value: String(e.id),
          label: e.nom || e.libelle || e.code || `#${e.id}`,
        }));
      },
    },
  ],
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
    sigle: str(item.sigle),
    etablissement_id: item.etablissement_id ?? '',
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
    sigle: form.sigle || undefined,
    etablissement_id: numOrUndefined(form.etablissement_id),
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};

export const cyclesConfig: ReferentielCrudConfig<Cycle> = {
  title: 'Cycles',
  subtitle: 'Gestion des cycles de formation',
  breadcrumbLabel: 'Cycles',
  entityName: 'cycle',
  entityNamePlural: 'les cycles',
  createLabel: 'Nouveau cycle',
  searchPlaceholder: 'Rechercher un cycle...',
  fields: [baseFields.code, baseFields.libelle, baseFields.sigle],
  searchKeys: ['code', 'libelle', 'sigle'],
  defaultForm: { code: '', libelle: '', sigle: '' },
  load: getCycles,
  create: createCycle,
  update: updateCycle,
  remove: deleteCycle,
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
    sigle: str(item.sigle),
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
    sigle: form.sigle || undefined,
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};

export const filieresConfig: ReferentielCrudConfig<Filiere> = {
  title: 'Filières',
  subtitle: 'Gestion des filières d\'enseignement',
  breadcrumbLabel: 'Filières',
  entityName: 'filière',
  entityNamePlural: 'les filières',
  createLabel: 'Nouvelle filière',
  searchPlaceholder: 'Rechercher une filière...',
  fields: [
    baseFields.code,
    baseFields.libelle,
    baseFields.sigle,
    { name: 'annee', label: 'Année', colMd: 4 },
    {
      name: 'etablissement_id',
      label: 'Établissement',
      type: 'select',
      colMd: 6,
      showInTable: false,
    },
  ],
  searchKeys: ['code', 'libelle', 'sigle', 'annee'],
  defaultForm: { code: '', libelle: '', sigle: '', annee: '', etablissement_id: '' },
  load: getFilieres,
  create: createFiliere,
  update: updateFiliere,
  remove: deleteFiliere,
  selectFields: [
    {
      name: 'etablissement_id',
      loadOptions: async () => {
        const items = await getEtablissements();
        return items.map((e) => ({
          value: String(e.id),
          label: e.nom || e.libelle || e.code || `#${e.id}`,
        }));
      },
    },
  ],
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
    sigle: str(item.sigle),
    annee: str(item.annee),
    etablissement_id: item.etablissement_id ?? '',
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
    sigle: form.sigle || undefined,
    annee: form.annee || undefined,
    etablissement_id: numOrUndefined(form.etablissement_id),
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};

export const niveauxConfig: ReferentielCrudConfig<Niveau> = {
  title: 'Niveaux',
  subtitle: 'Gestion des niveaux d\'études',
  breadcrumbLabel: 'Niveaux',
  entityName: 'niveau',
  entityNamePlural: 'les niveaux',
  createLabel: 'Nouveau niveau',
  searchPlaceholder: 'Rechercher un niveau...',
  fields: [baseFields.code, baseFields.libelle],
  searchKeys: ['code', 'libelle'],
  defaultForm: { code: '', libelle: '' },
  load: getNiveaux,
  create: createNiveau,
  update: updateNiveau,
  remove: deleteNiveau,
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};

export const modulesConfig: ReferentielCrudConfig<Module> = {
  title: 'Modules',
  subtitle: 'Gestion des modules pédagogiques',
  breadcrumbLabel: 'Modules',
  entityName: 'module',
  entityNamePlural: 'les modules',
  createLabel: 'Nouveau module',
  searchPlaceholder: 'Rechercher un module...',
  fields: [
    baseFields.code,
    baseFields.libelle,
    baseFields.sigle,
    { name: 'vol_horaire', label: 'Volume horaire', colMd: 4 },
    {
      name: 'filiere_id',
      label: 'Filière',
      type: 'select',
      colMd: 6,
      showInTable: false,
    },
  ],
  searchKeys: ['code', 'libelle', 'sigle'],
  defaultForm: { code: '', libelle: '', sigle: '', vol_horaire: '', filiere_id: '' },
  load: getModules,
  create: createModule,
  update: updateModule,
  remove: deleteModule,
  selectFields: [
    {
      name: 'filiere_id',
      loadOptions: async () => {
        const items = await getFilieres();
        return items.map((f) => ({
          value: String(f.id),
          label: f.libelle || f.code || `#${f.id}`,
        }));
      },
    },
  ],
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
    sigle: str(item.sigle),
    vol_horaire: str(item.vol_horaire),
    filiere_id: item.filiere_id ?? '',
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
    sigle: form.sigle || undefined,
    vol_horaire: form.vol_horaire || undefined,
    filiere_id: numOrUndefined(form.filiere_id),
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};

export const matieresConfig: ReferentielCrudConfig<Matiere> = {
  title: 'Matières',
  subtitle: 'Gestion des matières',
  breadcrumbLabel: 'Matières',
  entityName: 'matière',
  entityNamePlural: 'les matières',
  createLabel: 'Nouvelle matière',
  searchPlaceholder: 'Rechercher une matière...',
  fields: [
    baseFields.code,
    baseFields.libelle,
    baseFields.sigle,
    {
      name: 'module_id',
      label: 'Module',
      type: 'select',
      colMd: 6,
      showInTable: false,
    },
    {
      name: 'credit',
      label: 'Crédits ECTS',
      type: 'number',
      colMd: 3,
      placeholder: '3',
      showInTable: true,
      tableHeader: 'ECTS',
    },
    {
      name: 'obligatoire',
      label: 'Obligatoire',
      type: 'select',
      colMd: 3,
      showInTable: true,
      staticOptions: [
        { value: 'true', label: 'Oui' },
        { value: 'false', label: 'Non' },
      ],
    },
  ],
  searchKeys: ['code', 'libelle', 'sigle'],
  defaultForm: { code: '', libelle: '', sigle: '', module_id: '', credit: '3', obligatoire: 'true' },
  load: getMatieres,
  create: createMatiere,
  update: updateMatiere,
  remove: deleteMatiere,
  selectFields: [
    {
      name: 'module_id',
      loadOptions: async () => {
        const items = await getModules();
        return items.map((m) => ({
          value: String(m.id),
          label: m.libelle || m.code || `#${m.id}`,
        }));
      },
    },
  ],
  toForm: (item) => ({
    code: str(item.code),
    libelle: str(item.libelle),
    sigle: str(item.sigle),
    module_id: item.module_id ?? '',
    credit: item.credit != null ? String(item.credit) : '3',
    obligatoire: item.obligatoire === false ? 'false' : 'true',
  }),
  toPayload: (form) => ({
    code: form.code || undefined,
    libelle: form.libelle || undefined,
    sigle: form.sigle || undefined,
    module_id: numOrUndefined(form.module_id),
    credit: numOrUndefined(form.credit) ?? 3,
    obligatoire: form.obligatoire !== 'false',
  }),
  getDisplayLabel: (item) => item.libelle || item.code || `#${item.id}`,
};
