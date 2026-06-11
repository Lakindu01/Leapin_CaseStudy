import { Router } from "express";
import { Organisation } from "../database/models/Organisation.js";
import type { CreateOrganisationRequest } from "../types/dto.js";

const router = Router();

// POST /organisations
// Creates a new organisation (tenant).
// This is a PUBLIC route — no X-Org-Id header required because
// the organisation doesn't exist yet when this is called.
router.post("/", async (req, res, next) => {
  try {
    const body = req.body as Partial<CreateOrganisationRequest>;

    // Validate required fields
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim() === ""
    ) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "`name` is required and must be a non-empty string.",
        },
      });
      return;
    }

    const organisation = await Organisation.create({
      name: body.name.trim(),
      isActive: true,
    });

    res.status(201).json({
      id: organisation.id,
      name: organisation.name,
      isActive: organisation.isActive,
      createdAt: organisation.createdAt,
    });
  } catch (error) {
    // Pass to central errorHandler middleware in index.ts
    next(error);
  }
});

export default router;
