import express from 'express';
import serverless from 'serverless-http';
import { initDatabase } from './database/index.js';
import { tenantIsolationMiddleware } from './middleware/tenant.js';
import { Organisation } from './database/models/Organisation.js';
import { Member } from './database/models/Member.js';

const app = express();
app.use(express.json()); // Allow express to read JSON request bodies [cite: 154]

// --- PUBLIC ROUTE ---
// Creating an organization must be public, because a tenant doesn't have an ID yet! 
app.post('/organisations', async (req, res) => {
  try {
    const { name } = req.body;
    const org = await Organisation.create({ name });
    return res.status(201).json(org); // 201 Created 
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create organisation.' });
  }
});

// --- PROTECTED ROUTES (Requires X-Org-Id Header) ---
app.use(tenantIsolationMiddleware);

// Create Member Route [cite: 125]
app.post('/members', async (req, res) => {
  try {
    const { firstName, lastName, tenantId } = req.body; // tenantId was injected by middleware
    
    const member = await Member.create({
      firstName,
      lastName,
      organisationId: tenantId // Ironclad data isolation enforced [cite: 7, 56]
    });
    
    return res.status(201).json(member);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create member.' });
  }
});

// Simple healthcheck to verify routing works
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tenant validation successful!' });
});

// Initialize database before starting server execution
await initDatabase();

// Export the application wrapped in serverless-http for AWS Lambda compatibility [cite: 11]
export const handler = serverless(app);

// Keep local fallback listener active for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Local Server listening on http://localhost:3000'));
}