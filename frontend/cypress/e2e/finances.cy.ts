describe('Finances Management', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Factures', () => {
    beforeEach(() => {
      cy.visit('/admin/finances/factures');
    });

    it('should display factures list', () => {
      cy.contains(/factures|invoices/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should display facture details', () => {
      cy.get('tbody tr').first().click();
      cy.contains(/détails|details/i).should('be.visible');
    });

    it('should filter factures by status', () => {
      cy.get('select').contains(/statut|status/i).select('paye');
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'Payé');
      });
    });

    it('should search factures by number', () => {
      cy.get('input[placeholder*="echercher"]').type('FAC-2025');
      cy.get('tbody tr').should('contain', 'FAC-2025');
    });
  });

  describe('Paiements', () => {
    beforeEach(() => {
      cy.visit('/admin/finances/paiements');
    });

    it('should display paiements list', () => {
      cy.contains(/paiements|payments/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should create new payment', () => {
      cy.contains(/nouveau|add/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('select[name="facture_id"]').select(1);
      cy.get('input[name="montant"]').type('50000');
      cy.get('select[name="mode_paiement"]').select('especes');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });

    it('should validate payment on confirmation', () => {
      cy.get('tbody tr').first().find('button').contains(/valider|validate/i).click();
      cy.get('.modal button').contains(/confirmer|confirm/i).click();
      cy.contains(/validé|validated/i).should('be.visible');
    });
  });

  describe('Types de Frais', () => {
    beforeEach(() => {
      cy.visit('/admin/finances/types-frais');
    });

    it('should display types de frais list', () => {
      cy.contains(/types de frais|fee types/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should create new type de frais', () => {
      cy.contains(/nouveau|add/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('input[name="code"]').type('TEST');
      cy.get('input[name="nom"]').type('Test Frais');
      cy.get('input[name="montant"]').type('10000');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });

    it('should edit type de frais', () => {
      cy.get('tbody tr').first().find('button').contains(/modifier|edit/i).click();
      cy.get('.modal input[name="montant"]').clear().type('15000');
      cy.get('.modal button[type="submit"]').click();
      cy.contains(/modifié|updated/i).should('be.visible');
    });

    it('should delete type de frais', () => {
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).click();
      cy.get('.modal button').contains(/confirmer|confirm/i).click();
      cy.contains(/supprimé|deleted/i).should('be.visible');
    });
  });

  describe('Statistics', () => {
    it('should display financial statistics on factures page', () => {
      cy.visit('/admin/finances/factures');
      cy.get('[data-testid="stat-card"]').should('have.length.greaterThan', 0);
    });

    it('should display total amounts', () => {
      cy.visit('/admin/finances/factures');
      cy.contains(/total|montant/i).should('be.visible');
    });
  });
});
