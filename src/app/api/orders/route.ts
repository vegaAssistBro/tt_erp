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
      status,
      deliveryDate,
      deliveryAddress,
      note,
    } = body

    // 验证必填字段
    if (!customerId) {
      return NextResponse.json({ error: '请选择客户' }, { status: 400 })
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
    let taxAmount = 0
    let finalAmount = 0

    // 如果有订单明细，计算金额
    let order
    if (items && items.length > 0) {
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
      taxAmount = totalAmount * 0.13 // 暂定税率13%
      finalAmount = totalAmount + taxAmount

      order = await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          status: status || 'DRAFT',
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
    } else {
      // 没有明细时创建空订单
      order = await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          status: status || 'DRAFT',
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          deliveryAddress,
          note,
          salesPersonId: session.user?.id,
          totalAmount,
          taxAmount,
          finalAmount,
        },
        include: {
          customer: true,
        },
      })
    }

    return NextResponse.json(order, { status: 201 })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('创建销售订单失败:', error)
    return NextResponse.json({ error: '创建销售订单失败' }, { status: 500 })
  }
}

// PUT /api/orders - 更新销售订单
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      status,
      deliveryDate,
      deliveryAddress,
      note,
    } = body

    if (!id) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 })
    }

    // 检查订单是否存在
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 只有草稿和已确认状态的订单可以修改
    if (!['DRAFT', 'CONFIRMED'].includes(existingOrder.status)) {
      return NextResponse.json({ error: '当前状态不可修改' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryAddress,
        note,
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

    return NextResponse.json(order)
  } catch (error) {
    console.error('更新销售订单失败:', error)
    return NextResponse.json({ error: '更新销售订单失败' }, { status: 500 })
  }
}

// DELETE /api/orders - 删除销售订单
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 })
    }

    // 检查订单是否存在
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 只有草稿状态的订单可以删除
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json({ error: '只有草稿状态的订单可以删除' }, { status: 400 })
    }

    await prisma.order.delete({
      where: { id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除销售订单失败:', error)
    return NextResponse.json({ error: '删除销售订单失败' }, { status: 500 })
  }
}
