// DTOs = Data Transfer Objects.
// These define the exact shape of data coming INTO the API (requests)
// and going OUT of the API (responses).
// Services use these types too — keeping everything consistent end to end.

// ─── Service Categories ───────────────────────────────────────────────────────
export type ServiceCategory = 'CLINICAL' | 'INDEPENDENCE' | 'EVERYDAY_LIVING';

// ─── Claim Status ─────────────────────────────────────────────────────────────
export type ClaimStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

// ─── Calculation types (used inside calculation.service.ts) ──────────────────

export interface ClaimCalculationInput {
  unitPriceInclusive: number;   // raw price including GST from invoice
  gstRate: number;              // e.g. 0.10 for 10%
  quantity: number;             // number of units billed
  serviceCategory: ServiceCategory;
  independenceRate: number;     // member's effective independence contribution rate
  everydayLivingRate: number;   // member's effective everyday living contribution rate
}

export interface ClaimCalculationResult {
  gstExclusiveUnitPrice: number;  // unitPriceInclusive / (1 + gstRate)
  gstExclusiveAmount: number;     // gstExclusiveUnitPrice × quantity
  markedUpTotal: number;          // same as gstExclusiveAmount in this model (no markup applied)
  coContributionAmount: number;   // member's share
  governmentFundedAmount: number; // what gets deducted from budget
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateOrganisationRequest {
  name: string;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
}

export interface CreateFundingPeriodRequest {
  memberId: string;
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  quarterlyBudget: number;
}

export interface CreateDraftClaimRequest {
  memberId: string;
  invoiceId: string;
  serviceDate: string;      // YYYY-MM-DD — used to find funding period + contribution rate
}

export interface ApproveCiaimRequest {
  // claimId comes from the URL param, nothing needed in body
}

export interface FinaliseQuarterRequest {
  fundingPeriodId: string;
}

export interface ClaimSearchRequest {
  memberId?: string;
  status?: ClaimStatus;
  fromDate?: string;
  toDate?: string;
  serviceCategory?: ServiceCategory;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface BalanceSummary {
  fundingPeriodId: string;
  startDate: string;
  endDate: string;
  quarterlyBudget: number;
  availableBalance: number;
  isLocked: boolean;
}

export interface FinaliseQuarterResult {
  jobId: string;
  fundingPeriodId: string;
  totalSpent: number;
  unspentBudget: number;
  rolledOverAmount: number;
  totalApprovedClaimsCount: number;
}