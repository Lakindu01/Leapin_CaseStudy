import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { FundingPeriod } from './FundingPeriod.js';

@Table({ tableName: 'finalisation_jobs', timestamps: true })
export class FinalisationJob extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @ForeignKey(() => FundingPeriod)
  @Column({ type: DataType.UUID, allowNull: false })
  fundingPeriodId!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unspentBudgetCalculated!: number; // [cite: 112]

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  rolledOverAmount!: number; // [cite: 112]

  @Column({
    type: DataType.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
  })
  status!: string;
}