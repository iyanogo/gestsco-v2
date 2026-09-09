/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      waitForApi(alias: string): Chainable<void>;
    }
  }
}

// Login command - mot de passe aligné init_db (Admin@123)
Cypress.Commands.add('login', (email = 'admin@gestsco.com', password = 'Admin@123') => {
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.intercept('POST', '**/api/v1/auth/login').as('loginRequest');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  cy.wait('@loginRequest', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  cy.url({ timeout: 20000 }).should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Get element by test ID
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Wait for API call to complete
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`);
});

export {};
