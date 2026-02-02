import { PrismaClient, UserRole, CustomerType, MovementType, OrderStatus, PurchaseStatus, AccountType, TransactionType, TransactionDirection } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 中文姓名和公司名生成器
const chineseNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']
const companyPrefix = ['华', '恒', '瑞', '中', '新', '东', '南', '北', '金', '银']
const companySuffix = ['科技', '电子', '贸易', '制造', '实业', '集团', '信息', '系统', '网络', '智能']
const cities = ['北京', '上海', '深圳', '广州', '杭州', '南京', '武汉', '成都', '西安', '苏州']

function randomPhone(): string {
  return '1' + Math.floor(Math.random() * 9) + Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
  console.log('🌱 开始数据库种子数据...')

  // 1. 创建管理员用户
  const adminPassword = bcrypt.hashSync('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tt.com' },
    update: {},
    create: {
      email: 'admin@tt.com',
      password: adminPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      department: 'IT部',
      phone: '13800000000',
    }
  })
  console.log('✅ 创建管理员用户:', admin.email)

  // 创建 10 个普通用户
  const users = []
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i + 1}@tt.com` },
      update: {},
      create: {
        email: `user${i + 1}@tt.com`,
        password: bcrypt.hashSync('password123', 10),
        name: chineseNames[i],
        role: i < 3 ? UserRole.MANAGER : UserRole.EMPLOYEE,
        department: ['销售部', '采购部', '仓库部', '财务部'][i % 4],
        phone: randomPhone(),
        isActive: true,
      }
    })
    users.push(user)
  }
  console.log('✅ 创建用户:', users.length + 1, '个')

  // 2. 创建仓库 (3个)
  const warehouses = []
  const warehouseNames = ['主仓库', '华南仓', '华北仓']
  for (let i = 0; i < 3; i++) {
    const wh = await prisma.warehouse.upsert({
      where: { code: `WH-00${i + 1}` },
      update: {},
      create: {
        code: `WH-00${i + 1}`,
        name: warehouseNames[i],
        address: `${cities[i]}市高新技术园区${i + 1}号`,
        contact: chineseNames[i],
        phone: randomPhone(),
        managerId: users[i]?.id,
        isActive: true,
      }
    })
    warehouses.push(wh)
  }
  console.log('✅ 创建仓库:', warehouses.length, '个')

  // 3. 创建分类 (10个)
  const categories = []
  const categoryData = [
    { name: '电子元件', slug: 'dianziyuanjian' },
    { name: 'PCB板材', slug: 'bancai' },
    { name: '辅助物料', slug: 'fuwaqi' },
    { name: '连接器', slug: 'lianjieqi' },
    { name: '电源模块', slug: 'dianyuanmokuai' },
    { name: '传感器', slug: 'chuanganqi' },
    { name: '显示屏', slug: 'xianshiping' },
    { name: '电池电源', slug: 'dianchi' },
    { name: '线材线缆', slug: 'xiancaixianlan' },
    { name: '紧固件', slug: 'jingujian' },
  ]
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: `${cat.name}分类`,
        sortOrder: categoryData.indexOf(cat) + 1,
        isActive: true,
      }
    })
    categories.push(c)
  }
  console.log('✅ 创建分类:', categories.length, '个')

  // 4. 创建产品 (25个)
  const products = []
  const productTemplates = [
    { name: '电阻 10KΩ 0805', cost: 0.01, sell: 0.05 },
    { name: '电容 10uF 25V', cost: 0.02, sell: 0.08 },
    { name: '双层PCB板 10x10cm', cost: 15.00, sell: 25.00 },
    { name: 'USB-C连接器', cost: 0.50, sell: 1.20 },
    { name: 'DC-DC降压模块', cost: 3.50, sell: 8.00 },
    { name: '温湿度传感器', cost: 2.00, sell: 5.00 },
    { name: 'OLED显示屏 0.96寸', cost: 4.00, sell: 10.00 },
    { name: '锂电池 18650', cost: 5.00, sell: 12.00 },
    { name: '杜邦线公对母 20cm', cost: 0.10, sell: 0.30 },
    { name: '螺丝 M3x8mm', cost: 0.02, sell: 0.08 },
  ]
  for (let i = 0; i < 25; i++) {
    const template = productTemplates[i % productTemplates.length]
    const product = await prisma.product.upsert({
      where: { sku: `SKU-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        sku: `SKU-${String(i + 1).padStart(3, '0')}`,
        name: `${template.name} V${(i % 3) + 1}.0`,
        description: `${template.name}，第${(i % 3) + 1}代产品`,
        categoryId: categories[i % categories.length].id,
        unit: '个',
        costPrice: template.cost + Math.random() * 0.5,
        sellPrice: template.sell + Math.random() * 1,
        isActive: true,
        isFeatured: i < 5,
      }
    })
    products.push(product)
  }
  console.log('✅ 创建产品:', products.length, '个')

  // 5. 创建库存 (每个产品只在一个仓库有库存，因为 schema 中 productId 是唯一的)
  let inventoryCount = 0
  for (const product of products) {
    // 每个产品只放在主仓库
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouses[0].id,
        }
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        quantity: Math.floor(Math.random() * 5000) + 100,
        reservedQty: Math.floor(Math.random() * 100),
        reorderPoint: 100,
        safetyStock: 50,
        location: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}`,
      }
    })
    inventoryCount++
  }
  console.log('✅ 创建库存记录:', inventoryCount, '个')

  // 6. 创建客户 (25个)
  const customers = []
  for (let i = 0; i < 25; i++) {
    const city = cities[i % cities.length]
    const customer = await prisma.customer.upsert({
      where: { code: `CUST-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        code: `CUST-${String(i + 1).padStart(3, '0')}`,
        name: `${companyPrefix[i % companyPrefix.length]}${companySuffix[i % companySuffix.length]}${city}分公司`,
        type: i % 3 === 0 ? CustomerType.INDIVIDUAL : CustomerType.COMPANY,
        email: `contact${i + 1}@example${i + 1}.com`,
        phone: randomPhone(),
        address: `${city}市${['中关村', '陆家嘴', '南山区', '天河区'][i % 4]}${Math.floor(Math.random() * 100) + 1}号`,
        taxNumber: `91110000${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
        creditLimit: (Math.floor(Math.random() * 50) + 10) * 10000,
        creditDays: [30, 45, 60, 90][i % 4],
        isActive: true,
      }
    })
    customers.push(customer)
  }
  console.log('✅ 创建客户:', customers.length, '个')

  // 7. 创建供应商 (25个)
  const suppliers = []
  for (let i = 0; i < 25; i++) {
    const city = cities[i % cities.length]
    const supplier = await prisma.supplier.upsert({
      where: { code: `SUP-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        code: `SUP-${String(i + 1).padStart(3, '0')}`,
        name: `${companyPrefix[i % companyPrefix.length]}${companySuffix[i % companySuffix.length]}${city}供应中心`,
        contactPerson: chineseNames[i],
        email: `sales${i + 1}@supplier${i + 1}.com`,
        phone: randomPhone(),
        address: `${city}市工业区${Math.floor(Math.random() * 20) + 1}路${Math.floor(Math.random() * 100) + 1}号`,
        taxNumber: `91440000${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
        leadTime: Math.floor(Math.random() * 14) + 3,
        minOrderQty: Math.floor(Math.random() * 500) + 100,
        isActive: true,
      }
    })
    suppliers.push(supplier)
  }
  console.log('✅ 创建供应商:', suppliers.length, '个')

  // 8. 创建销售订单 (35个)
  const orders = []
  const orderStatuses = [OrderStatus.DRAFT, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED]
  for (let i = 0; i < 35; i++) {
    const customer = customers[i % customers.length]
    const selectedProducts = products.slice((i * 2) % products.length, (i * 2 + 3) % products.length + 1)
    let totalAmount = 0
    
    for (const p of selectedProducts) {
      const qty = Math.floor(Math.random() * 100) + 10
      totalAmount += Number(p.sellPrice) * qty
    }

    const taxRate = 0.13
    const taxAmount = totalAmount * taxRate
    const discount = totalAmount * (Math.random() * 0.1)

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
        customerId: customer.id,
        status: orderStatuses[i % orderStatuses.length],
        totalAmount: totalAmount,
        discount: discount,
        taxRate: taxRate,
        taxAmount: taxAmount,
        finalAmount: totalAmount - discount + taxAmount,
        orderDate: randomDate(new Date('2025-01-01'), new Date()),
        deliveryDate: randomDate(new Date(), new Date('2026-03-01')),
        deliveryAddress: customer.address,
        salesPersonId: users[i % users.length]?.id,
        note: `订单备注${i + 1}`,
      }
    })
    orders.push(order)

    // 创建订单明细
    for (let j = 0; j < selectedProducts.length; j++) {
      const product = selectedProducts[j]
      const qty = Math.floor(Math.random() * 100) + 10
      const itemAmount = Number(product.sellPrice) * qty
      const itemDiscount = itemAmount * (Math.random() * 0.1)

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: qty,
          unitPrice: product.sellPrice,
          discount: itemDiscount,
          taxRate: taxRate,
          amount: itemAmount - itemDiscount,
        }
      })
    }
  }
  console.log('✅ 创建销售订单:', orders.length, '个')

  // 9. 创建采购订单 (25个)
  const purchases = []
  const purchaseStatuses = [PurchaseStatus.DRAFT, PurchaseStatus.SUBMITTED, PurchaseStatus.CONFIRMED, PurchaseStatus.SHIPPED, PurchaseStatus.RECEIVED, PurchaseStatus.COMPLETED]
  for (let i = 0; i < 25; i++) {
    const supplier = suppliers[i % suppliers.length]
    const selectedProducts = products.slice((i * 3) % products.length, (i * 3 + 2) % products.length + 1)
    let totalAmount = 0

    for (const p of selectedProducts) {
      const qty = Math.floor(Math.random() * 500) + 100
      totalAmount += Number(p.costPrice) * qty
    }

    const taxRate = 0.13
    const taxAmount = totalAmount * taxRate

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber: `PUR-${Date.now().toString(36).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
        supplierId: supplier.id,
        status: purchaseStatuses[i % purchaseStatuses.length],
        totalAmount: totalAmount,
        taxAmount: taxAmount,
        finalAmount: totalAmount + taxAmount,
        orderDate: randomDate(new Date('2025-01-01'), new Date()),
        expectedDate: randomDate(new Date(), new Date('2026-03-01')),
        warehouseId: warehouses[i % warehouses.length].id,
        purchaserId: users[i % users.length]?.id,
        note: `采购备注${i + 1}`,
      }
    })
    purchases.push(purchase)

    // 创建采购明细
    for (const product of selectedProducts) {
      const qty = Math.floor(Math.random() * 500) + 100
      const itemAmount = Number(product.costPrice) * qty

      await prisma.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: product.id,
          quantity: qty,
          unitPrice: product.costPrice,
          taxRate: taxRate,
          amount: itemAmount,
          receivedQty: purchase.status === PurchaseStatus.RECEIVED || purchase.status === PurchaseStatus.COMPLETED ? qty : 0,
        }
      })
    }
  }
  console.log('✅ 创建采购订单:', purchases.length, '个')

  // 10. 创建财务账户 (12个)
  const accounts = [
    { code: '1001', name: '库存现金', type: AccountType.ASSET, balance: 50000 },
    { code: '1002', name: '银行存款', type: AccountType.ASSET, balance: 500000 },
    { code: '1003', name: '应收账款', type: AccountType.ASSET, balance: 200000 },
    { code: '1004', name: '存货', type: AccountType.ASSET, balance: 300000 },
    { code: '2001', name: '应付账款', type: AccountType.LIABILITY, balance: 100000 },
    { code: '2002', name: '短期借款', type: AccountType.LIABILITY, balance: 200000 },
    { code: '3001', name: '实收资本', type: AccountType.EQUITY, balance: 1000000 },
    { code: '3002', name: '未分配利润', type: AccountType.EQUITY, balance: 150000 },
    { code: '5001', name: '主营业务收入', type: AccountType.REVENUE, balance: 0 },
    { code: '5002', name: '其他业务收入', type: AccountType.REVENUE, balance: 0 },
    { code: '6001', name: '主营业务成本', type: AccountType.EXPENSE, balance: 0 },
    { code: '6002', name: '管理费用', type: AccountType.EXPENSE, balance: 0 },
  ]
  const createdAccounts = []
  for (const acc of accounts) {
    const account = await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        isSystem: acc.code.startsWith('1') || acc.code.startsWith('2') || acc.code.startsWith('3'),
      }
    })
    createdAccounts.push(account)
  }
  console.log('✅ 创建财务账户:', createdAccounts.length, '个')

  // 11. 创建交易记录 (35个)
  for (let i = 0; i < 35; i++) {
    const account = createdAccounts[i % createdAccounts.length]
    const isDebit = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE
    
    await prisma.transaction.create({
      data: {
        voucherNo: `VOU-${Date.now().toString(36).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
        date: randomDate(new Date('2025-01-01'), new Date()),
        type: [TransactionType.SALES_REVENUE, TransactionType.PURCHASE_EXPENSE, TransactionType.OTHER_INCOME, TransactionType.OTHER_EXPENSE][i % 4],
        accountId: account.id,
        amount: Math.floor(Math.random() * 50000) + 1000,
        direction: isDebit ? TransactionDirection.DEBIT : TransactionDirection.CREDIT,
        description: `交易记录${i + 1} - ${account.name}`,
        referenceType: ['order', 'purchase', null, null][i % 4],
        referenceId: i % 4 < 2 ? (orders[i % orders.length]?.id || null) : null,
      }
    })
  }
  console.log('✅ 创建交易记录: 35个')

  // 12. 创建通知 (20个)
  const notificationTypes = ['SYSTEM', 'ORDER', 'PURCHASE', 'INVENTORY', 'FINANCE']
  const notificationTitles = [
    '系统维护通知', '新订单提醒', '订单状态更新', '采购单待审批', '库存预警',
    '财务审批提醒', '客户信息更新', '供应商变更', '产品上架通知', '月度报表生成'
  ]
  for (let i = 0; i < 20; i++) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: notificationTypes[i % notificationTypes.length] as any,
        title: notificationTitles[i % notificationTitles.length],
        content: `这是第${i + 1}条通知内容，包含重要的业务信息需要处理。`,
        link: ['/orders', '/purchases', '/inventory/products', '/finance/accounts'][i % 4],
        isRead: i < 5,
        readAt: i < 5 ? new Date() : null,
      }
    })
  }
  console.log('✅ 创建通知: 20个')

  console.log('🎉 数据库种子数据创建完成！')
  console.log('')
  console.log('📊 数据统计:')
  console.log('   - 用户:', users.length + 1, '个')
  console.log('   - 仓库:', warehouses.length, '个')
  console.log('   - 分类:', categories.length, '个')
  console.log('   - 产品:', products.length, '个')
  console.log('   - 库存:', inventoryCount, '条')
  console.log('   - 客户:', customers.length, '个')
  console.log('   - 供应商:', suppliers.length, '个')
  console.log('   - 销售订单:', orders.length, '个')
  console.log('   - 采购订单:', purchases.length, '个')
  console.log('   - 财务账户:', createdAccounts.length, '个')
  console.log('   - 交易记录: 35个')
  console.log('   - 通知: 20个')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
