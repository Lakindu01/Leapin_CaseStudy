import { Router } from "express";
import { finaliseFundingPeriod } from "../services/finalisationService.js";
import type { FinaliseQuarterRequest } from "../types/dto.js";

const router = Router();

// POST /jobs/finalise-quarter
// Triggers quarter finalisation for a funding period.
// Locks the period, calculates rollover, creates job record.
// Can also be triggered by EventBridge scheduler (same service function).
// Idempotent — calling on an already finalised period returns 409 Conflict.
// Protected — requires X-Org-Id header.
router.post("/finalise-quarter", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const body = req.body as Partial<FinaliseQuarterRequest>;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!body.fundingPeriodId || typeof body.fundingPeriodId !== "string") {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`fundingPeriodId` is required.",
        },
      });
      return;
    }

    // ── Delegate to finalisation service ─────────────────────────────────────
    // All logic lives in finalisation.service.ts — route stays thin.
    // The same service function is called by the SQS worker too,
    // so finalisation logic is never duplicated.
    const result = await finaliseFundingPeriod(body.fundingPeriodId, orgId);

    // 202 Accepted — finalisation is an async background process.
    // The job record is created immediately but processing may continue.
    res.status(202).json({
      jobId: result.jobId,
      fundingPeriodId: result.fundingPeriodId,
      totalSpent: result.totalSpent,
      unspentBudget: result.unspentBudget,
      rolledOverAmount: result.rolledOverAmount,
      totalApprovedClaimsCount: result.totalApprovedClaimsCount,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
