import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({ tableName: 'organisations', timestamps: true })
export class Organisation extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

}