import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/reports/sales - 销售报表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      status: { not: 'CANCELLED' },
    }

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (type === 'summary') {
      // 销售汇总
      const stats = await prisma.order.groupBy({
        by: ['status'],
        _sum: {
          totalAmount: true,
          finalAmount: true,
        },
        _count: true,
        where,
      })

      const totalOrders = await prisma.order.count({ where })
      const totalRevenue = await prisma.order.aggregate({
        _sum: { finalAmount: true },
        where,
      })

      return NextResponse.json({
        type: 'summary',
        period: { startDate, endDate },
        summary: {
          totalOrders,
          totalRevenue: totalRevenue._sum.finalAmount || 0,
          byStatus: stats,
        },
      })
    }

    if (type === 'daily') {
      // 每日销售趋势
      const dailyData = await prisma.$queryRaw`
        SELECT 
          DATE(orderDate) as date,
          COUNT(*) as orderCount,
          SUM(finalAmount) as revenue
        FROM orders
        WHERE orderDate BETWEEN ${new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000)} 
          AND ${new Date(endDate || Date.now())}
          AND status != 'CANCELLED'
        GROUP BY DATE(orderDate)
        ORDER BY date
      ` as any[]

      return NextResponse.json({
        type: 'daily',
        data: dailyData,
      })
    }

    if (type === 'topProducts') {
      // 热销产品
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
          amount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 10,
      })

      const products = await prisma.product.findMany({
        where: {
          id: { in: topProducts.map(p => p.productId) },
        },
        select: { id: true, name: true, sku: true },
      })

      const productMap = new Map(products.map(p => [p.id, p]))

      return NextResponse.json({
        type: 'topProducts',
        data: topProducts.map(p => ({
          ...p,
          product: productMap.get(p.productId),
        })),
      })
    }

    return NextResponse.json({ error: '不支持的报表类型' }, { status: 400 })
  } catch (error: any) {
    console.error('生成报表失败:', error)
    return NextResponse.json({ error: '生成报表失败' }, { status: 500 })
  }
}
