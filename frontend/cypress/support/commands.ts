/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.contains('Jelentkezz be').click();
  cy.url().should('include', '/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('.btn-submit').click({ force: true });
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

export {};