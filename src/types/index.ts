// ERP System Types
// 企业资源规划系统类型定义

import { Decimal } from '@prisma/client/runtime/library'

// 用户相关
export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'PURCHASE' | 'WAREHOUSE' | 'FINANCE' | 'EMPLOYEE'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  department?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 产品相关
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  parent?: Category
  children?: Category[]
  isActive: boolean
  sortOrder: number
}

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  categoryId: string
  category?: Category
  unit: string
  costPrice: Decimal | number
  sellPrice: Decimal | number
  minPrice?: Decimal | number
  weight?: Decimal | number
  images: string[]
  isActive: boolean
  isFeatured: boolean
}

// 库存相关
export interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  contact?: string
  phone?: string
  managerId?: string
  isActive: boolean
}

export interface Inventory {
  id: string
  productId: string
  product?: Product
  warehouseId: string
  warehouse?: Warehouse
  quantity: number
  reservedQty: number
  reorderPoint: number
  safetyStock: number
  location?: string
  lastCheckAt?: Date
}

// 销售相关
export type CustomerType = 'COMPANY' | 'INDIVIDUAL'

export interface Customer {
  id: string
  code: string
  name: string
  type: CustomerType
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  bankAccount?: string
  creditLimit: Decimal | number
  creditDays: number
  isActive: boolean
}

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer?: Customer
  status: OrderStatus
  totalAmount: Decimal | number
  discount: Decimal | number
  taxRate: Decimal | number
  taxAmount: Decimal | number
  finalAmount: Decimal | number
  orderDate: Date
  deliveryDate?: Date
  deliveryAddress?: string
  note?: string
  salesPersonId?: string
  salesPerson?: User
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: Product
  quantity: number
  unitPrice: Decimal | number
  discount: Decimal | number
  taxRate: Decimal | number
  amount: Decimal | number
  note?: string
}

// 采购相关
export interface Supplier {
  id: string
  code: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  bankAccount?: string
  leadTime: number
  minOrderQty: number
  isActive: boolean
}

export type PurchaseStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'SHIPPED' | 'PARTIAL' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'

export interface Purchase {
  id: string
  purchaseNumber: string
  supplierId: string
  supplier?: Supplier
  status: PurchaseStatus
  totalAmount: Decimal | number
  taxAmount: Decimal | number
  finalAmount: Decimal | number
  orderDate: Date
  expectedDate?: Date
  receivedDate?: Date
  warehouseId?: string
  note?: string
  purchaserId?: string
  purchaser?: User
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string
  product?: Product
  quantity: number
  unitPrice: Decimal | number
  taxRate: Decimal | number
  amount: Decimal | number
  receivedQty: number
  note?: string
}

// 财务相关
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  parentId?: string
  parent?: Account
  children?: Account[]
  balance: Decimal | number
  isSystem: boolean
}

export type TransactionType = 
  | 'SALES_REVENUE' 
  | 'PURCHASE_EXPENSE' 
  | 'SALES_RETURN' 
  | 'PURCHASE_RETURN' 
  | 'OTHER_INCOME' 
  | 'OTHER_EXPENSE'

export type TransactionDirection = 'DEBIT' | 'CREDIT'

export interface Transaction {
  id: string
  voucherNo: string
  date: Date
  type: TransactionType
  accountId: string
  account?: Account
  amount: Decimal | number
  direction: TransactionDirection
  referenceType?: string
  referenceId?: string
  description: string
}

// 报表类型
export type ReportType = 
  | 'SALES_SUMMARY'
  | 'SALES_DETAIL'
  | 'PURCHASE_SUMMARY'
  | 'PURCHASE_DETAIL'
  | 'INVENTORY_STATUS'
  | 'INVENTORY_MOVEMENT'
  | 'PROFIT_LOSS'
  | 'CUSTOMER_STAT'
  | 'SUPPLIER_STAT'

export interface Report {
  id: string
  name: string
  type: ReportType
  config: string
  isPublic: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
}

// 活动日志
export interface Activity {
  id: string
  userId: string
  user?: User
  action: string
  entityType: string
  entityId: string
  details?: string
  ipAddress?: string
  createdAt: Date
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
