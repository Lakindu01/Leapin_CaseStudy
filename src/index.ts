import dotenv from 'dotenv';
import 'reflect-metadata';

// Serverless injects env vars before load — override with .env for local offline/dev.
dotenv.config({ override: true });

import express from 'express';
import serverless from 'serverless-http';
import swaggerUi from 'swagger-ui-express';

import { initDatabase }              from './database/index.js';
import { tenantIsolationMiddleware } from './middleware/tenant.js';
import { errorHandler }              from './middleware/errorHandler.js';
import { openapiSpec }               from './openapi.js';

import organisationRoutes  from './routes/organisationRoutes.js';
import memberRoutes        from './routes/memberRoutes.js';
import fundingPeriodRoutes from './routes/fundingPeriodRoutes.js';
import claimRoutes         from './routes/claimRoutes.js';
import jobRoutes           from './routes/jobRoutes.js';

const app = express();
app.use(express.json());

// ─── Public routes (no X-Org-Id required) ────────────────────────────────────

// GET /openapi.json — serves the raw OpenAPI specification
app.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

// Swagger UI at /docs — init must be ready before parallel asset requests on cold start.
const swaggerUiOptions = {
  swaggerOptions: { url: '/openapi.json' },
  customSiteTitle: 'Support at Home API',
};

const swaggerHtml = swaggerUi
  .generateHTML(undefined, swaggerUiOptions)
  .replace(/href="\.\//g, 'href="/docs/')
  .replace(/src="\.\//g, 'src="/docs/');

const serveSwaggerUi: express.RequestHandler = (_req, res) => {
  res.type('html').send(swaggerHtml);
};

app.get('/docs', serveSwaggerUi);
app.get('/docs/', serveSwaggerUi);
app.use('/docs', swaggerUi.serveFiles(undefined, swaggerUiOptions));

// Health check (no database required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── Database bootstrap (API routes only — /docs and /openapi.json stay available) ─
app.use(async (_req, _res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/organisations', organisationRoutes);

// ─── Tenant middleware (all routes below require X-Org-Id) ───────────────────
app.use(tenantIsolationMiddleware);

// ─── Protected routes ────────────────────────────────────────────────────────
app.use('/members',         memberRoutes);
app.use('/funding-periods', fundingPeriodRoutes);
app.use('/claims',          claimRoutes);
app.use('/jobs',            jobRoutes);

// ─── Central error handler (must be registered LAST) ─────────────────────────
app.use(errorHandler);

// Lambda export — binary MIME types required for Swagger static assets
export const handler = serverless(app, {
  binary: [
    'text/css',
    'text/javascript',
    'application/javascript',
    'image/png',
    'image/svg+xml',
    'font/woff',
    'font/woff2',
  ],
});

// Plain local dev only (not serverless-offline / Lambda)
if (process.env['NODE_ENV'] === 'development' && !process.env['AWS_LAMBDA_FUNCTION_NAME']) {
  app.listen(3000, () => console.log('Local server running: http://localhost:3000'));
}