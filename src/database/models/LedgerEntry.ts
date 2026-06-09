import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';
import { FundingPeriod } from './FundingPeriod.js';

@Table({ tableName: 'ledger_entries', timestamps: true })
export class LedgerEntry extends Model {
  // ─── Primary Key ────────────────────────────────────────────────────────────
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  // ─── Tenant Scoping ──────────────────────────────────────────────────────────
  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  // ─── Relations ───────────────────────────────────────────────────────────────
  @ForeignKey(() => FundingPeriod)
  @Column({ type: DataType.UUID, allowNull: false })
  fundingPeriodId!: string;

  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string;

  // ─── Entry Data ──────────────────────────────────────────────────────────────
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Column({
    type: DataType.ENUM('ALLOCATION', 'CLAIM_DEDUCTION', 'ROLLOVER'),
    allowNull: false,
  })
  type!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  referenceId!: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  description!: string | null;

  // ─── Associations ────────────────────────────────────────────────────────────
  @BelongsTo(() => Organisation)
  organisation!: Organisation;

  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => FundingPeriod)
  fundingPeriod!: FundingPeriod;
}