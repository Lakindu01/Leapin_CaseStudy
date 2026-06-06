import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';

@Table({ tableName: 'funding_periods', timestamps: true })
export class FundingPeriod extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  startDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  endDate!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  quarterlyBudget!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  availableBalance!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isLocked!: boolean; // Set to true when quarter finalisation runs

  @BelongsTo(() => Member)
  member!: Member;
}