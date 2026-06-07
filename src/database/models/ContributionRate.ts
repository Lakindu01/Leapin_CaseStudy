import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';

@Table({ tableName: 'contribution_rates', timestamps: true })
export class ContributionRate extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string; // [cite: 71]

  @Column({ type: DataType.DATEONLY, allowNull: false })
  startDate!: string; // [cite: 72]

  @Column({ type: DataType.DATEONLY, allowNull: true })
  endDate!: string; // [cite: 73]

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  independenceRate!: number; // [cite: 74]

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  everydayLivingRate!: number; // [cite: 75]

  @Column({ type: DataType.STRING, allowNull: true })
  note!: string; // [cite: 76]

  @BelongsTo(() => Member)
  member!: Member;
}