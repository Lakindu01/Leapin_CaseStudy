import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';

@Table({ tableName: 'claims', timestamps: true })
export class Claim extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  serviceDate!: string;

  @Column({ type: DataType.ENUM('CLINICAL', 'INDEPENDENCE', 'EVERYDAY_LIVING'), allowNull: false })
  serviceCategory!: string; // Used for co-contribution routing

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  invoiceTotalInclusive!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  governmentFundedAmount!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  memberCoContributionAmount!: number;

  @Column({ type: DataType.ENUM('DRAFT', 'APPROVED', 'REJECTED'), defaultValue: 'DRAFT' })
  status!: string;

  @BelongsTo(() => Member)
  member!: Member;
}