import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Organisation } from '../database/models/Organisation.js';
import { initDatabase } from '../database/index.js';

// Make sure database is synced on boot
await initDatabase();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // 1. In Lambda, the body comes as a stringified JSON string, so we must parse it
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }
    const { name } = JSON.parse(event.body);

    // 2. Interact with our existing Sequelize model exactly like before
    const org = await Organisation.create({ name });

    // 3. Return a formal APIGateway response object 
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(org),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create organisation.' }),
    };
  }
};