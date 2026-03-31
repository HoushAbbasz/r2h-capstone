describe("Auth Flow", () => {

  it("registers a new user", () => {
    cy.visit("/login");

    cy.contains("button", "Register").click();

    cy.get('input[type="text"]').type("username5");
    cy.get('input[type="password"]').type("Password1");

    cy.get('input[type="checkbox"]').check();

    cy.contains("button", "Create Account").click();

    cy.contains("Account created! You can now sign in.").should("be.visible");
  });

  it("logs in with the new user", () => {
    cy.visit("/login");

    cy.get('input[type="text"]').type("username5");
    cy.get('input[type="password"]').type("Password1");

    cy.contains("button", "Sign In").click();

    cy.url().should("not.include", "/login");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.not.be.null;
    });
  });

});