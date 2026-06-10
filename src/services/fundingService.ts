import { Op } from 'sequelize';
import { FundingPeriod } from '../database/models/FundingPeriod.js';
import {
  InsufficientBudgetError,
  FundingPeriodLockedError,
  NoActiveFundingPeriodError,
} from '../types/errors.js';

// Finds the funding period that covers a given service date for a member.
// Uses startDate and endDate range — serviceDate must fall within.
// Throws NoActiveFundingPeriodError if none found.
export async function findActiveFundingPeriod(
  memberId: string,
  organisationId: string,
  serviceDate: string,
): Promise<FundingPeriod> {
  const period = await FundingPeriod.findOne({
    where: {
      memberId,
      organisationId,
      startDate: { [Op.lte]: serviceDate },  // startDate <= serviceDate
      endDate:   { [Op.gte]: serviceDate },  // endDate >= serviceDate
    },
  });

  if (!period) {
    throw new NoActiveFundingPeriodError(memberId, serviceDate);
  }

  return period;
}

// Validates that a funding period can accept a new claim approval.
// Two checks — is it locked? does it have enough balance?
// Throws before any DB write happens so nothing is partially saved.
export function validateBudget(
  fundingPeriod: FundingPeriod,
  requiredAmount: number,
): void {
  // Finalised periods are locked — no new approvals allowed
  if (fundingPeriod.isLocked) {
    throw new FundingPeriodLockedError(fundingPeriod.id);
  }

  const available = Number(fundingPeriod.availableBalance);

  if (available < requiredAmount) {
    throw new InsufficientBudgetError(available, requiredAmount);
  }
}