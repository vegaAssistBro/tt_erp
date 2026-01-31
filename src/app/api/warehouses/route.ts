import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/warehouses - 获取仓库列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ]
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        manager: {
          select: { name: true },
        },
        _count: {
          select: { inventories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: warehouses })
  } catch (error) {
    console.error('获取仓库列表失败:', error)
    return NextResponse.json({ error: '获取仓库列表失败' }, { status: 500 })
  }
}

// POST /api/warehouses - 创建仓库
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, address, contact, phone, managerId } = body

    if (!code || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code },
    })

    if (existingWarehouse) {
      return NextResponse.json({ error: '仓库编码已存在' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code,
        name,
        address,
        contact,
        phone,
        managerId,
      },
      include: {
        manager: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error('创建仓库失败:', error)
    return NextResponse.json({ error: '创建仓库失败' }, { status: 500 })
  }
}
