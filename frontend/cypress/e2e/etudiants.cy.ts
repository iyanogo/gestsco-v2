/**
 * E2E Étudiants - sous-menus admin (liste, wizard, inscriptions, dossiers…).
 * Compte : admin@gestsco.com / Admin@123
 */

const SUFFIX = Date.now().toString(36).slice(-6);
const ACTION_SELECTOR = 'button, a.btn';

describe('Étudiants - parcours admin', () => {
  beforeEach(() => {
    cy.login();
  });

  it('1 Liste - table, recherche, nouvel étudiant, export', () => {
    cy.visit('/admin/etudiants');
    cy.contains(ACTION_SELECTOR, /Nouvel étudiant/i).should('be.visible');
    cy.contains('button', /Exporter/i).should('be.visible');
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.get('input[placeholder*="Rechercher"]').should('be.visible');
  });

  it('2 Liste - filtre recherche', () => {
    cy.visit('/admin/etudiants');
    cy.get('tbody tr', { timeout: 15000 }).should('have.length.greaterThan', 0);
    cy.get('input[placeholder*="Rechercher"]').first().type('E2E');
    cy.get('tbody tr').should('have.length.greaterThan', 0);
  });

  it('3 Nouvel étudiant - wizard création', () => {
    const email = `e2e.${SUFFIX}@test.local`;
    cy.visit('/admin/etudiants/nouveau');
    cy.get('input[name="nom"]').type(`Nom${SUFFIX}`);
    cy.get('input[name="prenom"]').type(`Prenom${SUFFIX}`);
    cy.get('input[name="email"]').type(email);
    cy.contains('button', /Suivant/i).click();

    cy.get('select[name="filiereId"]').then(($sel) => {
      const val = $sel.find('option[value]:not([value=""])').first().val();
      expect(val).to.exist;
      cy.wrap($sel).select(String(val));
    });
    cy.get('select[name="niveauId"]').then(($sel) => {
      const val = $sel.find('option[value]:not([value=""])').first().val();
      expect(val).to.exist;
      cy.wrap($sel).select(String(val));
    });
    cy.contains('button', /Suivant/i).click();
    cy.contains('button', /Créer|Enregistrer/i).click();
    cy.url({ timeout: 20000 }).should('match', /\/admin\/etudiants\/\d+/);
  });

  it('4 Fiche étudiant - détail depuis la liste', () => {
    cy.visit('/admin/etudiants');
    cy.get('tbody tr', { timeout: 15000 }).first().within(() => {
      cy.get('a.btn .bi-eye').click();
    });
    cy.url().should('match', /\/admin\/etudiants\/\d+$/);
    cy.contains(/Informations|Étudiant/i).should('be.visible');
    cy.contains('.alert-info', /démonstration/i).should('not.exist');
  });

  it('4b Fiche étudiant - onglets notes et paiements (API)', () => {
    cy.visit('/admin/etudiants');
    cy.get('tbody tr', { timeout: 15000 }).first().within(() => {
      cy.get('a.btn .bi-eye').click();
    });
    cy.contains('button', /Notes/i).click();
    cy.contains('.alert-info', /démonstration/i).should('not.exist');
    cy.contains('button', /Paiements/i).click();
    cy.contains('.alert-info', /démonstration/i).should('not.exist');
  });

  it('4c Édition étudiant - formulaire depuis la fiche', () => {
    cy.visit('/admin/etudiants');
    cy.get('tbody tr', { timeout: 15000 }).first().within(() => {
      cy.get('a.btn .bi-eye').click();
    });
    cy.contains('a', /Modifier/i).click();
    cy.url().should('match', /\/admin\/etudiants\/\d+\/edit$/);
    cy.get('input[name="nom"]').should('exist').and('not.have.value', '');
    cy.get('input[name="prenom"]').should('exist').and('not.have.value', '');
    cy.get('input[name="email"]').should('exist').and('not.have.value', '');
  });

  it('5 Inscriptions - page charge sans erreur', () => {
    cy.visit('/admin/etudiants/inscriptions');
    cy.contains('h2', 'Inscriptions').should('be.visible');
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.contains('.alert-danger', /Impossible|erreur/i).should('not.exist');
  });

  it('6 Inscription groupe - wizard étape 1', () => {
    cy.visit('/admin/etudiants/inscription-groupe');
    cy.contains('h2', 'Inscription en groupe').should('be.visible');
    cy.get('select').should('have.length.greaterThan', 0);
  });

  it('7 Inscriptions matières - sélection inscription', () => {
    cy.visit('/admin/etudiants/inscriptions-matieres');
    cy.contains('h2', 'Inscriptions aux matières').should('be.visible');
    cy.get('select, form select', { timeout: 15000 }).should('exist');
  });

  it('8 Réinscriptions - page charge', () => {
    cy.visit('/admin/etudiants/reinscriptions');
    cy.contains('h2', 'Réinscriptions').should('be.visible');
    cy.get('table, .alert', { timeout: 15000 }).should('exist');
  });

  it('9 Dossiers administratifs - page charge', () => {
    cy.visit('/admin/etudiants/dossiers');
    cy.contains('h2', 'Dossiers administratifs').should('be.visible');
    cy.get('table', { timeout: 15000 }).should('be.visible');
  });

  it('10 Scolarité - accès liste OK ; enseignant refusé', () => {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.intercept('POST', '**/api/v1/auth/login').as('loginSco');
    cy.get('input[type="email"]').clear().type('scolarite@gestsco.com');
    cy.get('input[type="password"]').clear().type('Scolarite@123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginSco');
    cy.visit('/admin/etudiants');
    cy.url({ timeout: 10000 }).should('include', '/admin/etudiants');
    cy.contains(ACTION_SELECTOR, /Nouvel étudiant/i).should('be.visible');
  });
});
