import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/purchases - 获取采购订单列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    const where: any = {}

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          purchaser: {
            select: { name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count({ where }),
    ])

    return NextResponse.json({
      data: purchases,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取采购订单列表失败:', error)
    return NextResponse.json({ error: '获取采购订单列表失败' }, { status: 500 })
  }
}

// POST /api/purchases - 创建采购订单
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      supplierId,
      items,
      expectedDate,
      warehouseId,
      note,
    } = body

    // 验证必填字段
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 生成采购单号
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.purchase.count({
      where: {
        purchaseNumber: { startsWith: `PO${dateStr}` },
      },
    })
    const purchaseNumber = `PO${dateStr}${String(count + 1).padStart(4, '0')}`

    // 计算总金额
    let totalAmount = 0
    const purchaseItems = items.map((item: any) => {
      const amount = item.quantity * item.unitPrice
      totalAmount += amount
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        amount,
      }
    })

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber,
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        warehouseId,
        note,
        purchaserId: session.user?.id,
        totalAmount,
        finalAmount: totalAmount,
        items: {
          create: purchaseItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('创建采购订单失败:', error)
    return NextResponse.json({ error: '创建采购订单失败' }, { status: 500 })
  }
}
