import type { Request, Response, NextFunction } from 'express';
import { Organisation } from '../database/models/Organisation.js';

export async function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Extract the header (Express automatically converts headers to lowercase)
  const orgId = req.headers['x-org-id'];

  // 2. If missing, reject immediately with a 400 Bad Request 
  if (!orgId || typeof orgId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'MISSING_TENANT_HEADER',
        message: 'The mandatory X-Org-Id header is missing from the request.'
      }
    });
  }

  try {
    // 3. Check if the organization exists in our database
    const org = await Organisation.findByPk(orgId);

    // 4. If unknown or inactive, reject the request 
    if (!org || !org.isActive) {
      return res.status(403).json({
        error: {
          code: 'ORGANISATION_ACCESS_REJECTED',
          message: 'The requested organisation is unknown, inactive, or unauthorized.'
        }
      });
    }

    // 5. Success! Attach the tenant context to the request object so our routes can use it
    req.body.tenantId = orgId;
    
    // Pass control to the actual API route function
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error validating tenant.' });
  }
}