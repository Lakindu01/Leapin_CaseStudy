import { Router } from "express";
import { Member } from "../database/models/Member.js";
import { FundingPeriod } from "../database/models/FundingPeriod.js";
import type { CreateMemberRequest, BalanceSummary } from "../types/dto.js";

const router = Router();

// POST /members
// Creates a new member under the active organisation.
// Protected — requires X-Org-Id header (enforced by tenant middleware in index.ts).
router.post("/", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const body = req.body as Partial<CreateMemberRequest>;

    // Validate required fields
    if (!body.firstName || body.firstName.trim() === "") {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`firstName` is required and must be a non-empty string.",
        },
      });
      return;
    }

    if (!body.lastName || body.lastName.trim() === "") {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`lastName` is required and must be a non-empty string.",
        },
      });
      return;
    }

    const member = await Member.create({
      organisationId: orgId,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
    });

    res.status(201).json({
      id: member.id,
      organisationId: member.organisationId,
      firstName: member.firstName,
      lastName: member.lastName,
      createdAt: member.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /members/:memberId/balances
// Returns all funding period balances for a member.
// Optional query param: ?asAt=YYYY-MM-DD
// If asAt is provided, only returns funding periods active on that date.
router.get("/:memberId/balances", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const memberId = req.params["memberId"] as string;
    const asAt = req.query["asAt"] as string | undefined;

    // Verify the member exists and belongs to this org
    const member = await Member.findOne({
      where: { id: memberId, organisationId: orgId },
    });

    if (!member) {
      res.status(404).json({
        error: {
          code: "MEMBER_NOT_FOUND",
          message: `Member ${memberId} not found.`,
        },
      });
      return;
    }

    // Load all funding periods for this member
    const fundingPeriods = await FundingPeriod.findAll({
      where: { memberId, organisationId: orgId },
      order: [["startDate", "DESC"]],
    });

    // If asAt is provided, filter to periods covering that date
    const filtered = asAt
      ? fundingPeriods.filter(
          (fp) => asAt >= fp.startDate && asAt <= fp.endDate,
        )
      : fundingPeriods;

    // Validate asAt format if provided
    if (asAt && !/^\d{4}-\d{2}-\d{2}$/.test(asAt)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`asAt` must be a valid date in YYYY-MM-DD format.",
        },
      });
      return;
    }

    // Map to clean response shape — no internal Sequelize properties exposed
    const balances: BalanceSummary[] = filtered.map((fp) => ({
      fundingPeriodId: fp.id,
      startDate: fp.startDate,
      endDate: fp.endDate,
      quarterlyBudget: Number(fp.quarterlyBudget),
      availableBalance: Number(fp.availableBalance),
      isLocked: fp.isLocked,
    }));

    res.status(200).json({ memberId, balances });
  } catch (error) {
    next(error);
  }
});

export default router;
