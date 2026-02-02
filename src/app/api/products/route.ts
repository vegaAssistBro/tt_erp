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

// PUT /api/products - 更新产品
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }

    // 如果更新 SKU，检查是否被其他产品使用
    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: '产品编号已存在' }, { status: 400 })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        sellPrice: data.sellPrice ? parseFloat(data.sellPrice) : undefined,
        minPrice: data.minPrice ? parseFloat(data.minPrice) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
      },
      include: { category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('更新产品失败:', error)
    return NextResponse.json({ error: '更新产品失败' }, { status: 500 })
  }
}

// DELETE /api/products - 删除产品
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少产品ID' }, { status: 400 })
    }

    // 检查产品是否有库存
    const inventory = await prisma.inventory.findUnique({
      where: { productId: id },
    })
    if (inventory && inventory.quantity > 0) {
      return NextResponse.json({ error: '产品有库存，不能删除' }, { status: 400 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除产品失败:', error)
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 })
  }
}
