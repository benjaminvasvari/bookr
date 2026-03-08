describe('Page loads', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  })

  it('Page loads', function() {
    cy.visit('http://localhost:4200')
    cy.get('span.bookr-text').should('be.visible');
    cy.get('img[alt="Barber tools"]').should('be.visible');
    cy.get('div.user-profile-icon svg[xmlns="http://www.w3.org/2000/svg"][viewBox="0 0 24 24"]').should('be.visible');
    
  });
});

it('login with valid data', function() {
  cy.visit('http://localhost:4200/')
  cy.get('button[routerlink="/login"]').click();
  cy.get('#email').click();
  cy.get('#email').type('cypress@cypress.com');
  cy.get('#password').click();
  cy.get('#password').type('Cypress123@');
  cy.get('button.btn-submit').click();
  cy.get('span.welcome-text').should('be.visible');
  cy.get('span.welcome-text').should('have.text', ' Üdv, Cypress! ');
  cy.get('button.login-button').click();
  cy.get('button[routerlink="/login"]').should('be.visible');
  cy.get('h1.login-title').should('be.visible');
});

it('register valid data', function() {
  cy.visit(' http://localhost:4200/')
  cy.get('button[routerlink="/login"]').click();
  cy.get('a.register-link').click();
  cy.get('#lastName').click();
  cy.get('#lastName').type('Csicska');
  cy.get('#firstName').click();
  cy.get('#firstName').type('Cypress');
  cy.get('#email').click();
  cy.get('#email').type('cypress@cypress.com');
  cy.get('#phone').click();
  cy.get('#phone').type('+36703649843');
  cy.get('#password').click();
  cy.get('#password').type('Cypress123@');
  cy.get('#confirmPassword').click();
  cy.get('#confirmPassword').type('Cypress123@');
  cy.get('button.btn-submit').click();
});
