import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/reports/inventory - 库存报表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'status'

    if (type === 'status') {
      // 库存状态
      const inventory = await prisma.inventory.findMany({
        include: {
          product: {
            include: { category: true },
          },
          warehouse: true,
        },
        orderBy: { quantity: 'asc' },
      })

      const stats = {
        total: inventory.length,
        zero: inventory.filter(i => i.quantity === 0).length,
        low: inventory.filter(i => i.quantity > 0 && i.quantity <= i.safetyStock).length,
        normal: inventory.filter(i => i.quantity > i.safetyStock).length,
        totalValue: inventory.reduce((sum, i) => {
          return sum + (i.quantity * parseFloat(i.product.costPrice.toString()))
        }, 0),
      }

      return NextResponse.json({
        type: 'status',
        summary: stats,
        details: inventory,
      })
    }

    if (type === 'movements') {
      // 库存变动记录
      const movements = await prisma.inventoryMovement.findMany({
        include: {
          warehouse: true,
          inventory: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return NextResponse.json({
        type: 'movements',
        data: movements,
      })
    }

    return NextResponse.json({ error: '不支持的报表类型' }, { status: 400 })
  } catch (error: any) {
    console.error('生成库存报表失败:', error)
    return NextResponse.json({ error: '生成库存报表失败' }, { status: 500 })
  }
}
