import { PrismaClient, UserRole, CustomerType, MovementType, OrderStatus, PurchaseStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

  // 2. 创建仓库
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: {
      code: 'WH-001',
      name: '主仓库',
      address: '上海市浦东新区张江高科技园区',
      contact: '仓库管理员',
      phone: '021-88888888',
      managerId: admin.id,
    }
  })
  console.log('✅ 创建仓库:', warehouse.name)

  // 3. 创建分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'dianziyuanjian' },
      update: {},
      create: {
        name: '电子元件',
        slug: 'dianziyuanjian',
        description: '各类电子元器件',
        sortOrder: 1,
      }
    }),
    prisma.category.upsert({
      where: { slug: 'bancai' },
      update: {},
      create: {
        name: 'PCB板材',
        slug: 'bancai',
        description: '印刷电路板材料',
        sortOrder: 2,
      }
    }),
    prisma.category.upsert({
      where: { slug: 'fuwaqi' },
      update: {},
      create: {
        name: '辅助物料',
        slug: 'fuwaqi',
        description: '生产辅助材料',
        sortOrder: 3,
      }
    }),
  ])
  console.log('✅ 创建分类:', categories.length, '个')

  // 4. 创建产品
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU-001' },
      update: {},
      create: {
        sku: 'SKU-001',
        name: '电阻 10KΩ 0805',
        description: '贴片电阻，精度1%，功率1/8W',
        categoryId: categories[0].id,
        unit: '个',
        costPrice: 0.01,
        sellPrice: 0.05,
        isActive: true,
      }
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-002' },
      update: {},
      create: {
        sku: 'SKU-002',
        name: '电容 10uF 25V',
        description: '贴片电容，MLCC材质',
        categoryId: categories[0].id,
        unit: '个',
        costPrice: 0.02,
        sellPrice: 0.08,
        isActive: true,
      }
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-003' },
      update: {},
      create: {
        sku: 'SKU-003',
        name: '双层PCB板 10x10cm',
        description: 'FR-4材质，铜厚1oz，沉金工艺',
        categoryId: categories[1].id,
        unit: '块',
        costPrice: 15.00,
        sellPrice: 25.00,
        isActive: true,
      }
    }),
  ])
  console.log('✅ 创建产品:', products.length, '个')

  // 5. 创建库存
  for (const product of products) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        }
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 1000,
        reservedQty: 0,
        reorderPoint: 100,
        safetyStock: 50,
        location: 'A-01-01',
      }
    })
  }
  console.log('✅ 创建库存记录:', products.length, '个')

  // 6. 创建客户
  const customer = await prisma.customer.upsert({
    where: { code: 'CUST-001' },
    update: {},
    create: {
      code: 'CUST-001',
      name: 'ABC电子科技有限公司',
      type: CustomerType.COMPANY,
      email: 'sales@abc.com',
      phone: '13912345678',
      address: '北京市海淀区中关村大街1号',
      taxNumber: '911101080000000000',
      creditLimit: 100000,
      creditDays: 30,
    }
  })
  console.log('✅ 创建客户:', customer.name)

  // 7. 创建供应商
  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-001' },
    update: {},
    create: {
      code: 'SUP-001',
      name: 'XYZ元器件供应商',
      contactPerson: '李经理',
      email: 'li@xyz.com',
      phone: '13887654321',
      address: '深圳市南山区科技园路88号',
      taxNumber: '914403000000000000',
      leadTime: 7,
      minOrderQty: 100,
    }
  })
  console.log('✅ 创建供应商:', supplier.name)

  // 8. 创建示例账户
  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { code: '1001' },
      update: {},
      create: {
        code: '1001',
        name: '库存现金',
        type: 'ASSET',
        balance: 50000,
      }
    }),
    prisma.account.upsert({
      where: { code: '1002' },
      update: {},
      create: {
        code: '1002',
        name: '银行存款',
        type: 'ASSET',
        balance: 500000,
      }
    }),
    prisma.account.upsert({
      where: { code: '6001' },
      update: {},
      create: {
        code: '6001',
        name: '主营业务成本',
        type: 'EXPENSE',
        balance: 0,
      }
    }),
    prisma.account.upsert({
      where: { code: '5001' },
      update: {},
      create: {
        code: '5001',
        name: '主营业务收入',
        type: 'REVENUE',
        balance: 0,
      }
    }),
  ])
  console.log('✅ 创建财务账户:', accounts.length, '个')

  console.log('🎉 数据库种子数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
