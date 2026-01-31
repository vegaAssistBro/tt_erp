import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/orders - 获取销售订单列表
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
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          salesPerson: {
            select: { name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取销售订单列表失败:', error)
    return NextResponse.json({ error: '获取销售订单列表失败' }, { status: 500 })
  }
}

// POST /api/orders - 创建销售订单
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerId,
      items,
      deliveryDate,
      deliveryAddress,
      note,
    } = body

    // 验证必填字段
    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 生成订单号
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.order.count({
      where: {
        orderNumber: { startsWith: `SO${dateStr}` },
      },
    })
    const orderNumber = `SO${dateStr}${String(count + 1).padStart(4, '0')}`

    // 计算订单金额
    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const amount = item.quantity * item.unitPrice
      totalAmount += amount
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        amount,
      }
    })

    const taxAmount = totalAmount * 0.13 // 暂定税率13%
    const finalAmount = totalAmount + taxAmount

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryAddress,
        note,
        salesPersonId: session.user?.id,
        totalAmount,
        taxAmount,
        finalAmount,
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('创建销售订单失败:', error)
    return NextResponse.json({ error: '创建销售订单失败' }, { status: 500 })
  }
}
