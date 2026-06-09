import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Organisation } from '../database/models/Organisation.js';

type LambdaHandler = (event: APIGatewayProxyEvent, tenantId: string) => Promise<APIGatewayProxyResult>;

export function withTenantIsolation(handler: LambdaHandler) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // 1. Extract the header 
    const orgId = event.headers['X-Org-Id'] || event.headers['x-org-id'];

    if (!orgId) {
      return {
        statusCode: 400, 
        body: JSON.stringify({ error: { code: 'MISSING_TENANT_HEADER', message: 'X-Org-Id is mandatory.' } }),
      };
    }

    // 2. Validate against database 
    const org = await Organisation.findByPk(orgId);
    if (!org || !org.isActive) {
      return {
        statusCode: 403, 
        body: JSON.stringify({ error: { code: 'ORGANISATION_ACCESS_REJECTED', message: 'Unauthorized tenant.' } }),
      };
    }

    // 3. Pass control to the actual handler function, feeding it the validated tenantId
    return handler(event, orgId);
  };
}