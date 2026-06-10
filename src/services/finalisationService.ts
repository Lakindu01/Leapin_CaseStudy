import { sequelize } from "../database/index.js";
import { FundingPeriod } from "../database/models/FundingPeriod.js";
import { Claim } from "../database/models/Claim.js";
import { LedgerEntry } from "../database/models/LedgerEntry.js";
import { FinalisationJob } from "../database/models/FinalisationJob.js";
import { calculateRolloverAmount } from "./calculationService.js";
import { AlreadyFinalisedError, InvalidStateError } from "../types/errors.js";
import type { FinaliseQuarterResult } from "../types/dto.js";

export async function finaliseFundingPeriod(
  fundingPeriodId: string,
  organisationId: string,
): Promise<FinaliseQuarterResult> {
  // Load the funding period — scoped to org for tenant isolation
  const period = await FundingPeriod.findOne({
    where: { id: fundingPeriodId, organisationId },
  });

  if (!period) {
    throw new InvalidStateError(`Funding period ${fundingPeriodId} not found.`);
  }

  // Idempotency guard — if already finalised return 409
  // Documented assumption: re-running finalisation on a locked period
  // returns AlreadyFinalisedError which the route maps to 409 Conflict
  if (period.isLocked) {
    throw new AlreadyFinalisedError(fundingPeriodId);
  }

  // Everything below runs inside a transaction.
  // If any step fails, ALL changes are rolled back automatically.
  // This prevents partial writes e.g. period locked but job record missing.
  return sequelize.transaction(async (t) => {
    // Sum all approved government-funded amounts for this period
    const approvedClaims = await Claim.findAll({
      where: {
        fundingPeriodId,
        organisationId,
        status: "APPROVED",
      },
      transaction: t,
    });

    const totalSpent = approvedClaims.reduce(
      (sum, claim) => sum + Number(claim.governmentFundedAmount),
      0,
    );

    const quarterlyBudget = Number(period.quarterlyBudget);

    // Unspent = original budget minus what was actually spent on approved claims
    // Math.max(0) prevents negative unspent if somehow totalSpent exceeded budget
    const unspentBudget = Math.max(0, quarterlyBudget - totalSpent);

    // Apply the rollover cap formula from calculation.service.ts
    // min(unspent, max(1000, 10% of quarterlyBudget))
    const rolledOverAmount = calculateRolloverAmount(
      unspentBudget,
      quarterlyBudget,
    );

    // Lock the period — no more claim approvals after this point
    await period.update(
      { isLocked: true, availableBalance: 0 },
      { transaction: t },
    );

    // Write a ROLLOVER ledger entry so balance history stays auditable
    await LedgerEntry.create(
      {
        organisationId,
        fundingPeriodId,
        memberId: period.memberId,
        amount: rolledOverAmount,
        type: "ROLLOVER",
        description: `Quarter finalisation rollover for period ${fundingPeriodId}`,
      },
      { transaction: t },
    );

    // Create the job record — satisfies spec requirement:
    // "creates a record that shows what was processed"
    const job = await FinalisationJob.create(
      {
        organisationId,
        fundingPeriodId,
        totalSpent,
        unspentBudgetCalculated: unspentBudget,
        rolledOverAmount,
        totalApprovedClaimsCount: approvedClaims.length,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      { transaction: t },
    );

    return {
      jobId: job.id,
      fundingPeriodId,
      totalSpent,
      unspentBudget,
      rolledOverAmount,
      totalApprovedClaimsCount: approvedClaims.length,
    };
  });
}
