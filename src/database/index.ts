import { Sequelize } from 'sequelize-typescript';
import { Organisation } from './models/Organisation.js';
import { Member } from './models/Member.js';
import { FundingPeriod } from './models/FundingPeriod.js';
import { Claim } from './models/Claim.js';
import { LedgerEntry } from './models/LedgerEntry.js';
import { ContributionRate } from './models/ContributionRate.js';
import { Invoice } from './models/Invoice.js';
import { FinalisationJob } from './models/FinalisationJob.js';
import { ServiceItem } from './models/ServiceItem.js';
// Import your other models here as you create them

import 'reflect-metadata';

const {
  DB_HOST     = 'localhost',
  DB_PORT     = '3306',
  DB_USER     = 'root',
  DB_PASSWORD = '',
  DB_NAME     = 'support_home_dev',
  NODE_ENV    = 'development',
} = process.env;

export const sequelize = new Sequelize({
  dialect:  'mysql',
  host:     DB_HOST,
  port:     parseInt(DB_PORT, 10),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  logging:  NODE_ENV === 'development' ? console.log : false,
  models: [Organisation, Member, FundingPeriod, Claim, LedgerEntry, ContributionRate, Invoice, FinalisationJob, ServiceItem], // Register your models here
});

export async function initDatabase() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
    }
    console.log('Database connected and sync complete.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}