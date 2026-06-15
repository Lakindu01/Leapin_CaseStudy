import 'dotenv/config';
import 'reflect-metadata';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { initDatabase } from '../database/index.js';
import { FundingPeriod } from '../database/models/FundingPeriod.js';
import { Op } from 'sequelize';

const sqs = new SQSClient({ region: process.env['AWS_REGION'] ?? 'eu-north-1' });

// Triggered by EventBridge on a schedule (every Sunday midnight UTC).
// Finds all funding periods that have ended and are not yet finalised,
// then sends each one to SQS for the worker to process.
export async function handler(): Promise<void> {
  await initDatabase();

  const today = new Date().toISOString().split('T')[0] as string;

  // Find all periods that have ended and are not locked yet
  const periodsToFinalise = await FundingPeriod.findAll({
    where: {
      endDate:  { [Op.lt]: today },
      isLocked: false,
    },
  });

  console.log(`Found ${periodsToFinalise.length} periods to finalise.`);

  for (const period of periodsToFinalise) {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl:    process.env['SQS_QUEUE_URL'],
        MessageBody: JSON.stringify({
          fundingPeriodId: period.id,
          organisationId:  period.organisationId,
        }),
      }),
    );
    console.log(`Queued finalisation for period ${period.id}`);
  }
}