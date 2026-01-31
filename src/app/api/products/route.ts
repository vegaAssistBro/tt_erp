import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/products - 获取产品列表
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
    const categoryId = searchParams.get('categoryId')

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取产品列表失败:', error)
    return NextResponse.json({ error: '获取产品列表失败' }, { status: 500 })
  }
}

// POST /api/products - 创建产品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sku,
      barcode,
      name,
      description,
      categoryId,
      unit,
      costPrice,
      sellPrice,
      minPrice,
      weight,
      images,
      isFeatured,
    } = body

    // 验证必填字段
    if (!sku || !name || !categoryId || !costPrice || !sellPrice) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查 SKU 是否已存在
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    })

    if (existingProduct) {
      return NextResponse.json({ error: '产品编号已存在' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        sku,
        barcode,
        name,
        description,
        categoryId,
        unit: unit || '个',
        costPrice: parseFloat(costPrice),
        sellPrice: parseFloat(sellPrice),
        minPrice: minPrice ? parseFloat(minPrice) : null,
        weight: weight ? parseFloat(weight) : null,
        images: images || [],
        isFeatured: isFeatured || false,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('创建产品失败:', error)
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 })
  }
}
