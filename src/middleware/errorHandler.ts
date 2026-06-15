import type { Request, Response, NextFunction } from "express";
import { ConnectionError } from "sequelize";
import {
  ValidationError,
  InsufficientBudgetError,
  InvalidStateError,
  FundingPeriodLockedError,
  AlreadyFinalisedError,
  NoActiveFundingPeriodError,
  NoContributionRateError,
} from "../types/errors.js";

// Central error handler middleware.
// Must have exactly 4 parameters (err, req, res, next) — this is how
// Express recognises it as an error handler vs a normal middleware.
// Registered LAST in index.ts after all routes.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // 409 Conflict — invalid state transitions and duplicate operations
  if (
    err instanceof InvalidStateError ||
    err instanceof FundingPeriodLockedError ||
    err instanceof AlreadyFinalisedError
  ) {
    res.status(409).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // 409 Conflict — insufficient budget (separate block for clarity,
  // includes details with availableAmount and requiredAmount)
  if (err instanceof InsufficientBudgetError) {
    res.status(409).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 400 Bad Request — missing rates, missing funding periods, validation failures
  if (
    err instanceof NoActiveFundingPeriodError ||
    err instanceof NoContributionRateError ||
    err instanceof ValidationError
  ) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // 503 Service Unavailable — database not reachable
  if (err instanceof ConnectionError) {
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Cannot connect to the database. Ensure Docker MySQL is running (npm run db:up).",
      },
    });
    return;
  }

  // 500 Internal Server Error — anything unexpected
  // We intentionally don't expose the raw error message in production
  // to avoid leaking internal implementation details.
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}
