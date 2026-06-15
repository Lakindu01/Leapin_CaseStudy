import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';

@Table({ tableName: 'members', timestamps: true })
export class Member extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  // CRITICAL: Every table must point back to its specific Organisation
  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  firstName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastName!: string;

  @BelongsTo(() => Organisation)
  organisation!: Organisation;
}