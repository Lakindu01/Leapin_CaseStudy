import 'dotenv/config';
import 'reflect-metadata';
import { initDatabase } from '../database/index.js';
import { finaliseFundingPeriod } from '../services/finalisationService.js';
import type { SQSEvent, SQSBatchResponse } from 'aws-lambda';

// Processes finalisation messages from SQS.
// Each message contains a fundingPeriodId and organisationId.
// Uses ReportBatchItemFailures — if one message fails only that
// message goes back to the queue, not the entire batch.
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  await initDatabase();

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body) as {
        fundingPeriodId: string;
        organisationId: string;
      };

      if (!body.fundingPeriodId || !body.organisationId) {
        throw new Error('Missing fundingPeriodId or organisationId in message body.');
      }

      await finaliseFundingPeriod(body.fundingPeriodId, body.organisationId);

      console.log(`Finalisation complete for period ${body.fundingPeriodId}`);
    } catch (error) {
      console.error(`Failed to process message ${record.messageId}:`, error);
      // Report this message as failed — SQS will retry it
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}