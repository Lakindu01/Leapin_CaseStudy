import { Router } from "express";
import { Op } from "sequelize";
import { Claim } from "../database/models/Claim.js";
import { createDraftClaim, approveClaim } from "../services/claimService.js";
import type {
  CreateDraftClaimRequest,
  ClaimSearchRequest,
  ClaimStatus,
  ServiceCategory,
} from "../types/dto.js";

const router = Router();

// POST /claims/draft
// Creates a draft claim with all monetary fields calculated.
// Does NOT deduct from budget — only APPROVED claims affect balance.
// Protected — requires X-Org-Id header.
router.post("/draft", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const body = req.body as Partial<CreateDraftClaimRequest>;

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

    if (!body.invoiceId || typeof body.invoiceId !== "string") {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`invoiceId` is required.",
        },
      });
      return;
    }

    if (!body.serviceDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.serviceDate)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "`serviceDate` is required and must be in YYYY-MM-DD format.",
        },
      });
      return;
    }

    // ── Delegate to service layer ─────────────────────────────────────────────
    // All business logic lives in claim.service.ts — route stays thin
    const claim = await createDraftClaim(
      {
        memberId: body.memberId,
        invoiceId: body.invoiceId,
        serviceDate: body.serviceDate,
      },
      orgId,
    );

    res.status(201).json({
      id: claim.id,
      organisationId: claim.organisationId,
      memberId: claim.memberId,
      fundingPeriodId: claim.fundingPeriodId,
      invoiceId: claim.invoiceId,
      serviceDate: claim.serviceDate,
      serviceCategory: claim.serviceCategory,
      invoiceTotalInclusive: Number(claim.invoiceTotalInclusive),
      gstExclusiveAmount: Number(claim.gstExclusiveAmount),
      markedUpTotal: Number(claim.markedUpTotal),
      memberCoContributionAmount: Number(claim.memberCoContributionAmount),
      governmentFundedAmount: Number(claim.governmentFundedAmount),
      status: claim.status,
      createdAt: claim.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /claims/:claimId/approve
// Approves a draft claim and deducts government-funded amount from budget.
// Idempotent — approving an already approved claim returns 200 with existing claim.
// Protected — requires X-Org-Id header.
router.post("/:claimId/approve", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const claimId = req.params["claimId"] as string;

    if (!claimId) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`claimId` is required.",
        },
      });
      return;
    }

    const claim = await approveClaim(claimId, orgId);

    res.status(200).json({
      id: claim.id,
      organisationId: claim.organisationId,
      memberId: claim.memberId,
      fundingPeriodId: claim.fundingPeriodId,
      invoiceId: claim.invoiceId,
      serviceDate: claim.serviceDate,
      serviceCategory: claim.serviceCategory,
      invoiceTotalInclusive: Number(claim.invoiceTotalInclusive),
      gstExclusiveAmount: Number(claim.gstExclusiveAmount),
      markedUpTotal: Number(claim.markedUpTotal),
      memberCoContributionAmount: Number(claim.memberCoContributionAmount),
      governmentFundedAmount: Number(claim.governmentFundedAmount),
      status: claim.status,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /claims/search
// Searches claims with optional filters.
// Supports: memberId, status, fromDate, toDate, serviceCategory
// Protected — requires X-Org-Id header.
router.get("/search", async (req, res, next) => {
  try {
    const orgId = res.locals["tenantOrgId"] as string;
    const query = req.query as Partial<ClaimSearchRequest>;

    // Build where clause dynamically based on provided filters
    // organisationId is always included for tenant isolation
    const where: Record<string, unknown> = { organisationId: orgId };

    if (query.memberId) {
      where["memberId"] = query.memberId;
    }

    if (query.status) {
      const validStatuses: ClaimStatus[] = ["DRAFT", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(query.status as ClaimStatus)) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "`status` must be one of DRAFT, APPROVED, REJECTED.",
          },
        });
        return;
      }
      where["status"] = query.status;
    }

    if (query.serviceCategory) {
      const validCategories: ServiceCategory[] = [
        "CLINICAL",
        "INDEPENDENCE",
        "EVERYDAY_LIVING",
      ];
      if (!validCategories.includes(query.serviceCategory as ServiceCategory)) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "`serviceCategory` must be one of CLINICAL, INDEPENDENCE, EVERYDAY_LIVING.",
          },
        });
        return;
      }
      where["serviceCategory"] = query.serviceCategory;
    }

    // Date range filter on serviceDate
    if (query.fromDate && query.toDate) {
      where["serviceDate"] = {
        [Op.between]: [query.fromDate, query.toDate],
      };
    } else if (query.fromDate) {
      where["serviceDate"] = { [Op.gte]: query.fromDate };
    } else if (query.toDate) {
      where["serviceDate"] = { [Op.lte]: query.toDate };
    }

    const claims = await Claim.findAll({
      where,
      order: [["serviceDate", "DESC"]],
    });

    res.status(200).json({
      count: claims.length,
      claims: claims.map((claim) => ({
        id: claim.id,
        memberId: claim.memberId,
        fundingPeriodId: claim.fundingPeriodId,
        invoiceId: claim.invoiceId,
        serviceDate: claim.serviceDate,
        serviceCategory: claim.serviceCategory,
        markedUpTotal: Number(claim.markedUpTotal),
        memberCoContributionAmount: Number(claim.memberCoContributionAmount),
        governmentFundedAmount: Number(claim.governmentFundedAmount),
        status: claim.status,
        createdAt: claim.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
