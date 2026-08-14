/// <reference types="cypress" />

describe('Référentiel Management', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Filières', () => {
    beforeEach(() => {
      cy.visit('/admin/referentiel/filieres');
    });

    it('should display filieres list', () => {
      cy.contains(/filières/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should create new filiere', () => {
      cy.contains(/ajouter|nouveau/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('input[name="code"]').type('TEST');
      cy.get('input[name="nom"]').type('Filière Test');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });

    it('should edit filiere', () => {
      cy.get('tbody tr').first().find('button').contains(/modifier|edit/i).click();
      cy.get('.modal input[name="nom"]').clear().type('Updated Filière');
      cy.get('.modal button[type="submit"]').click();
      cy.contains(/modifié|updated/i).should('be.visible');
    });

    it('should delete filiere', () => {
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).click();
      cy.get('.modal button').contains(/confirmer|confirm/i).click();
      cy.contains(/supprimé|deleted/i).should('be.visible');
    });
  });

  describe('Niveaux', () => {
    beforeEach(() => {
      cy.visit('/admin/referentiel/niveaux');
    });

    it('should display niveaux list', () => {
      cy.contains(/niveaux/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should create new niveau', () => {
      cy.contains(/ajouter|nouveau/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('input[name="code"]').type('L4');
      cy.get('input[name="nom"]').type('Licence 4');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });
  });

  describe('Cycles', () => {
    beforeEach(() => {
      cy.visit('/admin/referentiel/cycles');
    });

    it('should display cycles list', () => {
      cy.contains(/cycles/i).should('be.visible');
      cy.get('table').should('be.visible');
    });
  });

  describe('Modules', () => {
    beforeEach(() => {
      cy.visit('/admin/referentiel/modules');
    });

    it('should display modules list', () => {
      cy.contains(/modules/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should filter modules by filiere', () => {
      cy.get('select').first().select(1);
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });
  });

  describe('Matières', () => {
    beforeEach(() => {
      cy.visit('/admin/referentiel/matieres');
    });

    it('should display matieres list', () => {
      cy.contains(/matières/i).should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should create new matiere', () => {
      cy.contains(/ajouter|nouveau/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('input[name="code"]').type('MAT101');
      cy.get('input[name="nom"]').type('Mathématiques');
      cy.get('input[name="coefficient"]').type('3');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });
  });
});
