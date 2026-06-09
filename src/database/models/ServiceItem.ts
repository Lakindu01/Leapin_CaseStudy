import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';

@Table({ tableName: 'service_items', timestamps: true })
export class ServiceItem extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({
    type: DataType.ENUM('CLINICAL', 'INDEPENDENCE', 'EVERYDAY_LIVING'), 
    allowNull: false,
  })
  serviceCategory!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unitPriceInclusive!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  unit!: number;
}