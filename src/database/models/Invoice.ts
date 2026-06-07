import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';

@Table({ tableName: 'invoices', timestamps: true })
export class Invoice extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  invoiceNumber!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  issueDate!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  totalAmountInclusive!: number;
}