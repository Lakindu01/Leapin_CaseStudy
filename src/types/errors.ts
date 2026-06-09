// Custom error classes for every business rule violation.
// Routes catch these and map them to the correct HTTP status codes.
// This keeps error semantics out of route handlers.

export class ValidationError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>|undefined;
  
    constructor(code: string, message: string, details?: Record<string, unknown>|undefined) {
      super(message);
      this.name = 'ValidationError';
      this.code = code;
      this.details = details;
    }
  }
  
  // Thrown when a claim tries to be approved but budget is insufficient
  export class InsufficientBudgetError extends ValidationError {
    constructor(availableAmount: number, requiredAmount: number) {
      super(
        'INSUFFICIENT_BUDGET',
        'Funding period does not have enough available budget for this claim.',
        { availableAmount, requiredAmount },
      );
    }
  }
  
  // Thrown when a claim or job is in the wrong state for the requested operation
  export class InvalidStateError extends ValidationError {
    constructor(message: string) {
      super('INVALID_STATE', message);
    }
  }
  
  // Thrown when a funding period is already locked (finalised)
  export class FundingPeriodLockedError extends ValidationError {
    constructor(fundingPeriodId: string) {
      super(
        'FUNDING_PERIOD_LOCKED',
        `Funding period ${fundingPeriodId} has been finalised and cannot accept new claims.`,
      );
    }
  }
  
  // Thrown when no matching funding period exists for a member + service date
  export class NoActiveFundingPeriodError extends ValidationError {
    constructor(memberId: string, serviceDate: string) {
      super(
        'NO_ACTIVE_FUNDING_PERIOD',
        `No active funding period found for member ${memberId} on ${serviceDate}.`,
      );
    }
  }
  
  // Thrown when no contribution rate exists for a member on a given date
  export class NoContributionRateError extends ValidationError {
    constructor(memberId: string, serviceDate: string) {
      super(
        'NO_CONTRIBUTION_RATE',
        `No contribution rate found for member ${memberId} on ${serviceDate}.`,
      );
    }
  }
  
  // Thrown when finalisation is attempted on an already-finalised period
  export class AlreadyFinalisedError extends ValidationError {
    constructor(fundingPeriodId: string) {
      super(
        'ALREADY_FINALISED',
        `Funding period ${fundingPeriodId} has already been finalised.`,
      );
    }
  }