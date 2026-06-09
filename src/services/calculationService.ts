import type { ClaimCalculationInput, ClaimCalculationResult, ServiceCategory } from '../types/dto.js';

// ─── Rounding ─────────────────────────────────────────────────────────────────
// All money rounded to 2 decimal places using "round half up".
// Number.EPSILON handles floating point precision issues (e.g. 1.005 rounding correctly).
// All monetary functions in this file go through this — never round inline.
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─── GST ──────────────────────────────────────────────────────────────────────
// Strips GST from an inclusive price.
// Example: $110 inclusive at 10% GST → 110 / 1.10 = $100 exclusive
export function calculateGstExclusivePrice(
  unitPriceInclusive: number,
  gstRate: number,
): number {
  if (gstRate < 0 || gstRate > 1) {
    throw new Error(`Invalid GST rate: ${gstRate}. Must be between 0 and 1.`);
  }
  return roundMoney(unitPriceInclusive / (1 + gstRate));
}

// ─── Marked Up Total ──────────────────────────────────────────────────────────
// GST-exclusive total for the line = gstExclusiveUnitPrice × quantity.
// Called "marked-up total" in the spec — it is the basis for the government/member split.
export function calculateMarkedUpTotal(
  gstExclusiveUnitPrice: number,
  quantity: number,
): number {
  if (quantity <= 0) {
    throw new Error(`Invalid quantity: ${quantity}. Must be greater than 0.`);
  }
  return roundMoney(gstExclusiveUnitPrice * quantity);
}

// ─── Co-Contribution ─────────────────────────────────────────────────────────
// How much the MEMBER pays based on service category and their effective rates.
// CLINICAL      → always 0 (fully government funded, no member contribution)
// INDEPENDENCE  → markedUpTotal × member's independence rate
// EVERYDAY_LIVING → markedUpTotal × member's everyday living rate
export function calculateCoContribution(
  markedUpTotal: number,
  serviceCategory: ServiceCategory,
  independenceRate: number,
  everydayLivingRate: number,
): number {
  switch (serviceCategory) {
    case 'CLINICAL':
      return 0;

    case 'INDEPENDENCE':
      return roundMoney(markedUpTotal * independenceRate);

    case 'EVERYDAY_LIVING':
      return roundMoney(markedUpTotal * everydayLivingRate);

    default: {
      // Exhaustiveness check — if a new category is added to the ServiceCategory
      // type but not handled here, TypeScript will throw a compile error.
      const _exhaustive: never = serviceCategory;
      throw new Error(`Unknown service category: ${String(_exhaustive)}`);
    }
  }
}

// ─── Government Funded Amount ─────────────────────────────────────────────────
// The portion deducted from the funding period budget on claim approval.
// Formula: governmentFundedAmount = markedUpTotal - coContributionAmount
export function calculateGovernmentFundedAmount(
  markedUpTotal: number,
  coContributionAmount: number,
): number {
  return roundMoney(markedUpTotal - coContributionAmount);
}

// ─── Full Claim Calculation ───────────────────────────────────────────────────
// Runs all steps in sequence and returns every computed field.
// This is what claim.service.ts calls when creating a draft claim.
export function calculateClaim(input: ClaimCalculationInput): ClaimCalculationResult {
  const gstExclusiveUnitPrice = calculateGstExclusivePrice(
    input.unitPriceInclusive,
    input.gstRate,
  );

  const gstExclusiveAmount = calculateMarkedUpTotal(
    gstExclusiveUnitPrice,
    input.quantity,
  );

  const markedUpTotal = gstExclusiveAmount;

  const coContributionAmount = calculateCoContribution(
    markedUpTotal,
    input.serviceCategory,
    input.independenceRate,
    input.everydayLivingRate,
  );

  const governmentFundedAmount = calculateGovernmentFundedAmount(
    markedUpTotal,
    coContributionAmount,
  );

  return {
    gstExclusiveUnitPrice,
    gstExclusiveAmount,
    markedUpTotal,
    coContributionAmount,
    governmentFundedAmount,
  };
}

// ─── Rollover Cap ─────────────────────────────────────────────────────────────
// How much unspent budget carries over to the next period.
// Formula from spec: min(unspent, max(1000, 10% of quarterlyBudget))
//
// Example 1: budget=5000, unspent=300  → cap=max(1000,500)=1000  → rollover=min(300,1000)=300
// Example 2: budget=5000, unspent=1200 → cap=max(1000,500)=1000  → rollover=min(1200,1000)=1000
// Example 3: budget=20000, unspent=3000 → cap=max(1000,2000)=2000 → rollover=min(3000,2000)=2000
export function calculateRolloverAmount(
  unspentBudget: number,
  quarterlyBudget: number,
): number {
  const tenPercent = roundMoney(quarterlyBudget * 0.1);
  const cap = Math.max(1000, tenPercent);
  return roundMoney(Math.min(unspentBudget, cap));
}