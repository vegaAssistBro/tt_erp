import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/inventory - 获取库存列表
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
    const warehouseId = searchParams.get('warehouseId')

    const where: any = {}

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
        ],
      }
    }

    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
          warehouse: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ])

    return NextResponse.json({
      data: inventory,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取库存列表失败:', error)
    return NextResponse.json({ error: '获取库存列表失败' }, { status: 500 })
  }
}

// POST /api/inventory - 调整库存
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, warehouseId, type, quantity, note } = body

    if (!productId || !warehouseId || !type || !quantity) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 查找或创建库存记录
    let inventory = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
    })

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          productId,
          warehouseId,
          quantity: 0,
        },
      })
    }

    // 计算新数量
    let newQuantity = inventory.quantity
    if (['PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'ADJUSTMENT_IN'].includes(type)) {
      newQuantity += Math.abs(quantity)
    } else if (['SALE_OUT', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'].includes(type)) {
      newQuantity -= Math.abs(quantity)
    }

    // 更新库存
    const updatedInventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity },
    })

    // 记录库存变动
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        warehouseId,
        type: type,
        quantity: ['PURCHASE_IN', 'RETURN_IN', 'TRANSFER_IN', 'ADJUSTMENT_IN'].includes(type) 
          ? Math.abs(quantity) 
          : -Math.abs(quantity),
        operatorId: session.user?.id || '',
        note,
      },
    })

    return NextResponse.json(updatedInventory)
  } catch (error) {
    console.error('调整库存失败:', error)
    return NextResponse.json({ error: '调整库存失败' }, { status: 500 })
  }
}
