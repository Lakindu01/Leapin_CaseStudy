import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organisation } from './Organisation.js';
import { Member } from './Member.js';
import { ServiceItem } from './ServiceItem.js';

@Table({ tableName: 'invoices', timestamps: true })
export class Invoice extends Model {
  // ─── Primary Key ────────────────────────────────────────────────────────────
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  // ─── Tenant Scoping ──────────────────────────────────────────────────────────
  @ForeignKey(() => Organisation)
  @Column({ type: DataType.UUID, allowNull: false })
  organisationId!: string;

  // ─── Member Link ─────────────────────────────────────────────────────────────
  // ADDED: Invoice must be linked to a member for tenant-scoped lookups
  @ForeignKey(() => Member)
  @Column({ type: DataType.UUID, allowNull: false })
  memberId!: string;

  // ─── Service Item Link ───────────────────────────────────────────────────────
  @ForeignKey(() => ServiceItem)
  @Column({ type: DataType.UUID, allowNull: false })
  serviceItemId!: string;

  // ─── Invoice Identity ────────────────────────────────────────────────────────
  @Column({ type: DataType.STRING, allowNull: false })
  invoiceNumber!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  issueDate!: string;

  // ─── Line Item Fields ────────────────────────────────────────────────────────
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unitPriceInclusive!: number;

  @Column({ type: DataType.DECIMAL(5, 4), allowNull: false, defaultValue: 0.1 })
  gstRate!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  totalAmountInclusive!: number;

  // ─── Associations ────────────────────────────────────────────────────────────
  @BelongsTo(() => Organisation)
  organisation!: Organisation;

  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => ServiceItem)
  serviceItem!: ServiceItem;
}