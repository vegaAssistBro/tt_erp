import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/export/products - 导出产品
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'csv') {
      // 生成 CSV
      const headers = ['SKU', '产品名称', '分类', '单位', '成本价', '销售价', '条码', '状态', '创建时间']
      
      const rows = products.map((p: any) => [
        p.sku,
        p.name,
        p.category?.name || '',
        p.unit,
        p.costPrice.toString(),
        p.sellPrice.toString(),
        p.barcode || '',
        p.isActive ? '启用' : '禁用',
        p.createdAt.toISOString().slice(0, 10),
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="products_${Date.now()}.csv"`,
        },
      })
    }

    // 返回 JSON
    return NextResponse.json({
      data: products,
      exportedAt: new Date().toISOString(),
      total: products.length,
    })
  } catch (error: any) {
    console.error('导出失败:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
