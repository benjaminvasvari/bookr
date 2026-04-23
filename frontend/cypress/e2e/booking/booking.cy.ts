describe('Foglalási folyamat', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.visit('/sel-industry/1');
  });

  it('megnyitja a Jungle cég oldalát', () => {
    cy.contains('Jungle').should('be.visible');
    cy.get('.book-now-button').should('exist');
  });

  it('teljes foglalási folyamat végigmegy', () => {
    // 1. Cég oldal → Foglaljon most
    cy.get('.book-now-button').click();
    cy.url().should('include', '/appointment/1/services');

    // 2. Szolgáltatás kiválasztása
    cy.get('.service-card').first().click();
    cy.get('.continue-btn').should('not.be.disabled');
    cy.get('.continue-btn').click();
    cy.url().should('include', '/appointment/1/specialists');

    // 3. Szakember kiválasztása
    cy.get('.specialist-card').first().click();

    // 4. Nap kiválasztása - első elérhető nem disabled nap
    cy.get('.day-column:not(.disabled)').first().click();

    // Várjuk meg hogy töltse be az időpontokat, ha nincs slot, következő nap
    cy.get('body').then(() => {
      cy.get('.time-slot-btn:not(.unavailable)', { timeout: 5000 }).then(($slots) => {
        if ($slots.length === 0) {
          // Nincs slot ezen a napon, következő nap
          cy.get('.day-column:not(.disabled)').eq(1).click();
        }
      });
    });

    // 5. Időpont kiválasztása
    cy.get('.time-slot-btn:not(.unavailable)', { timeout: 10000 }).first().click();

    // 5. Időpont kiválasztása
    cy.get('.time-slot-btn:not(.unavailable)').first().click();

    // 6. Összegzés gomb
    cy.get('.continue-btn').should('not.be.disabled');
    cy.get('.continue-btn').click();
    cy.url().should('include', '/appointment-payment/1');

    // 7. Fizetési mód kiválasztása
    cy.get('.payment-card').first().click();
    cy.get('.payment-card').first().should('have.class', 'selected');

    // 8. Foglalás véglegesítése
    cy.get('.continue-btn').should('not.be.disabled');
    cy.get('.continue-btn').click();

    // 9. Success overlay megjelenik
    cy.contains('Foglalás sikeresen leadva!').should('be.visible');

    // 10. Visszanavigál a főoldalra
    cy.url({ timeout: 5000 }).should('eq', Cypress.config().baseUrl + '/');
  });
});
