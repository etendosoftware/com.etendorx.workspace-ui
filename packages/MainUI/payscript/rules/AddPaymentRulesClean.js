export const AddPaymentRulesGeneric = (() => {
  // Helper to determine transaction type context
  const resolveIsSOTrx = (util) => {
    const trxtype = util.valStr("trxtype");
    let isSOTrx = util.valBool("issotrx", "isSOTrx");
    if (!isSOTrx && trxtype === "RCIN") {
      isSOTrx = true;
    }
    return isSOTrx;
  };

  // Helper to calculate used credit from grid items or fallback value
  const calculateUsedCredit = (util, creditItems, usedCreditValue) => {
    if (creditItems.length > 0) {
      for (const item of creditItems) {
        const pAmt = util.num(item.paymentAmount);
        if (pAmt.eq(0)) {
          item.paymentAmount = item.outstandingAmount;
        }
      }
      return util.sum(creditItems, "paymentAmount");
    }
    return util.num(usedCreditValue || 0);
  };

  // Helper to calculate write-off amount
  const calculateWriteOffAmount = (util, invoices) => {
    return invoices.reduce((total, inv) => {
      if (!inv.writeoff) return total;
      const outstanding = util.num(inv.outstandingAmount);
      const amount = util.num(inv.amount || 0);
      const writeoffAmt = outstanding.minus(amount);
      return total.plus(writeoffAmt);
    }, util.num(0));
  };

  return {
    id: "APRM_ADD_PAYMENT_V1",

    compute: (_context, util) => {
      const actualPayment = util.valNum("actual_payment", "actualPayment", "ActualPayment");
      const invoices = util.getGridItems(["amount", "outstandingAmount"], ["order_invoice"]);
      const isSOTrx = resolveIsSOTrx(util);

      const amountGLItemsValue = util.valNum("amount_gl_items", "amountGlItems", "AmountGlItems");
      const usedCreditValue = util.valNum("used_credit", "usedCredit", "UsedCredit");
      const conversionRate = util.valNum("conversion_rate", "conversionRate", "finPaymentRate") || 1;
      const currencyPrecision = util.valNum("currency_precision", "currencyPrecision") || 2;
      const bslamount = util.valNum("bslamount", "bslAmount", "bankStatementLineAmount");

      const receivedFrom = util.valStr("received_from", "receivedFrom", "c_bpartner_id");
      const currencyId = util.valStr("currency_id", "currencyId", "c_currency_id");
      const currencyToId = util.valStr("currency_to_id", "currencyToId", "finPaymentCurrency");

      // Calculate Credit
      const creditItems = util.getGridItems(["paymentAmount", "outstandingAmount"], ["credit_to_use"]);
      const finalUsedCredit = calculateUsedCredit(util, creditItems, usedCreditValue);

      // Distribution Logic
      if (invoices.length > 0) {
        const totalToDistribute = util.num(actualPayment || 0).plus(finalUsedCredit);
        util.distributeAmount(invoices, totalToDistribute);
      }

      const amountInvOrds = util.sum(invoices, "amount");

      // Simplification: In this logic, GL Amount is always additive regardless of isSOTrx because
      // of how receivedIn/paidOut were constructed initially.
      const amountGLItems = util.num(amountGLItemsValue);

      const usedCredit = finalUsedCredit;
      const totalOutstanding = util.sum(invoices, "outstandingAmount");
      const total = util.num(amountInvOrds).plus(amountGLItems);

      const actualPaymentBD = util.num(actualPayment);
      const difference = actualPaymentBD.plus(usedCredit).minus(total);

      let expectedDifference = totalOutstanding.plus(usedCredit).minus(amountInvOrds);
      if (expectedDifference.eq(0)) {
        expectedDifference = difference;
      }

      // Determine converted amount if Multi-Currency
      let _convertedAmount = actualPaymentBD;
      const isMultiCurrency = currencyId && currencyToId && currencyId !== currencyToId;

      if (isMultiCurrency && conversionRate) {
        const bslAmountBD = util.num(bslamount);
        const hasBslAmount = !bslAmountBD.eq(0);
        if (hasBslAmount) {
          _convertedAmount = bslAmountBD.abs();
        } else {
          _convertedAmount = util.convert(actualPayment, conversionRate, 1, currencyPrecision);
        }
      }

      const negativeAmount = invoices
        .filter((inv) => util.num(inv.outstandingAmount).lt(0))
        .reduce((acc, inv) => {
          return acc.plus(Math.abs(inv.outstandingAmount));
        }, util.num(0));

      const totalWriteOffAmount = calculateWriteOffAmount(util, invoices);

      const fmt = (n) => n.toFixed(2);

      // Use expectedPayment variable for consistency
      const expectedPayment = totalOutstanding;

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
          hasBslAmount: !util.num(bslamount).eq(0),
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
            context: { id: invoice.id },
          });
        }
      }

      return validations;
    },
  };
})();
