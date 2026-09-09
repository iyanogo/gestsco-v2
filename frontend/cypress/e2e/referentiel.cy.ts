/**
 * E2E Référentiel - parcours CRUD réel (8 sous-menus LMD + hiérarchie).
 * Compte : admin@gestsco.com / Admin@123 (superuser)
 */

const SUFFIX = Date.now().toString(36).slice(-6);

function field(label: string) {
  return cy.contains('label', label).parent().find('input, select');
}

function openCreate(label: RegExp) {
  cy.contains('button', label).click();
  cy.get('.modal.show').should('be.visible');
}

function saveModal(isEdit = false) {
  cy.get('.modal.show').within(() => {
    cy.contains('button', isEdit ? /Modifier/i : /Créer/i).click();
  });
  cy.get('.modal.show', { timeout: 15000 }).should('not.exist');
}

describe('Référentiel - CRUD complet', () => {
  beforeEach(() => {
    cy.login();
  });

  it('1 Universités - liste + CRUD', () => {
    const code = `UNI-${SUFFIX}`;
    cy.visit('/admin/referentiel/universites');
    cy.contains('button', /Nouvelle université/i).should('be.visible');
    cy.get('table').should('be.visible');

    openCreate(/Nouvelle université/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Nom').clear().type(`Université ${SUFFIX}`);
    });
    saveModal(false);
    cy.contains(code).should('be.visible');

    cy.contains('tr', code).find('button .bi-pencil').click();
    cy.get('.modal.show').within(() => {
      field('Nom').clear().type(`Université modifiée ${SUFFIX}`);
    });
    saveModal(true);
    cy.contains(`Université modifiée ${SUFFIX}`).should('be.visible');
  });

  it('2 Établissements - CRUD avec université', () => {
    const etabCode = `ETB-${SUFFIX}`;
    cy.visit('/admin/referentiel/etablissements');
    openCreate(/Nouvel établissement/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(etabCode);
      field('Nom').clear().type(`Établissement ${SUFFIX}`);
      cy.contains('label', 'Université').parent().find('select').then(($sel) => {
        const val = $sel.find('option[value]:not([value=""])').first().val();
        expect(val).to.exist;
        cy.wrap($sel).select(String(val));
      });
    });
    saveModal(false);
    cy.contains(etabCode).should('be.visible');
  });

  it('3 Départements - CRUD avec établissement', () => {
    const code = `DEP-${SUFFIX}`;
    cy.visit('/admin/referentiel/departements');
    openCreate(/Nouveau département/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Département ${SUFFIX}`);
      cy.contains('label', 'Établissement').parent().find('select').then(($sel) => {
        const val = $sel.find('option[value]:not([value=""])').first().val();
        expect(val).to.exist;
        cy.wrap($sel).select(String(val));
      });
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('4 Cycles - CRUD autonome', () => {
    const code = `CYC-${SUFFIX}`;
    cy.visit('/admin/referentiel/cycles');
    openCreate(/Nouveau cycle/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Cycle ${SUFFIX}`);
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('5 Filières - CRUD avec établissement', () => {
    const code = `FIL-${SUFFIX}`;
    cy.visit('/admin/referentiel/filieres');
    openCreate(/Nouvelle filière/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Filière ${SUFFIX}`);
      cy.contains('label', 'Établissement').parent().find('select').then(($sel) => {
        const val = $sel.find('option[value]:not([value=""])').first().val();
        expect(val).to.exist;
        cy.wrap($sel).select(String(val));
      });
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('6 Niveaux - CRUD autonome', () => {
    const code = `NIV-${SUFFIX}`;
    cy.visit('/admin/referentiel/niveaux');
    openCreate(/Nouveau niveau/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Niveau ${SUFFIX}`);
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('7 Modules - CRUD avec filière', () => {
    const code = `MOD-${SUFFIX}`;
    cy.visit('/admin/referentiel/modules');
    openCreate(/Nouveau module/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Module ${SUFFIX}`);
      cy.contains('label', 'Filière').parent().find('select').then(($sel) => {
        const val = $sel.find('option[value]:not([value=""])').first().val();
        expect(val).to.exist;
        cy.wrap($sel).select(String(val));
      });
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('8 Matières - CRUD avec module', () => {
    const code = `MAT-${SUFFIX}`;
    cy.visit('/admin/referentiel/matieres');
    openCreate(/Nouvelle matière/i);
    cy.get('.modal.show').within(() => {
      field('Code').clear().type(code);
      field('Libellé').clear().type(`Matière ${SUFFIX}`);
      cy.contains('label', 'Module').parent().find('select').then(($sel) => {
        const val = $sel.find('option[value]:not([value=""])').first().val();
        expect(val).to.exist;
        cy.wrap($sel).select(String(val));
      });
      field('Crédits ECTS').clear().type('3');
    });
    saveModal(false);
    cy.contains(code).should('be.visible');
  });

  it('9 Scolarité - accès référentiel refusé', () => {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.intercept('POST', '**/api/v1/auth/login').as('loginSco');
    cy.get('input[type="email"]').clear().type('scolarite@gestsco.com');
    cy.get('input[type="password"]').clear().type('Scolarite@123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginSco');
    cy.visit('/admin/referentiel/universites');
    cy.url({ timeout: 10000 }).should('not.include', '/referentiel/universites');
  });
});
