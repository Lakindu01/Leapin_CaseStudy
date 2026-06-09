import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';
import { FundingPeriod } from './FundingPeriod.js';
import { Invoice } from './Invoice.js';

@Table({ tableName: 'claims', timestamps: true })
export class Claim extends Model {
  // ─── Primary Key ────────────────────────────────────────────────────────────
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  // ─── Tenant Scoping ──────────────────────────────────────────────────────────
  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  // ─── Core Relations ──────────────────────────────────────────────────────────
  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string;

  @ForeignKey(() => FundingPeriod)
  @Column({ type: DataType.UUID, allowNull: false })
  fundingPeriodId!: string;

  @ForeignKey(() => Invoice)
  @Column({ type: DataType.UUID, allowNull: false })
  invoiceId!: string;

  // ─── Service Info ────────────────────────────────────────────────────────────
  @Column({ type: DataType.DATEONLY, allowNull: false })
  serviceDate!: string;

  // Drives co-contribution routing: CLINICAL=0, INDEPENDENCE=rate, EVERYDAY_LIVING=rate
  @Column({ type: DataType.ENUM('CLINICAL', 'INDEPENDENCE', 'EVERYDAY_LIVING'), allowNull: false })
  serviceCategory!: string;

  // ─── Calculated Monetary Fields ──────────────────────────────────────────────
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  invoiceTotalInclusive!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  gstExclusiveAmount!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  markedUpTotal!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  memberCoContributionAmount!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  governmentFundedAmount!: number;

  // ─── Status ──────────────────────────────────────────────────────────────────
  @Column({ type: DataType.ENUM('DRAFT', 'APPROVED', 'REJECTED'), defaultValue: 'DRAFT' })
  status!: string;

  // ─── Associations ────────────────────────────────────────────────────────────
  @BelongsTo(() => Organisation)
  organisation!: Organisation;

  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => FundingPeriod)
  fundingPeriod!: FundingPeriod;

  @BelongsTo(() => Invoice)
  invoice!: Invoice;
}