import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { FundingPeriod } from './FundingPeriod.js';

@Table({ tableName: 'ledger_entries', timestamps: true })
export class LedgerEntry extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @ForeignKey(() => FundingPeriod)
  @Column({ type: DataType.UUID, allowNull: false })
  fundingPeriodId!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Column({
    type: DataType.ENUM('ALLOCATION', 'CLAIM_DEDUCTION', 'ROLLOVER'),
    allowNull: false,
  })
  type!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  referenceId!: string; // Holds the associated Claim ID or Job ID for tracking
}