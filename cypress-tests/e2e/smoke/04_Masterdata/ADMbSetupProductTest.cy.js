describe('Master Data - Product and Pricing Setup', () => {
    beforeEach(() => {
        cy.cleanupEtendo();

        // Ignore hydration errors that don't affect the tests
        cy.on('uncaught:exception', (err) => {
            // Ignore hydration errors that don't affect the test s
            return !err.message.includes('Hydration failed');
        });
    });

    it('Configure price lists, schemas, attributes and create product', () => {
        cy.loginToEtendo('admin', 'admin', { useSession: false });
        cy.wait(1000);

        cy.get('.h-14 > div > .transition > svg > path').click();
        cy.wait(1000)
        cy.typeInGlobalSearch('price');
        cy.wait(1000)
        // open price list tab
        cy.get('[data-testid="MenuTitle__310"] > .flex.overflow-hidden > .relative').click();
        cy.wait(1000)

        cy.clickNewRecord();

        cy.typeName('standar');

        cy.clickSave();
        cy.wait(1000)
        cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
        cy.wait(1000)

        // open lines subtab 
        cy.contains('button', 'Lines', { timeout: 20000 })
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        cy.wait(1000)
        cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
        cy.wait(1000)
        cy.get('input[aria-label="Surcharge List Price Amount"]', { timeout: 20000 })
            .filter(':visible')
            .clear()
            .type('1');

        cy.get('button.toolbar-button-save')
            .eq(1)
            .click();
        cy.wait(1000)
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        cy.wait(1000)
        cy.get('button.toolbar-button-cancel', { timeout: 20000 })
            .filter(':visible')
            .not(':disabled')
            .first()
            .click();

        cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();

        cy.typeName('spain_pricelist');
        cy.wait(1000)

        cy.clickSave();
        cy.wait(1000)
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        cy.wait(1000)

        cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
        cy.wait(1000)
        cy.get('input[aria-label="List Price Discount %"]', { timeout: 20000 })
            .should('have.length', 1)
            .clear()
            .type('10');

        cy.wait(1000)
        cy.clickSave();
        cy.wait(1000)
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        cy.wait(1000)
        // navigate to the price list window
        cy.typeInGlobalSearch('price');
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__132"]').click();
        cy.wait(1000)
        // create base price list
        cy.clickNewRecord();

        cy.typeName('Wholesale_pricelist ');

        cy.clickSave();
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        // navigate to the attributes window
        cy.typeInGlobalSearch('att');
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__353"]').click();
        cy.wait(1000)
        cy.clickNewRecord();
        cy.wait(1000)
        cy.typeName('Serial number ');

        cy.wait(1000)

        cy.get('button[role="switch"][aria-label="Serial No."]', { timeout: 20000 })
            .filter(':visible')
            .click();
        cy.clickSave();
        cy.wait(1000)
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        cy.typeInGlobalSearch('produc');
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__130"] > .flex.overflow-hidden > .relative > .ml-2').click();
        cy.wait(1000)

        cy.clickNewRecord();

        cy.get('input[aria-label="Search Key"]', { timeout: 20000 })
            .filter(':visible')
            .should('have.length', 1)
            .clear()
            .type('Pr_Met');
        cy.wait(1000)
        cy.typeName('Precious Metals');

        cy.wait(1000)
        cy.clickSave();
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        // navigate to the units window
        cy.typeInGlobalSearch('unit');
        cy.wait(1000)
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__107"] > .flex.overflow-hidden > .relative > .ml-2').click();
        cy.wait(1000)
        cy.clickNewRecord();
        cy.wait(1000)

        cy.get('input[aria-label="EDI Code"]', { timeout: 20000 })
            .filter(':visible')
            .should('have.length', 1)
            .clear()
            .type('Ca');

        cy.wait(1000)

        cy.get('input[aria-label="Symbol"]', { timeout: 20000 })
            .filter(':visible')
            .should('have.length', 1)
            .clear()
            .type('Ca');

        cy.wait(1000)
        cy.typeName('Carat');

        cy.clickSave();
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();
        cy.typeInGlobalSearch('tax');
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__124"] > .flex.overflow-hidden > .relative > .ml-2').click();
        cy.wait(1000)
        cy.clickNewRecord();

        cy.wait(1000)
        cy.typeName('VAT 3%');

        cy.wait(1000)
        cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]').click();
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();

        // navigate to the products window

        cy.typeInGlobalSearch('produ');
        cy.wait(1000)
        cy.wait(1000)
        cy.get('[data-testid="MenuTitle__126"]').click();
        cy.wait(1000)
        cy.clickNewRecord();
        cy.wait(1000)
        cy.get('input[aria-label="Search Key"]', { timeout: 20000 })
            .filter(':visible')
            .should('have.length', 1)
            .clear()
            .type('Platinum');
        cy.wait(1000)
        cy.typeName('Platinum');
        cy.wait(1000)
        cy.get('[aria-describedby="Product Category-help"] > .w-2\\/3 > .relative > .w-full').click();

        cy.get('input[placeholder="Search..."]').type('Precious Metals');

        cy.contains('[data-testid^="OptionItem"]', 'Precious Metals').click();
        cy.wait(1000)
        cy.get('[aria-describedby="UOM-help"] > .w-2\\/3 > .relative > .w-full').click();
        cy.get('input[aria-label="Search options"]').type('Carat');

        cy.contains('[data-testid^="OptionItem"]', 'Carat').click();
        cy.wait(1000)
        cy.get('[aria-describedby="Tax Category-help"] > .w-2\\/3 > .relative > .w-full > .flex').click();
        cy.get('input[aria-label="Search options"]').type('VAT 3%');

        cy.contains('[data-testid^="OptionItem"]', 'VAT 3%').click();
        cy.wait(1000)
        cy.get('[aria-describedby="Attribute Set-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
        cy.get('input[aria-label="Search options"]').type('Lots');

        cy.contains('[data-testid^="OptionItem"]', 'Lots').click();
        cy.wait(1000)
        cy.clickSave();
        cy.get('[data-testid="BasicModal_CloseIcon"]').click();


    });

});
