import type { PayScriptRules } from "../engine/LogicEngine";

/**
 * PayScript rules for Pick & Validate Process (OBWPL)
 *
 * Handles:
 * - Recalculating qtyPending from quantity and qtyVerified
 * - Validating that no line exceeds its quantity
 * - Validating that at least one line has been scanned
 */
export const PickValidateRules: PayScriptRules = {
  id: "OBWPL_PICK_VALIDATE_V1",

  compute: (_context, util) => {
    const lines = util.getGridItems(["quantity", "qtyVerified"], ["picking_lines"]);

    for (const line of lines) {
      const qty = util.num(line.quantity);
      const verified = util.num(line.qtyVerified || 0);
      line.qtyPending = qty.minus(verified).toNumber();
    }

    return {
      picking_lines: lines,
    };
  },

  validate: (_context, computed, util) => {
    const validations = [];
    const lines = computed.picking_lines || [];

    let hasNonZero = false;
    let hasOverLimit = false;

    for (const line of lines) {
      const verified = util.num(line.qtyVerified || 0);
      const qty = util.num(line.quantity);

      if (verified.gt(0)) {
        hasNonZero = true;
      }
      if (verified.gt(qty)) {
        hasOverLimit = true;
      }
    }

    if (hasOverLimit) {
      validations.push({
        id: "OBWPL_OVER_LIMIT",
        isValid: false,
        message: "OBWPL_Alert_PendingToValidate",
        severity: "error" as const, // The type inference should handle this
      });
    }

    if (!hasNonZero && lines.length > 0) {
      validations.push({
        id: "OBWPL_NO_SCANNED",
        isValid: false,
        message: "OBWPL_Alert_PendingToValidate",
        severity: "error" as const,
      });
    }

    // Explicit return type assertion not needed in JS, but ensuring values are correct string literals
    return validations;
  },
};
