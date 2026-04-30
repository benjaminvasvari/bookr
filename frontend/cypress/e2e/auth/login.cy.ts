describe('Login oldal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Jelentkezz be').click();
    cy.url().should('include', '/login');
  });

  it('megjeleníti a login form elemeit', () => {
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');
    cy.get('.btn-submit').should('exist');
  });

  it('a submit gomb disabled amíg a form invalid', () => {
    cy.get('.btn-submit').should('be.disabled');
  });

  it('érvénytelen email formátumnál pirosra vált az email mező', () => {
    cy.get('#email').type('nemvalidemail');
    cy.get('#email').blur();
    cy.get('#email').should('have.class', 'invalid');
  });

  it('8 karakternél rövidebb jelszónál pirosra vált a jelszó mező', () => {
    cy.get('#password').type('rövid');
    cy.get('#password').blur();
    cy.get('#password').should('have.class', 'invalid');
  });

  it('hibás credentials esetén backend hibaüzenetet jelez', () => {
    cy.get('#email').type('nemletezik@teszt.hu');
    cy.get('#password').type('Jelszo123!');
    cy.get('.btn-submit').click({ force: true });
    cy.contains('Rossz email cím vagy jelszó.').should('be.visible');
  });

  it('helyes adatokkal bejelentkezik és főoldalra navigál', () => {
    cy.get('#email').type(Cypress.env('TEST_EMAIL'));
    cy.get('#password').type(Cypress.env('TEST_PASSWORD'));
    cy.get('.btn-submit').click({ force: true });
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});