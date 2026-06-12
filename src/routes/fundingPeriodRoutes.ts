import { Router } from "express";
import { FundingPeriod } from "../database/models/FundingPeriod.js";
import { Member } from "../database/models/Member.js";
import { LedgerEntry } from "../database/models/LedgerEntry.js";
import { sequelize } from "../database/index.js";
import type { CreateFundingPeriodRequest } from "../types/dto.js";

const router = Router();

// POST /funding-periods
// Creates a funding period for a member.
// Protected — requires X-Org-Id header.
router.post("/", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const body = req.body as Partial<CreateFundingPeriodRequest>;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!body.memberId || typeof body.memberId !== "string") {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`memberId` is required.",
        },
      });
      return;
    }

    if (!body.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`startDate` is required and must be in YYYY-MM-DD format.",
        },
      });
      return;
    }

    if (!body.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`endDate` is required and must be in YYYY-MM-DD format.",
        },
      });
      return;
    }

    if (body.endDate <= body.startDate) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`endDate` must be after `startDate`.",
        },
      });
      return;
    }

    if (
      body.quarterlyBudget === undefined ||
      typeof body.quarterlyBudget !== "number" ||
      body.quarterlyBudget <= 0
    ) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "`quarterlyBudget` is required and must be a positive number.",
        },
      });
      return;
    }

    // ── Verify member exists and belongs to this org ──────────────────────────
    const member = await Member.findOne({
      where: { id: body.memberId, organisationId: orgId },
    });

    if (!member) {
      res.status(404).json({
        error: {
          code: "MEMBER_NOT_FOUND",
          message: `Member ${body.memberId} not found.`,
        },
      });
      return;
    }

    // ── Create funding period and initial ledger entry in one transaction ─────
    // Both must succeed together — a funding period without an ALLOCATION
    // ledger entry would have an incomplete balance history.
    const result = await sequelize.transaction(async (t) => {
      const fundingPeriod = await FundingPeriod.create(
        {
          organisationId: orgId,
          memberId: body.memberId,
          startDate: body.startDate,
          endDate: body.endDate,
          quarterlyBudget: body.quarterlyBudget,
          // availableBalance starts equal to quarterlyBudget —
          // it decreases as claims are approved throughout the period
          availableBalance: body.quarterlyBudget,
          isLocked: false,
        },
        { transaction: t },
      );

      // Write the initial ALLOCATION ledger entry.
      // This records the full budget being allocated at period creation
      // so the ledger tells the complete story of the balance from day one.
      await LedgerEntry.create(
        {
          organisationId: orgId,
          fundingPeriodId: fundingPeriod.id,
          memberId: body.memberId as string,
          amount: body.quarterlyBudget as number,
          type: "ALLOCATION",
          description: `Initial budget allocation for period ${fundingPeriod.id}`,
        },
        { transaction: t },
      );

      return fundingPeriod;
    });

    res.status(201).json({
      id: result.id,
      organisationId: result.organisationId,
      memberId: result.memberId,
      startDate: result.startDate,
      endDate: result.endDate,
      quarterlyBudget: Number(result.quarterlyBudget),
      availableBalance: Number(result.availableBalance),
      isLocked: result.isLocked,
      createdAt: result.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
