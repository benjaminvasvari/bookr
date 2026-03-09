describe('Regisztráció oldal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Jelentkezz be').click();
    cy.url().should('include', '/login');
    cy.contains('Regisztrálj most!').click();
    cy.url().should('include', '/register');
  });

  it('megjeleníti a regisztrációs form elemeit', () => {
    cy.get('#lastName').should('exist');
    cy.get('#firstName').should('exist');
    cy.get('#email').should('exist');
    cy.get('#phone').should('exist');
    cy.get('#password').should('exist');
    cy.get('#confirmPassword').should('exist');
    cy.get('.btn-submit').should('exist');
  });

  it('már létező email esetén hibaüzenetet jelez', () => {
    cy.get('#lastName').type('Teszt');
    cy.get('#firstName').type('Felhasználó');
    cy.get('#email').type('vasvariben@gmail.com');
    cy.get('#phone').type('+36701234567');
    cy.get('#password').type('CypressJelszo123!');
    cy.get('#confirmPassword').type('CypressJelszo123!');
    cy.get('.btn-submit').click();
    cy.contains('Ez az email cím már regisztrálva van.').should('be.visible');
  });
/*
  it('sikeresen regisztrál egy új felhasználót', () => {
    const timestamp = Date.now();

    cy.get('#lastName').type('Cypress');
    cy.get('#firstName').type('Teszt');
    cy.get('#email').type(`cypress.teszt+${timestamp}@gmail.com`);
    cy.get('#phone').type('+36701234567');
    cy.get('#password').type('CypressJelszo123!');
    cy.get('#confirmPassword').type('CypressJelszo123!');
    cy.get('.btn-submit').click();

    cy.contains('Sikeres regisztráció! Ellenőrizd az email fiókodat a megerősítéshez.').should('be.visible');
    cy.url({ timeout: 5000 }).should('include', '/login');
  });
  */
});