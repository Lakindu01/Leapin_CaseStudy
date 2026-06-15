import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Support at Home Claim & Contribution Processor',
      version:     '1.0.0',
      description: 'API for managing aged care claims, contributions, and funding periods.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    components: {
      parameters: {
        XOrgId: {
          name:        'X-Org-Id',
          in:          'header',
          required:    true,
          description: 'Organisation ID for tenant isolation.',
          schema:      { type: 'string', format: 'uuid' },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code:    { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'A human readable error message.' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
        Organisation: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            isActive:  { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            organisationId: { type: 'string', format: 'uuid' },
            firstName:      { type: 'string' },
            lastName:       { type: 'string' },
            createdAt:      { type: 'string', format: 'date-time' },
          },
        },
        FundingPeriod: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            organisationId:   { type: 'string', format: 'uuid' },
            memberId:         { type: 'string', format: 'uuid' },
            startDate:        { type: 'string', format: 'date' },
            endDate:          { type: 'string', format: 'date' },
            quarterlyBudget:  { type: 'number' },
            availableBalance: { type: 'number' },
            isLocked:         { type: 'boolean' },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },
        Claim: {
          type: 'object',
          properties: {
            id:                         { type: 'string', format: 'uuid' },
            organisationId:             { type: 'string', format: 'uuid' },
            memberId:                   { type: 'string', format: 'uuid' },
            fundingPeriodId:            { type: 'string', format: 'uuid' },
            invoiceId:                  { type: 'string', format: 'uuid' },
            serviceDate:                { type: 'string', format: 'date' },
            serviceCategory:            { type: 'string', enum: ['CLINICAL', 'INDEPENDENCE', 'EVERYDAY_LIVING'] },
            invoiceTotalInclusive:      { type: 'number' },
            gstExclusiveAmount:         { type: 'number' },
            markedUpTotal:              { type: 'number' },
            memberCoContributionAmount: { type: 'number' },
            governmentFundedAmount:     { type: 'number' },
            status:                     { type: 'string', enum: ['DRAFT', 'APPROVED', 'REJECTED'] },
            createdAt:                  { type: 'string', format: 'date-time' },
          },
        },
        BalanceSummary: {
          type: 'object',
          properties: {
            fundingPeriodId:  { type: 'string', format: 'uuid' },
            startDate:        { type: 'string', format: 'date' },
            endDate:          { type: 'string', format: 'date' },
            quarterlyBudget:  { type: 'number' },
            availableBalance: { type: 'number' },
            isLocked:         { type: 'boolean' },
          },
        },
        FinaliseQuarterResult: {
          type: 'object',
          properties: {
            jobId:                    { type: 'string', format: 'uuid' },
            fundingPeriodId:          { type: 'string', format: 'uuid' },
            totalSpent:               { type: 'number' },
            unspentBudget:            { type: 'number' },
            rolledOverAmount:         { type: 'number' },
            totalApprovedClaimsCount: { type: 'number' },
          },
        },
      },
    },
    paths: {
      '/organisations': {
        post: {
          summary:     'Create an organisation',
          tags:        ['Organisations'],
          requestBody: {
            required: true,
            content:  {
              'application/json': {
                schema: {
                  type:       'object',
                  required:   ['name'],
                  properties: { name: { type: 'string', example: 'Aged Care Vic' } },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Organisation created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } },
            '400': { description: 'Validation error',    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/members': {
        post: {
          summary:    'Create a member',
          tags:       ['Members'],
          parameters: [{ $ref: '#/components/parameters/XOrgId' }],
          requestBody: {
            required: true,
            content:  {
              'application/json': {
                schema: {
                  type:       'object',
                  required:   ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', example: 'John' },
                    lastName:  { type: 'string', example: 'Smith' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Member created',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Member' } } } },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',     content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/members/{memberId}/balances': {
        get: {
          summary:    'Get member balances',
          tags:       ['Members'],
          parameters: [
            { $ref: '#/components/parameters/XOrgId' },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'asAt',     in: 'query', required: false, schema: { type: 'string', format: 'date' }, description: 'Filter balances active on this date (YYYY-MM-DD)' },
          ],
          responses: {
            '200': { description: 'Member balances',  content: { 'application/json': { schema: { type: 'object', properties: { memberId: { type: 'string' }, balances: { type: 'array', items: { $ref: '#/components/schemas/BalanceSummary' } } } } } } },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',     content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Member not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/funding-periods': {
        post: {
          summary:    'Create a funding period',
          tags:       ['Funding Periods'],
          parameters: [{ $ref: '#/components/parameters/XOrgId' }],
          requestBody: {
            required: true,
            content:  {
              'application/json': {
                schema: {
                  type:       'object',
                  required:   ['memberId', 'startDate', 'endDate', 'quarterlyBudget'],
                  properties: {
                    memberId:        { type: 'string', format: 'uuid' },
                    startDate:       { type: 'string', format: 'date', example: '2026-01-01' },
                    endDate:         { type: 'string', format: 'date', example: '2026-03-31' },
                    quarterlyBudget: { type: 'number', example: 5000 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Funding period created', content: { 'application/json': { schema: { $ref: '#/components/schemas/FundingPeriod' } } } },
            '400': { description: 'Validation error',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',           content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Member not found',       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',         content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/claims/draft': {
        post: {
          summary:    'Create a draft claim',
          tags:       ['Claims'],
          parameters: [{ $ref: '#/components/parameters/XOrgId' }],
          requestBody: {
            required: true,
            content:  {
              'application/json': {
                schema: {
                  type:       'object',
                  required:   ['memberId', 'invoiceId', 'serviceDate'],
                  properties: {
                    memberId:    { type: 'string', format: 'uuid' },
                    invoiceId:   { type: 'string', format: 'uuid' },
                    serviceDate: { type: 'string', format: 'date', example: '2026-01-15' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Draft claim created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Claim' } } } },
            '400': { description: 'Validation error',    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/claims/{claimId}/approve': {
        post: {
          summary:    'Approve a claim',
          tags:       ['Claims'],
          parameters: [
            { $ref: '#/components/parameters/XOrgId' },
            { name: 'claimId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Claim approved',          content: { 'application/json': { schema: { $ref: '#/components/schemas/Claim' } } } },
            '400': { description: 'Validation error',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Claim not found',         content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Invalid state or budget', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/claims/search': {
        get: {
          summary:    'Search claims',
          tags:       ['Claims'],
          parameters: [
            { $ref: '#/components/parameters/XOrgId' },
            { name: 'memberId',        in: 'query', required: false, schema: { type: 'string', format: 'uuid' } },
            { name: 'status',          in: 'query', required: false, schema: { type: 'string', enum: ['DRAFT', 'APPROVED', 'REJECTED'] } },
            { name: 'fromDate',        in: 'query', required: false, schema: { type: 'string', format: 'date' } },
            { name: 'toDate',          in: 'query', required: false, schema: { type: 'string', format: 'date' } },
            { name: 'serviceCategory', in: 'query', required: false, schema: { type: 'string', enum: ['CLINICAL', 'INDEPENDENCE', 'EVERYDAY_LIVING'] } },
          ],
          responses: {
            '200': { description: 'Claims list',     content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'number' }, claims: { type: 'array', items: { $ref: '#/components/schemas/Claim' } } } } } } },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',     content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/jobs/finalise-quarter': {
        post: {
          summary:    'Finalise a quarter',
          tags:       ['Jobs'],
          parameters: [{ $ref: '#/components/parameters/XOrgId' }],
          requestBody: {
            required: true,
            content:  {
              'application/json': {
                schema: {
                  type:       'object',
                  required:   ['fundingPeriodId'],
                  properties: { fundingPeriodId: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
          responses: {
            '202': { description: 'Finalisation accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/FinaliseQuarterResult' } } } },
            '400': { description: 'Validation error',      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Org rejected',          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Already finalised',     content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Internal error',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const openapiSpec = swaggerJsdoc(options);