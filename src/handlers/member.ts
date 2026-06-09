import { withTenantIsolation } from '../utils/withTenant.js';
import { Member } from '../database/models/Member.js';

export const create = withTenantIsolation(async (event, tenantId) => {
  const { firstName, lastName } = JSON.parse(event.body || '{}');
  
  const member = await Member.create({
    firstName,
    lastName,
    organisationId: tenantId 
  });

  return {
    statusCode: 201, 
    body: JSON.stringify(member)
  };
});