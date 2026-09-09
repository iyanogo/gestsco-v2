/**
 * Parcours manuel RBAC actions fines - 4 rôles démo × 9 modules branchés.
 * Reproduit le parcours utilisateur réel (données en table, filtres notes remplis).
 */

const ACCOUNTS = {
  superadmin: { email: 'admin@gestsco.com', password: 'Admin@123' },
  scolarite: { email: 'scolarite@gestsco.com', password: 'Scolarite@123' },
  enseignant: { email: 'e2e-teacher@example.com', password: 'E2E-Portail-2026!' },
  etudiant: { email: 'e2e-manual@example.com', password: 'E2E-Portail-2026!' },
};

const ACTION_SELECTOR = 'button, a.btn';

function loginAs(role: keyof typeof ACCOUNTS) {
  const acc = ACCOUNTS[role];
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest');
  cy.get('input[type="email"]').clear().type(acc.email);
  cy.get('input[type="password"]').clear().type(acc.password);
  cy.get('button[type="submit"]').click();
  cy.wait('@loginRequest', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  cy.window({ timeout: 20000 }).its('localStorage.token').should('exist');
}

function authHeaders() {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    expect(token).to.be.a('string');
    return { Authorization: `Bearer ${token}` };
  });
}

/** Texte visible sur button ou Link.btn - pas de restriction tag `button` seul. */
function assertActionVisible(label: string | RegExp, shouldExist: boolean) {
  if (shouldExist) {
    cy.contains(ACTION_SELECTOR, label, { timeout: 15000 }).should('be.visible');
  } else {
    cy.contains(ACTION_SELECTOR, label).should('not.exist');
  }
}

function assertMuiButtonVisible(label: string | RegExp, shouldExist: boolean) {
  if (shouldExist) {
    cy.contains('button', label, { timeout: 15000 }).should('be.visible');
  } else {
    cy.contains('button', label).should('not.exist');
  }
}

function ensureUniversiteRow() {
  cy.visit('/admin/referentiel/universites');
  assertActionVisible(/Nouvelle université/i, true);

  cy.get('body').then(($body) => {
    if ($body.find('button .bi-pencil, a.btn .bi-pencil').length > 0) {
      return;
    }
    const code = `RBAC-E2E-${Date.now().toString(36).slice(-6)}`;
    cy.contains(ACTION_SELECTOR, /Nouvelle université/i).click();
    cy.get('.modal.show').within(() => {
      cy.contains('label', 'Code').parent().find('input').clear().type(code);
      cy.contains('label', 'Nom').parent().find('input').clear().type(`Université ${code}`);
      cy.contains('button', /Créer/i).click();
    });
    cy.contains(code, { timeout: 15000 }).should('be.visible');
  });
}

function ensureAnneeScolaireRow() {
  cy.visit('/admin/parametrage/annees-scolaires');
  assertActionVisible(/Nouvelle année/i, true);

  cy.get('body').then(($body) => {
    if ($body.find('button .bi-pencil').length > 0) {
      return;
    }
    const code = `RBAC-${Date.now().toString().slice(-4)}`;
    cy.contains(ACTION_SELECTOR, /Nouvelle année/i).click();
    cy.get('.modal.show').within(() => {
      cy.contains('label', 'Code').parent().find('input').clear().type(code);
      cy.contains('label', 'Libellé').parent().find('input').clear().type(`Année test ${code}`);
      cy.contains('button', /Créer|Modifier/i).click();
    });
    cy.contains(code, { timeout: 15000 }).should('be.visible');
  });
}

function ensureTypeFraisRow() {
  cy.visit('/admin/finances/types-frais');
  assertActionVisible(/Nouveau type/i, true);

  cy.get('body').then(($body) => {
    if ($body.find('button .bi-pencil').length > 0) {
      return;
    }
    const code = `RBAC-${Date.now().toString().slice(-5)}`;
    cy.contains(ACTION_SELECTOR, /Nouveau type/i).click();
    cy.get('.modal.show').within(() => {
      cy.contains('label', 'Code').parent().find('input').clear().type(code);
      cy.contains('label', 'Libellé').parent().find('input').clear().type(`Frais test ${code}`);
      cy.contains('button', /Enregistrer/i).click();
    });
    cy.contains(code, { timeout: 15000 }).should('be.visible');
  });
}

interface NotesFilterIds {
  sessionId: string;
  filiereId: string;
  niveauId: string;
  matiereId: string;
  typeEval: string;
}

function fillAdminNotesFiltersAndWaitGrid() {
  authHeaders().then((headers) => {
    cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then((sessResp) => {
      const session = (sessResp.body as Array<{ id: number; statut: string }>).find(
        (s) => s.statut === 'en_cours',
      );
      expect(session, 'session en_cours').to.exist;

      cy.request({ method: 'GET', url: '/api/v1/filieres/', headers }).then((fResp) => {
        cy.request({ method: 'GET', url: '/api/v1/niveaux/', headers }).then((nResp) => {
          cy.request({ method: 'GET', url: '/api/v1/matieres/', headers, qs: { limit: 50 } }).then(
            (mResp) => {
              const filiere = (fResp.body as Array<{ id: number }>)[0];
              const niveau = (nResp.body as Array<{ id: number }>)[0];
              const matiere = (mResp.body as Array<{ id: number }>)[0];
              expect(filiere && niveau && matiere).to.exist;

              const ids: NotesFilterIds = {
                sessionId: String(session!.id),
                filiereId: String(filiere.id),
                niveauId: String(niveau.id),
                matiereId: String(matiere.id),
                typeEval: 'controle_continu',
              };

              cy.visit('/admin/evaluations/notes');
              cy.contains('label', 'Session').parent().find('select').select(ids.sessionId);
              cy.contains('label', 'Filière').parent().find('select').select(ids.filiereId);
              cy.contains('label', 'Niveau').parent().find('select').select(ids.niveauId);
              cy.contains('label', 'Matière').parent().find('select').select(ids.matiereId);
              cy.contains('label', 'Type').parent().find('select').select(ids.typeEval);
              cy.contains('Grille de saisie', { timeout: 20000 }).should('be.visible');
            },
          );
        });
      });
    });
  });
}

function fillTeacherNotesFiltersAndWaitGrid() {
  authHeaders().then((headers) => {
    cy.request({ method: 'GET', url: '/api/v1/seances/mes-matieres-enseignement', headers }).then(
      (scopeResp) => {
        expect(scopeResp.body.length).to.be.greaterThan(0);
        const row = scopeResp.body[0];

        cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then((sessResp) => {
          const session = (sessResp.body as Array<{ id: number; statut: string }>).find(
            (s) => s.statut === 'en_cours',
          );
          expect(session, 'session en_cours').to.exist;

          cy.visit('/enseignant/notes/saisie');
          cy.contains('label', 'Session').parent().find('select').select(String(session!.id));
          cy.contains('label', 'Matière').parent().find('select').select(String(row.matiere_id));
          cy.contains('label', 'Niveau').parent().find('select').select(String(row.niveau_id));
          const filiereId = row.filiere_id
            ? String(row.filiere_id)
            : null;
          cy.contains('label', 'Filière')
            .parent()
            .find('select')
            .then(($select) => {
              const val =
                filiereId ||
                $select.find('option[value]:not([value=""])').first().val();
              expect(val, 'filière dans le scope enseignant').to.exist;
              cy.wrap($select).select(String(val));
            });
          cy.contains('label', 'Type').parent().find('select').select('controle_continu');
          cy.contains('Grille de saisie', { timeout: 20000 }).should('be.visible');
        });
      },
    );
  });
}

describe('RBAC actions fines - parcours manuel 4 rôles', () => {
  describe('Superadmin (admin@gestsco.com → rôle résolu superadmin)', () => {
    beforeEach(() => {
      loginAs('superadmin');
      cy.url({ timeout: 15000 }).should('match', /\/admin\//);
    });

    it('1 Référentiel - créer sur table vide, edit/delete si ligne', () => {
      ensureUniversiteRow();
      assertActionVisible(/Nouvelle université/i, true);
      cy.get('button .bi-pencil, a.btn .bi-pencil').should('exist');
      cy.get('button .bi-trash').should('exist');
    });

    it('2 Paramétrage Années - créer si vide, edit si ligne', () => {
      ensureAnneeScolaireRow();
      assertActionVisible(/Nouvelle année/i, true);
      cy.get('button .bi-pencil').should('exist');
    });

    it('3 Paramétrage Barèmes - CRUD visible', () => {
      cy.visit('/admin/parametrage/baremes');
      assertMuiButtonVisible(/Nouveau barème/i, true);
    });

    it('4 Paramétrage Pays - CRUD visible', () => {
      cy.visit('/admin/parametrage/pays');
      assertMuiButtonVisible(/Nouveau pays/i, true);
    });

    it('5 Étudiants - CRUD + Exporter visible', () => {
      cy.visit('/admin/etudiants');
      assertActionVisible(/Nouvel étudiant/i, true);
      assertActionVisible(/Exporter/i, true);
      cy.get('a.btn .bi-pencil').should('exist');
      cy.get('button .bi-trash').should('exist');
    });

    it('6 Délibérations - create/validate visible', () => {
      cy.visit('/admin/evaluations/deliberations');
      assertActionVisible(/Lancer une délibération/i, true);
    });

    it('7 Résultats - Calculer visible', () => {
      cy.visit('/admin/evaluations/resultats');
      assertActionVisible(/Calculer/i, true);
    });

    it('8 Notes admin - Enregistrer après filtres', () => {
      fillAdminNotesFiltersAndWaitGrid();
      assertActionVisible(/Enregistrer/i, true);
    });

    it('9 Finances TypesFrais - créer si vide, edit si ligne', () => {
      ensureTypeFraisRow();
      assertActionVisible(/Nouveau type/i, true);
      cy.get('button .bi-pencil').should('exist');
    });

    it('10 EDT Créneaux - write visible (superadmin only)', () => {
      cy.visit('/admin/emploi-temps/creneaux');
      assertActionVisible(/Nouveau créneau/i, true);
      cy.contains('Consultation seule').should('not.exist');
    });

    it('11 EDT Planning - Nouvelle séance + export visible', () => {
      cy.visit('/admin/emploi-temps/planning');
      assertMuiButtonVisible(/Nouvelle séance/i, true);
      assertMuiButtonVisible(/Export Excel/i, true);
    });

    it('12 Stages - Nouveau stage visible', () => {
      cy.visit('/admin/stages');
      assertActionVisible(/Nouveau stage/i, true);
    });

    it('13 Utilisateurs - CRUD visible (superadmin only)', () => {
      cy.visit('/admin/utilisateurs');
      assertActionVisible(/Nouvel utilisateur/i, true);
      cy.get('button .bi-pencil').should('exist');
      cy.get('button .bi-key').should('exist');
      cy.get('button .bi-trash').should('exist');
    });

    it('14 Administration - matrice RBAC visible', () => {
      cy.visit('/admin/administration/permissions');
      cy.contains(/Matrice RBAC active/i).should('be.visible');
    });
  });

  describe('Scolarité', () => {
    beforeEach(() => {
      loginAs('scolarite');
      cy.url({ timeout: 15000 }).should('match', /\/admin\//);
    });

    it('1 Référentiel - route bloquée (pas de CRUD)', () => {
      cy.visit('/admin/referentiel/universites');
      cy.url({ timeout: 10000 }).should('not.include', '/referentiel/universites');
      cy.contains(ACTION_SELECTOR, /Nouvelle université/i).should('not.exist');
    });

    it('2 Paramétrage Années - route bloquée', () => {
      cy.visit('/admin/parametrage/annees-scolaires');
      cy.url({ timeout: 10000 }).should('not.include', '/parametrage/annees-scolaires');
    });

    it('3 Paramétrage Barèmes - route bloquée', () => {
      cy.visit('/admin/parametrage/baremes');
      cy.url({ timeout: 10000 }).should('not.include', '/parametrage/baremes');
    });

    it('4 Paramétrage Pays - route bloquée', () => {
      cy.visit('/admin/parametrage/pays');
      cy.url({ timeout: 10000 }).should('not.include', '/parametrage/pays');
    });

    it('5 Étudiants - CRUD + Exporter visible', () => {
      cy.visit('/admin/etudiants');
      assertActionVisible(/Nouvel étudiant/i, true);
      assertActionVisible(/Exporter/i, true);
      cy.get('a.btn .bi-pencil').should('exist');
      cy.get('button .bi-trash').should('exist');
    });

    it('6 Délibérations - actions visibles', () => {
      cy.visit('/admin/evaluations/deliberations');
      assertActionVisible(/Lancer une délibération/i, true);
    });

    it('7 Résultats - Calculer visible', () => {
      cy.visit('/admin/evaluations/resultats');
      assertActionVisible(/Calculer/i, true);
    });

    it('8 Notes - Enregistrer après filtres', () => {
      fillAdminNotesFiltersAndWaitGrid();
      assertActionVisible(/Enregistrer/i, true);
    });

    it('9 Finances TypesFrais - CRUD visible', () => {
      cy.visit('/admin/finances/types-frais');
      assertActionVisible(/Nouveau type/i, true);
    });

    it('10 EDT Créneaux - lecture seule (pas de write)', () => {
      cy.visit('/admin/emploi-temps/creneaux');
      cy.contains('Consultation seule', { timeout: 12000 }).should('be.visible');
      cy.contains(ACTION_SELECTOR, /Nouveau créneau/i).should('not.exist');
    });

    it('11 EDT Planning - Nouvelle séance + export visible', () => {
      cy.visit('/admin/emploi-temps/planning');
      assertMuiButtonVisible(/Nouvelle séance/i, true);
      assertMuiButtonVisible(/Export Excel/i, true);
    });

    it('12 Stages - Nouveau stage visible', () => {
      cy.visit('/admin/stages');
      assertActionVisible(/Nouveau stage/i, true);
    });

    it('13 Utilisateurs - route bloquée', () => {
      cy.visit('/admin/utilisateurs');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/utilisateurs');
      cy.contains(/Nouvel utilisateur/i).should('not.exist');
    });

    it('14 Administration - route bloquée', () => {
      cy.visit('/admin/administration/permissions');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/administration/permissions');
    });
  });

  describe('Enseignant (portail)', () => {
    beforeEach(() => {
      loginAs('enseignant');
      cy.url({ timeout: 15000 }).should('include', '/enseignant/');
    });

    it('1-4 Référentiel/Paramétrage - accès admin refusé', () => {
      cy.visit('/admin/referentiel/universites');
      cy.url({ timeout: 10000 }).should('not.include', '/referentiel/');
      cy.visit('/admin/parametrage/baremes');
      cy.url({ timeout: 10000 }).should('not.include', '/parametrage/baremes');
      cy.visit('/admin/utilisateurs');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/utilisateurs');
    });

    it('5 Étudiants admin - accès refusé', () => {
      cy.visit('/admin/etudiants');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/etudiants');
    });

    it('6 Délibérations admin - accès refusé', () => {
      cy.visit('/admin/evaluations/deliberations');
      cy.url({ timeout: 10000 }).should('not.include', '/deliberations');
    });

    it('7 Résultats admin - accès refusé ; portail lecture seule', () => {
      cy.visit('/admin/evaluations/resultats');
      cy.url({ timeout: 10000 }).should('not.include', '/evaluations/resultats');
      cy.visit('/enseignant/resultats');
      cy.contains('Consultation en lecture seule', { timeout: 12000 }).should('be.visible');
      cy.contains(ACTION_SELECTOR, /Calculer/i).should('not.exist');
    });

    it('8 Notes portail - Enregistrer après filtres (scope matières)', () => {
      fillTeacherNotesFiltersAndWaitGrid();
      assertActionVisible(/Enregistrer/i, true);
    });

    it('9 Finances admin - accès refusé', () => {
      cy.visit('/admin/finances/types-frais');
      cy.url({ timeout: 10000 }).should('not.include', '/finances/types-frais');
    });

    it('10-11 EDT admin - accès refusé ; pas export/création portail', () => {
      cy.visit('/admin/emploi-temps/planning');
      cy.url({ timeout: 10000 }).should('not.include', '/emploi-temps/planning');
      cy.visit('/enseignant/emploi-temps');
      cy.contains('button', /Nouvelle séance/i).should('not.exist');
      cy.contains('button', /Export Excel/i).should('not.exist');
    });

    it('12 Stages admin - accès refusé ; portail lecture stages encadrés', () => {
      cy.visit('/admin/stages');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/stages');
      cy.visit('/enseignant/stages');
      cy.contains(ACTION_SELECTOR, /Nouveau stage/i).should('not.exist');
    });
  });

  describe('Étudiant (portail)', () => {
    beforeEach(() => {
      loginAs('etudiant');
      cy.url({ timeout: 15000 }).should('include', '/etudiant/');
    });

    it('1-4 Admin référentiel/paramétrage - accès refusé', () => {
      cy.visit('/admin/referentiel/universites');
      cy.url({ timeout: 10000 }).should('not.include', '/referentiel/');
      cy.visit('/admin/utilisateurs');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/utilisateurs');
    });

    it('5 Étudiants admin - accès refusé', () => {
      cy.visit('/admin/etudiants');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/etudiants');
    });

    it('6-8 Évaluations admin - accès refusé', () => {
      cy.visit('/admin/evaluations/deliberations');
      cy.url({ timeout: 10000 }).should('not.include', '/deliberations');
      cy.visit('/admin/evaluations/notes');
      cy.url({ timeout: 10000 }).should('not.include', '/evaluations/notes');
    });

    it('7 Résultats portail - lecture seule sans Calculer', () => {
      cy.visit('/etudiant/resultats');
      cy.contains(ACTION_SELECTOR, /Calculer/i).should('not.exist');
      cy.contains(ACTION_SELECTOR, /Enregistrer/i).should('not.exist');
    });

    it('9 Finances portail - pas de CRUD types frais', () => {
      cy.visit('/admin/finances/types-frais');
      cy.url({ timeout: 10000 }).should('not.include', '/finances/types-frais');
      cy.visit('/etudiant/finances/factures');
      cy.contains(ACTION_SELECTOR, /Nouveau type/i).should('not.exist');
    });

    it('10-11 EDT - pas de création séance ni export', () => {
      cy.visit('/admin/emploi-temps/planning');
      cy.url({ timeout: 10000 }).should('not.include', '/emploi-temps/planning');
      cy.visit('/etudiant/emploi-temps');
      cy.contains('button', /Nouvelle séance/i).should('not.exist');
      cy.contains('button', /Export Excel/i).should('not.exist');
    });

    it('12 Stages admin - accès refusé', () => {
      cy.visit('/admin/stages');
      cy.url({ timeout: 10000 }).should('not.include', '/admin/stages');
    });
  });
});
