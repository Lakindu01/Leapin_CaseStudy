import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { FundingPeriod } from './FundingPeriod.js';

@Table({ tableName: 'finalisation_jobs', timestamps: true })
export class FinalisationJob extends Model {
  // ─── Primary Key ────────────────────────────────────────────────────────────
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  // ─── Tenant Scoping ──────────────────────────────────────────────────────────
  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  // ─── Funding Period Link ─────────────────────────────────────────────────────
  @ForeignKey(() => FundingPeriod)
  @Column({ type: DataType.UUID, allowNull: false })
  fundingPeriodId!: string;

  // ─── Calculated Finalisation Figures ─────────────────────────────────────────
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  totalSpent!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unspentBudgetCalculated!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  rolledOverAmount!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  totalApprovedClaimsCount!: number;

  // ─── Status ──────────────────────────────────────────────────────────────────
  @Column({
    type: DataType.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
  })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  completedAt!: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  errorMessage!: string | null;

  // ─── Associations ────────────────────────────────────────────────────────────
  @BelongsTo(() => Organisation)
  organisation!: Organisation;

  @BelongsTo(() => FundingPeriod)
  fundingPeriod!: FundingPeriod;
}