import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/customers - 获取客户列表
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
    const type = searchParams.get('type')

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      data: customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取客户列表失败:', error)
    return NextResponse.json({ error: '获取客户列表失败' }, { status: 500 })
  }
}

// POST /api/customers - 创建客户
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
      type,
      email,
      phone,
      address,
      taxNumber,
      bankAccount,
      creditLimit,
      creditDays,
    } = body

    // 验证必填字段
    if (!code || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查客户编码是否已存在
    const existingCustomer = await prisma.customer.findUnique({
      where: { code },
    })

    if (existingCustomer) {
      return NextResponse.json({ error: '客户编码已存在' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        type: type || 'COMPANY',
        email,
        phone,
        address,
        taxNumber,
        bankAccount,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        creditDays: creditDays || 30,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('创建客户失败:', error)
    return NextResponse.json({ error: '创建客户失败' }, { status: 500 })
  }
}

// PUT /api/customers - 更新客户
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : undefined,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('更新客户失败:', error)
    return NextResponse.json({ error: '更新客户失败' }, { status: 500 })
  }
}

// DELETE /api/customers - 删除客户
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 })
    }

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除客户失败:', error)
    return NextResponse.json({ error: '删除客户失败' }, { status: 500 })
  }
}
