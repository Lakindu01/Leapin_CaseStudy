import { Sequelize } from 'sequelize-typescript';
import { Organisation } from './models/Organisation.js';
import { Member } from './models/Member.js';
import { FundingPeriod } from './models/FundingPeriod.js';
import { Claim } from './models/Claim.js';
// Import your other models here as you create them

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'rootpassword',
  database: 'support_home_dev',
  logging: false,
  models: [Organisation, Member, FundingPeriod, Claim], // Register your models here
});

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    // alter: true automatically updates tables if you change fields while learning
    await sequelize.sync({ alter: true }); 
    console.log('Database connected and sync complete.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}