import type { PayScriptRules } from "../engine/LogicEngine";

/**
 * Generic Add Payment Rules
 *
 * This version works directly with form values - NO ADAPTER NEEDED
 * The context IS the form values + _gridSelection
 */
export const AddPaymentRulesGeneric: PayScriptRules = {
  id: "APRM_ADD_PAYMENT_V1",

  compute: (_context, util) => {
    // Extract values directly from context using engine's context-aware helpers
    const actualPayment = util.valNum("actual_payment", "actualPayment", "ActualPayment");

    // Get invoices from grid using engine helper
    // We explicitly specify 'order_invoice' to avoid picking up items from 'credit_to_use' or other grids
    const invoices = util.getGridItems(["amount", "outstandingAmount"], ["order_invoice"]);

    // Determine transaction type
    const trxtype = util.valStr("trxtype");
    let isSOTrx = util.valBool("issotrx", "isSOTrx");
    if (!isSOTrx && trxtype === "RCIN") {
      isSOTrx = true;
    }

    const amountGLItemsValue = util.valNum("amount_gl_items", "amountGlItems", "AmountGlItems");
    const usedCreditValue = util.valNum("used_credit", "usedCredit", "UsedCredit");
    const _generateCredit = util.valNum("generateCredit", "generate_credit", "GenerateCredit");

    const conversionRate = util.valNum("conversion_rate", "conversionRate", "finPaymentRate") || 1;
    const currencyPrecision = util.valNum("currency_precision", "currencyPrecision") || 2;
    const bslamount = util.valNum("bslamount", "bslAmount", "bankStatementLineAmount");

    const receivedFrom = util.valStr("received_from", "receivedFrom", "c_bpartner_id");
    const _overpaymentAction = util.valStr("overpayment_action", "overpaymentAction");

    const currencyId = util.valStr("currency_id", "currencyId", "c_currency_id");
    const currencyToId = util.valStr("currency_to_id", "currencyToId", "finPaymentCurrency");

    const _document = util.valStr("document", "documentNo");
    const _payment = util.valStr("payment", "fin_payment_id");
    const _parentWindow = util.valStr("parent_window", "parentWindow");

    // Build GL Items
    const glItems = [];
    if (amountGLItemsValue !== 0) {
      glItems.push({
        id: "manual",
        receivedIn: isSOTrx ? amountGLItemsValue : 0,
        paidOut: isSOTrx ? 0 : amountGLItemsValue,
      });
    }

    // Build credit to use
    // Build credit to use
    // FETCH REAL ITEMS from grid if available
    const creditItems = util.getGridItems(["paymentAmount", "outstandingAmount"], ["credit_to_use"]);
    let usedCreditCalculated = util.num(0);
    
    if (creditItems.length > 0) {
        // If items are selected but have 0 paymentAmount, default to outstandingAmount
        // This mimics "select to use credit" behavior
        for (const item of creditItems) {
            const pAmt = util.num(item.paymentAmount);
            if (pAmt.eq(0)) {
                item.paymentAmount = item.outstandingAmount;
            }
        }
        usedCreditCalculated = util.sum(creditItems, "paymentAmount");
    } else {
        // Fallback to manual value if no grid items (legacy compat)
        usedCreditCalculated = util.num(usedCreditValue || 0);
    }
    
    // Use the calculated value for further logic
    // We update the local variable to rely on grid source of truth
    const finalUsedCredit = usedCreditCalculated;

    // --- CALCULATION LOGIC (same as before) ---

    // 1. Calculate amounts from selected invoices
    const totalOutstanding = util.sum(invoices, "outstandingAmount");
    
    // Logic to distribute actual/expected payment to selected rows
    // This allows "select to pay" behavior requested by user
    // We only distribute if we have a payment amount and selected invoices
    // NOW USING ENGINE UTILITY
    if (invoices.length > 0) {
        // Distribute Actual Payment + Used Credit
        // Users expect that if they select a credit, it applies to the invoice amount
        const totalToDistribute = util.num(actualPayment || 0).plus(finalUsedCredit);
        util.distributeAmount(invoices, totalToDistribute);
    }
    
    const amountInvOrds = util.sum(invoices, "amount");

    // 2. Calculate GL Items total
    // biome-ignore lint/suspicious/noExplicitAny: BigNumber accumulator and generic GL item
    const amountGLItems = glItems.reduce((total: any, item: any) => {
      const receivedIn = util.num(item.receivedIn || 0);
      const paidOut = util.num(item.paidOut || 0);

      if (isSOTrx) {
        return total.plus(receivedIn).minus(paidOut);
      }
      return total.minus(receivedIn).plus(paidOut);
    }, util.num(0));

    // 3. Calculate credit used
    const usedCredit = finalUsedCredit;

    // 4. Calculate expected payment
    const expectedPayment = totalOutstanding;

    // 5. Calculate total (invoices + gl items)
    const total = util.num(amountInvOrds).plus(amountGLItems);

    // 6. Calculate difference
    const actualPaymentBD = util.num(actualPayment);
    const difference = actualPaymentBD.plus(usedCredit).minus(total);

    // 7. Calculate expected difference
    // Logic from legacy: expectedPayment + usedCredit - amountInvOrds
    // If result is 0, use difference instead
    let expectedDifference = expectedPayment.plus(usedCredit).minus(amountInvOrds);
    if (expectedDifference.eq(0)) {
      expectedDifference = difference;
    }

    // 8. Multicurrency conversion
    let _convertedAmount = actualPaymentBD;
    const isMultiCurrency = currencyId && currencyToId && currencyId !== currencyToId;

    if (isMultiCurrency && conversionRate) {
      _convertedAmount = util.convert(actualPayment, conversionRate, 1, currencyPrecision);
    }

    // 9. Handle bank statement line amount
    const bslAmountBD = util.num(bslamount);
    const hasBslAmount = !bslAmountBD.eq(0);

    if (hasBslAmount && isMultiCurrency && conversionRate) {
      _convertedAmount = bslAmountBD.abs();
    }

    // 10. Calculate negative amounts
    // biome-ignore lint/suspicious/noExplicitAny: Generic invoice item from grid
    const negativeAmount = invoices
      .filter((inv: any) => util.num(inv.outstandingAmount).lt(0))
      // biome-ignore lint/suspicious/noExplicitAny: BigNumber accumulator and generic invoice item
      .reduce((acc: any, inv: any) => {
        return acc.plus(Math.abs(inv.outstandingAmount));
      }, util.num(0));

    // 11. Calculate write-off amounts
    // biome-ignore lint/suspicious/noExplicitAny: BigNumber accumulator and generic invoice item
    const totalWriteOffAmount = invoices.reduce((total: any, inv: any) => {
      if (!inv.writeoff) return total;

      const outstanding = util.num(inv.outstandingAmount);
      const amount = util.num(inv.amount || 0);
      const writeoffAmt = outstanding.minus(amount);

      return total.plus(writeoffAmt);
    }, util.num(0));

    // Format numbers for form fields
    // biome-ignore lint/suspicious/noExplicitAny: Generic formatter for BigNumber or number
    const fmt = (n: any) => n.toFixed(2);

    // Return ALL field name variations (legacy compatibility)
    // Parameters can have different name formats: snake_case, camelCase, "Display Name"
    return {
      // Expected Payment (all variations)
      expected_payment: fmt(expectedPayment),
      Expected_Payment: fmt(expectedPayment),
      expectedPayment: fmt(expectedPayment),
      "Expected Payment": fmt(expectedPayment),

      // Amount on Invoices/Orders (all variations)
      amount_inv_ords: fmt(amountInvOrds),
      amountInvOrds: fmt(amountInvOrds),
      AmountInvOrds: fmt(amountInvOrds),
      "Amount on Invoices and/or Orders": fmt(amountInvOrds),
      "Amount Inv Ords": fmt(amountInvOrds), // Added by edit

      // Total (all variations)
      total: fmt(total),
      Total: fmt(total),
      TOTAL: fmt(total),

      // Used Credit - UPDATE to use calculated value
      used_credit: fmt(usedCredit),
      usedCredit: fmt(usedCredit),
      "Used Credit": fmt(usedCredit),

      // Difference (all variations)
      difference: fmt(difference),
      Difference: fmt(difference),

      // Expected Difference (all variations)
      expectedDifference: fmt(expectedDifference),
      ExpectedDifference: fmt(expectedDifference),
      expected_difference: fmt(expectedDifference),
      "There is a difference of": fmt(expectedDifference),

      // Overpayment action and display logic
      overpayment_action: difference.gt(0) ? "CR" : "",
      overpayment_action_display_logic: difference.gt(0) ? "Y" : "N",

      // Internal computed values (not displayed but used for validation)
      _computed: {
        totalOutstanding: totalOutstanding.toNumber(),
        negativeAmount: negativeAmount.toNumber(),
        totalWriteOffAmount: totalWriteOffAmount.toNumber(),
        hasBslAmount,
        selectedInvoicesCount: invoices.length,
        hasReceivedFrom: !!receivedFrom,
        amountGLItems: amountGLItems.toNumber(),
        usedCredit: usedCredit.toNumber(),
      },
      
      // Explicitly return updated grid data to ensure UI updates
      order_invoice: invoices, 
      credit_to_use: creditItems, // Return updated credit items 
    };
  },

  // Transform and Validate phases remain the same as AddPaymentRules.ts
  // (copied here for completeness but could be refactored to share code)

  validate: (_context, computed, util) => {
    const validations = [];

    const actualPayment = util.valNum("actual_payment", "actualPayment", "ActualPayment");
    const _receivedFrom = util.valStr("received_from", "receivedFrom", "c_bpartner_id");
    const overpaymentAction = util.valStr("overpayment_action", "overpaymentAction");
    const _document = util.valStr("document", "documentNo");
    const _parentWindow = util.valStr("parent_window", "parentWindow");

    const _comp = computed._computed || {};
    const total = typeof computed.total === "string" ? Number.parseFloat(computed.total) : computed.total || 0;
    const difference =
      typeof computed.difference === "string" ? Number.parseFloat(computed.difference) : computed.difference || 0;

    const actualBD = util.num(actualPayment);
    const totalBD = util.num(total);
    const _differenceBD = util.num(difference);

    // Overpayment needs business partner
    if (overpaymentAction && !_comp.hasReceivedFrom) {
      validations.push({
        id: "APRM_CREDIT_NO_BPARTNER",
        isValid: false,
        message: "APRM_CreditWithoutBPartner",
        severity: "error" as const,
      });
    }

    // More than available amount distributed
    if (totalBD.gt(actualBD.plus(_comp.usedCredit || 0))) {
      validations.push({
        id: "APRM_MORE_ALLOCATED",
        isValid: false,
        message: "APRM_JSMOREAMOUTALLOCATED",
        severity: "error" as const,
      });
    }

    // Validate individual row amounts vs outstanding
    // biome-ignore lint/suspicious/noExplicitAny: Generic invoice type
    const invoices = (computed.order_invoice as any[]) || [];
    for (const invoice of invoices) {
       const amt = util.num(invoice.amount);
       const out = util.num(invoice.outstandingAmount);
       // Allow 0.01 tolerance for floating point issues
       if (amt.minus(out).gt(0.01)) {
           validations.push({
               id: "AMOUNT_EXCEEDS_OUTSTANDING",
               isValid: false,
               message: "APRM_JSMOREAMOUTALLOCATED", // Reusing the key relevant to allocation
               severity: "error" as const,
               context: { id: invoice.id }
           });
       }
    }

    return validations;
  },
};
