import { sequelize } from "../database/index.js";
import { Claim } from "../database/models/Claim.js";
import { Invoice } from "../database/models/Invoice.js";
import { ServiceItem } from "../database/models/ServiceItem.js";
import { ContributionRate } from "../database/models/ContributionRate.js";
import { LedgerEntry } from "../database/models/LedgerEntry.js";
import { FundingPeriod } from "../database/models/FundingPeriod.js";
import { calculateClaim } from "../services/calculationService.js";
import {
  findActiveFundingPeriod,
  validateBudget,
} from "../services/fundingService.js";
import { InvalidStateError, NoContributionRateError } from "../types/errors.js";
import type { CreateDraftClaimRequest, ServiceCategory } from "../types/dto.js";

// Finds the contribution rate effective on the service date.
// A rate is effective if serviceDate falls between its startDate and endDate.
// endDate is optional — a null endDate means the rate is still open-ended.
// Throws NoContributionRateError if no matching rate is found.
async function findEffectiveContributionRate(
  memberId: string,
  organisationId: string,
  serviceDate: string,
) {
  const rates = await ContributionRate.findAll({
    where: { memberId, organisationId },
  });

  const effective = rates.find((rate) => {
    const afterStart = serviceDate >= rate.startDate;
    const beforeEnd = !rate.endDate || serviceDate <= rate.endDate;
    return afterStart && beforeEnd;
  });

  if (!effective) {
    throw new NoContributionRateError(memberId, serviceDate);
  }

  return effective;
}

// Creates a draft claim with all monetary fields calculated and persisted.
// Draft claims do NOT deduct from the funding period balance.
// Documented assumption: only APPROVED claims affect available balance.
export async function createDraftClaim(
  request: CreateDraftClaimRequest,
  organisationId: string,
): Promise<Claim> {
  const { memberId, invoiceId, serviceDate } = request;

  // 1. Load invoice — also validates it belongs to this org and member
  const invoice = await Invoice.findOne({
    where: { id: invoiceId, organisationId, memberId },
    include: [{ model: ServiceItem }],
  });

  if (!invoice) {
    throw new InvalidStateError(`Invoice ${invoiceId} not found.`);
  }

  if (!invoice.serviceItem) {
    throw new InvalidStateError(
      `Invoice ${invoiceId} has no linked service item.`,
    );
  }

  // 2. Find the funding period covering this service date
  const fundingPeriod = await findActiveFundingPeriod(
    memberId,
    organisationId,
    serviceDate,
  );

  // 3. Find the contribution rate effective on the service date
  const rate = await findEffectiveContributionRate(
    memberId,
    organisationId,
    serviceDate,
  );

  // 4. Run all monetary calculations
  const calculated = calculateClaim({
    unitPriceInclusive: Number(invoice.unitPriceInclusive),
    gstRate: Number(invoice.gstRate),
    quantity: Number(invoice.quantity),
    serviceCategory: invoice.serviceItem.serviceCategory as ServiceCategory,
    independenceRate: Number(rate.independenceRate),
    everydayLivingRate: Number(rate.everydayLivingRate),
  });

  // 5. Persist the draft claim with every calculated field stored
  const claim = await Claim.create({
    organisationId,
    memberId,
    fundingPeriodId: fundingPeriod.id,
    invoiceId,
    serviceDate,
    serviceCategory: invoice.serviceItem.serviceCategory as ServiceCategory,
    invoiceTotalInclusive: Number(invoice.totalAmountInclusive),
    gstExclusiveAmount: calculated.gstExclusiveAmount,
    markedUpTotal: calculated.markedUpTotal,
    memberCoContributionAmount: calculated.coContributionAmount,
    governmentFundedAmount: calculated.governmentFundedAmount,
    status: "DRAFT",
  });

  return claim;
}

// Approves a draft claim and deducts the government-funded amount from
// the funding period balance. Runs entirely inside a transaction —
// if anything fails, both the claim update and balance deduction are rolled back.
export async function approveClaim(
  claimId: string,
  organisationId: string,
): Promise<Claim> {
  // Load the claim — scoped to org for tenant isolation
  const claim = await Claim.findOne({
    where: { id: claimId, organisationId },
  });

  if (!claim) {
    throw new InvalidStateError(`Claim ${claimId} not found.`);
  }

  // Idempotency — already approved claims return as-is without error.
  // Documented assumption: approving an already approved claim is idempotent.
  if (claim.status === "APPROVED") {
    return claim;
  }

  // Only DRAFT claims can be approved — anything else is a 409
  if (claim.status !== "DRAFT") {
    throw new InvalidStateError(
      `Claim ${claimId} has status ${claim.status} and cannot be approved.`,
    );
  }

  return sequelize.transaction(async (t) => {
    // Re-load funding period inside the transaction with a row-level lock.
    // This prevents two simultaneous approvals both seeing the same balance
    // and both passing validation — known as a "double spend" race condition.
    const fundingPeriod = await FundingPeriod.findByPk(claim.fundingPeriodId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!fundingPeriod) {
      throw new InvalidStateError(
        `Funding period not found for claim ${claimId}.`,
      );
    }

    // Validate budget and lock status — throws before any write if invalid
    validateBudget(fundingPeriod, Number(claim.governmentFundedAmount));

    // Deduct government-funded amount from available balance
    const newBalance =
      Number(fundingPeriod.availableBalance) -
      Number(claim.governmentFundedAmount);

    await fundingPeriod.update(
      { availableBalance: newBalance },
      { transaction: t },
    );

    // Update claim status to APPROVED
    await claim.update({ status: "APPROVED" }, { transaction: t });

    // Write a ledger entry for full audit trail
    // Amount is negative because this is a deduction from the balance
    await LedgerEntry.create(
      {
        organisationId,
        fundingPeriodId: claim.fundingPeriodId,
        memberId: claim.memberId,
        amount: -Number(claim.governmentFundedAmount),
        type: "CLAIM_DEDUCTION",
        referenceId: claim.id,
        description: `Claim approved: ${claim.id}`,
      },
      { transaction: t },
    );

    return claim;
  });
}
