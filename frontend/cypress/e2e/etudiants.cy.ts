describe('Étudiants Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/admin/etudiants');
  });

  describe('Students List', () => {
    it('should display students list page', () => {
      cy.contains(/étudiants|students/i).should('be.visible');
    });

    it('should display students table', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should display search input', () => {
      cy.get('input[placeholder*="echercher"]').should('be.visible');
    });

    it('should display add student button', () => {
      cy.contains(/ajouter|nouveau|add/i).should('be.visible');
    });
  });

  describe('Search and Filter', () => {
    it('should filter students by search term', () => {
      cy.get('input[placeholder*="echercher"]').type('Diallo');
      cy.get('tbody tr').should('contain', 'Diallo');
    });

    it('should show no results for non-matching search', () => {
      cy.get('input[placeholder*="echercher"]').type('NonExistentName123');
      cy.contains(/aucun|no result/i).should('be.visible');
    });

    it('should clear search and show all students', () => {
      cy.get('input[placeholder*="echercher"]').type('Diallo');
      cy.get('input[placeholder*="echercher"]').clear();
      cy.get('tbody tr').should('have.length.greaterThan', 1);
    });
  });

  describe('Add Student', () => {
    it('should navigate to add student page', () => {
      cy.contains(/ajouter|nouveau|add/i).click();
      cy.url().should('include', '/nouveau');
    });

    it('should display add student form', () => {
      cy.visit('/admin/etudiants/nouveau');
      cy.get('form').should('be.visible');
      cy.get('input[name="nom"]').should('be.visible');
      cy.get('input[name="prenom"]').should('be.visible');
    });

    it('should create a new student', () => {
      cy.visit('/admin/etudiants/nouveau');
      
      // Step 1: Personal info
      cy.get('input[name="nom"]').type('TestNom');
      cy.get('input[name="prenom"]').type('TestPrenom');
      cy.get('input[name="email"]').type('test@email.com');
      cy.get('input[name="dateNaissance"]').type('2000-01-01');
      cy.contains(/suivant|next/i).click();
      
      // Step 2: Academic info
      cy.get('select[name="filiere"]').select(1);
      cy.get('select[name="niveau"]').select(1);
      cy.contains(/suivant|next/i).click();
      
      // Step 3: Documents (skip)
      cy.contains(/créer|create/i).click();
      
      cy.contains(/succès|success/i).should('be.visible');
    });
  });

  describe('View Student Details', () => {
    it('should navigate to student details page', () => {
      cy.get('tbody tr').first().click();
      cy.url().should('match', /\/etudiants\/\d+/);
    });

    it('should display student information', () => {
      cy.get('tbody tr').first().find('a').first().click();
      cy.contains(/informations|details/i).should('be.visible');
    });
  });

  describe('Edit Student', () => {
    it('should open edit modal', () => {
      cy.get('tbody tr').first().find('button').contains(/modifier|edit/i).click();
      cy.get('.modal').should('be.visible');
    });

    it('should update student information', () => {
      cy.get('tbody tr').first().find('button').contains(/modifier|edit/i).click();
      cy.get('.modal input[name="nom"]').clear().type('UpdatedName');
      cy.get('.modal button[type="submit"]').click();
      cy.contains(/succès|success|updated/i).should('be.visible');
    });
  });

  describe('Delete Student', () => {
    it('should show confirmation dialog', () => {
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).click();
      cy.contains(/confirmer|confirm/i).should('be.visible');
    });

    it('should delete student on confirmation', () => {
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).click();
      cy.get('.modal button').contains(/confirmer|confirm|oui|yes/i).click();
      cy.contains(/supprimé|deleted/i).should('be.visible');
    });

    it('should cancel deletion', () => {
      const initialCount = Cypress.$('tbody tr').length;
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).click();
      cy.get('.modal button').contains(/annuler|cancel|non|no/i).click();
      cy.get('tbody tr').should('have.length', initialCount);
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      cy.get('[data-testid="pagination"]').should('be.visible');
    });

    it('should navigate to next page', () => {
      cy.get('[data-testid="next-page"]').click();
      cy.url().should('include', 'page=2');
    });
  });

  describe('Export', () => {
    it('should have export button', () => {
      cy.contains(/exporter|export/i).should('be.visible');
    });
  });
});
