import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/import/products - 获取导入模板
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 返回 CSV 模板
    const template = `SKU,产品名称,分类,单位,成本价,销售价,条码,状态
P001,测试产品 A,电子,个,10.00,20.00,123456789,启用
P002,测试产品 B,电子,个,20.00,40.00,987654321,启用`

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="product_template.csv"',
      },
    })
  } catch (error: any) {
    console.error('获取模板失败:', error)
    return NextResponse.json({ error: '获取模板失败' }, { status: 500 })
  }
}

// POST /api/import/products - 批量导入产品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < products.length; i++) {
      const item = products[i]
      
      try {
        // 验证必填字段
        if (!item.sku || !item.name || !item.categoryName) {
          results.failed++
          results.errors.push(`第 ${i + 1} 行: 缺少必填字段`)
          continue
        }

        // 查找或创建分类
        let category = await prisma.category.findUnique({
          where: { slug: item.categoryName },
        })

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: item.categoryName,
              slug: item.categoryName,
            },
          })
        }

        // 检查产品是否已存在
        const existing = await prisma.product.findUnique({
          where: { sku: item.sku },
        })

        if (existing) {
          // 更新现有产品
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              description: item.description,
              categoryId: category.id,
              unit: item.unit || '个',
              costPrice: parseFloat(item.costPrice) || 0,
              sellPrice: parseFloat(item.sellPrice) || 0,
              barcode: item.barcode,
              isActive: item.isActive !== false,
            },
          })
        } else {
          // 创建新产品
          await prisma.product.create({
            data: {
              sku: item.sku,
              barcode: item.barcode,
              name: item.name,
              description: item.description,
              categoryId: category.id,
              unit: item.unit || '个',
              costPrice: parseFloat(item.costPrice) || 0,
              sellPrice: parseFloat(item.sellPrice) || 0,
              isActive: item.isActive !== false,
            },
          })
        }

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`第 ${i + 1} 行: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('批量导入失败:', error)
    return NextResponse.json({ error: '批量导入失败' }, { status: 500 })
  }
}
