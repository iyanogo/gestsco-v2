/**
 * E2E Stages & Soutenances - parcours admin.
 * Compte : admin@gestsco.com / Admin@123
 */

const ACTION_SELECTOR = 'button, a.btn';

describe('Stages & Soutenances - parcours admin', () => {
  beforeEach(() => {
    cy.login();
  });

  it('1 Liste stages - table, stats, nouveau stage', () => {
    cy.visit('/admin/stages');
    cy.contains('h1', /Gestion des Stages/i).should('be.visible');
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.contains(ACTION_SELECTOR, /Nouveau stage/i).should('be.visible');
    cy.contains('.alert-danger', /Impossible/i).should('not.exist');
  });

  it('2 Liste stages - recherche et filtres', () => {
    cy.visit('/admin/stages');
    cy.get('input[placeholder*="Rechercher"]', { timeout: 15000 }).should('be.visible');
    cy.get('select').should('have.length.greaterThan', 0);
  });

  it('3 Nouveau stage - wizard étape 1', () => {
    cy.visit('/admin/stages/nouveau');
    cy.contains('h1', /Nouveau stage/i).should('be.visible');
    cy.contains(/Étape 1/i).should('be.visible');
    cy.get('select').should('have.length.greaterThan', 0);
  });

  it('4 Fiche stage - détail depuis la liste', () => {
    cy.visit('/admin/stages');
    cy.get('tbody tr', { timeout: 15000 }).then(($rows) => {
      if ($rows.length === 0) {
        cy.log('Aucun stage en base - test ignoré');
        return;
      }
      cy.wrap($rows.first()).click();
      cy.url().should('match', /\/admin\/stages\/\d+$/);
      cy.contains(/Informations|Stage/i).should('be.visible');
    });
  });

  it('5 Soutenances - liste charge sans erreur', () => {
    cy.visit('/admin/soutenances');
    cy.contains('h1', /Soutenances/i).should('be.visible');
    cy.contains(/Toutes les soutenances|Aucune soutenance/i, { timeout: 15000 }).should('be.visible');
    cy.contains('.alert-danger', /Impossible/i).should('not.exist');
  });

  it('6 Soutenances - onglet calendrier (plus de placeholder)', () => {
    cy.visit('/admin/soutenances');
    cy.contains('button', /Calendrier/i).click();
    cy.contains(/version ultérieure/i).should('not.exist');
  });

  it('7 Navigation stages → soutenances', () => {
    cy.visit('/admin/stages');
    cy.contains('h1', /Gestion des Stages/i).should('be.visible');
    cy.visit('/admin/soutenances');
    cy.url().should('include', '/admin/soutenances');
    cy.contains('h1', /Soutenances/i).should('be.visible');
  });

  it('8 Scolarité - accès stages OK', () => {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.intercept('POST', '**/api/v1/auth/login').as('loginSco');
    cy.get('input[type="email"]').clear().type('scolarite@gestsco.com');
    cy.get('input[type="password"]').clear().type('Scolarite@123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginSco');
    cy.visit('/admin/stages');
    cy.url({ timeout: 10000 }).should('include', '/admin/stages');
    cy.get('table', { timeout: 15000 }).should('be.visible');
  });
});
