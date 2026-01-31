import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/suppliers - 获取供应商列表
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

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({
      data: suppliers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    return NextResponse.json({ error: '获取供应商列表失败' }, { status: 500 })
  }
}

// POST /api/suppliers - 创建供应商
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      code,
      name,
      contactPerson,
      email,
      phone,
      address,
      taxNumber,
      bankAccount,
      leadTime,
      minOrderQty,
    } = body

    // 验证必填字段
    if (!code || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查供应商编码是否已存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code },
    })

    if (existingSupplier) {
      return NextResponse.json({ error: '供应商编码已存在' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        contactPerson,
        email,
        phone,
        address,
        taxNumber,
        bankAccount,
        leadTime: leadTime || 7,
        minOrderQty: minOrderQty || 1,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('创建供应商失败:', error)
    return NextResponse.json({ error: '创建供应商失败' }, { status: 500 })
  }
}
