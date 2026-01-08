export const AddPaymentRulesGeneric = {
  id: "APRM_ADD_PAYMENT_V1",

  compute: (_context, util) => {
    const actualPayment = util.valNum("actual_payment", "actualPayment", "ActualPayment");
    // Ensure we handle the grid selection correctly.
    // util.getGridItems should return an array of objects.
    const invoices = util.getGridItems(["amount", "outstandingAmount"], ["order_invoice"]);

    const trxtype = util.valStr("trxtype");
    let isSOTrx = util.valBool("issotrx", "isSOTrx");
    if (!isSOTrx && trxtype === "RCIN") {
      isSOTrx = true;
    }

    const amountGLItemsValue = util.valNum("amount_gl_items", "amountGlItems", "AmountGlItems");
    const usedCreditValue = util.valNum("used_credit", "usedCredit", "UsedCredit");
    const conversionRate = util.valNum("conversion_rate", "conversionRate", "finPaymentRate") || 1;
    const currencyPrecision = util.valNum("currency_precision", "currencyPrecision") || 2;
    const bslamount = util.valNum("bslamount", "bslAmount", "bankStatementLineAmount");
    
    const receivedFrom = util.valStr("received_from", "receivedFrom", "c_bpartner_id");
    const overpaymentAction = util.valStr("overpayment_action", "overpaymentAction");
    const currencyId = util.valStr("currency_id", "currencyId", "c_currency_id");
    const currencyToId = util.valStr("currency_to_id", "currencyToId", "finPaymentCurrency");

    const glItems = [];
    if (amountGLItemsValue !== 0) {
      glItems.push({
        id: "manual",
        receivedIn: isSOTrx ? amountGLItemsValue : 0,
        paidOut: isSOTrx ? 0 : amountGLItemsValue,
      });
    }

    const creditItems = util.getGridItems(["paymentAmount", "outstandingAmount"], ["credit_to_use"]);
    let usedCreditCalculated = util.num(0);
    
    if (creditItems.length > 0) {
        for (const item of creditItems) {
            const pAmt = util.num(item.paymentAmount);
            if (pAmt.eq(0)) {
                item.paymentAmount = item.outstandingAmount;
            }
        }
        usedCreditCalculated = util.sum(creditItems, "paymentAmount");
    } else {
        usedCreditCalculated = util.num(usedCreditValue || 0);
    }
    
    const finalUsedCredit = usedCreditCalculated;
    const totalOutstanding = util.sum(invoices, "outstandingAmount");
    
    if (invoices.length > 0) {
        const totalToDistribute = util.num(actualPayment || 0).plus(finalUsedCredit);
        util.distributeAmount(invoices, totalToDistribute);
    }
    
    const amountInvOrds = util.sum(invoices, "amount");

    const amountGLItems = glItems.reduce((total, item) => {
      const receivedIn = util.num(item.receivedIn || 0);
      const paidOut = util.num(item.paidOut || 0);
      if (isSOTrx) {
        return total.plus(receivedIn).minus(paidOut);
      }
      return total.minus(receivedIn).plus(paidOut);
    }, util.num(0));

    const usedCredit = finalUsedCredit;
    const expectedPayment = totalOutstanding;
    const total = util.num(amountInvOrds).plus(amountGLItems);

    const actualPaymentBD = util.num(actualPayment);
    const difference = actualPaymentBD.plus(usedCredit).minus(total);

    let expectedDifference = expectedPayment.plus(usedCredit).minus(amountInvOrds);
    if (expectedDifference.eq(0)) {
      expectedDifference = difference;
    }

    let _convertedAmount = actualPaymentBD;
    const isMultiCurrency = currencyId && currencyToId && currencyId !== currencyToId;

    if (isMultiCurrency && conversionRate) {
      _convertedAmount = util.convert(actualPayment, conversionRate, 1, currencyPrecision);
    }

    const bslAmountBD = util.num(bslamount);
    const hasBslAmount = !bslAmountBD.eq(0);

    if (hasBslAmount && isMultiCurrency && conversionRate) {
      _convertedAmount = bslAmountBD.abs();
    }

    const negativeAmount = invoices
      .filter((inv) => util.num(inv.outstandingAmount).lt(0))
      .reduce((acc, inv) => {
        return acc.plus(Math.abs(inv.outstandingAmount));
      }, util.num(0));

    const totalWriteOffAmount = invoices.reduce((total, inv) => {
      if (!inv.writeoff) return total;
      const outstanding = util.num(inv.outstandingAmount);
      const amount = util.num(inv.amount || 0);
      const writeoffAmt = outstanding.minus(amount);
      return total.plus(writeoffAmt);
    }, util.num(0));

    const fmt = (n) => n.toFixed(2);

    return {
      expected_payment: fmt(expectedPayment),
      Expected_Payment: fmt(expectedPayment),
      expectedPayment: fmt(expectedPayment),
      "Expected Payment": fmt(expectedPayment),

      amount_inv_ords: fmt(amountInvOrds),
      amountInvOrds: fmt(amountInvOrds),
      AmountInvOrds: fmt(amountInvOrds),
      "Amount on Invoices and/or Orders": fmt(amountInvOrds),
      "Amount Inv Ords": fmt(amountInvOrds),

      total: fmt(total),
      Total: fmt(total),
      TOTAL: fmt(total),

      used_credit: fmt(usedCredit),
      usedCredit: fmt(usedCredit),
      "Used Credit": fmt(usedCredit),

      difference: fmt(difference),
      Difference: fmt(difference),

      expectedDifference: fmt(expectedDifference),
      ExpectedDifference: fmt(expectedDifference),
      expected_difference: fmt(expectedDifference),
      "There is a difference of": fmt(expectedDifference),

      overpayment_action: difference.gt(0) ? "CR" : "",
      overpayment_action_display_logic: difference.gt(0) ? "Y" : "N",

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
      
      order_invoice: invoices, 
      credit_to_use: creditItems,
    };
  },

  validate: (_context, computed, util) => {
    const validations = [];

    const actualPayment = util.valNum("actual_payment", "actualPayment", "ActualPayment");
    const overpaymentAction = util.valStr("overpayment_action", "overpaymentAction");
    
    // Safely access computed properties. In JS result `computed` is just the object returned above.
    const _comp = computed._computed || {};  
    const total = typeof computed.total === "string" ? Number.parseFloat(computed.total) : computed.total || 0;
    
    const actualBD = util.num(actualPayment);
    const totalBD = util.num(total);

    if (overpaymentAction && !_comp.hasReceivedFrom) {
      validations.push({
        id: "APRM_CREDIT_NO_BPARTNER",
        isValid: false,
        message: "APRM_CreditWithoutBPartner",
        severity: "error",
      });
    }

    if (totalBD.gt(actualBD.plus(_comp.usedCredit || 0))) {
      validations.push({
        id: "APRM_MORE_ALLOCATED",
        isValid: false,
        message: "APRM_JSMOREAMOUTALLOCATED",
        severity: "error",
      });
    }

    const invoices = computed.order_invoice || [];
    for (const invoice of invoices) {
       const amt = util.num(invoice.amount);
       const out = util.num(invoice.outstandingAmount);
       if (amt.minus(out).gt(0.01)) {
           validations.push({
               id: "AMOUNT_EXCEEDS_OUTSTANDING",
               isValid: false,
               message: "APRM_JSMOREAMOUTALLOCATED",
               severity: "error",
               context: { id: invoice.id }
           });
       }
    }

    return validations;
  },
};
