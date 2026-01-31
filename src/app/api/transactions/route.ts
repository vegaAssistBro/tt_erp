import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/transactions - 获取交易记录
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const type = searchParams.get('type')

    const where: any = {}

    if (type) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取交易记录失败:', error)
    return NextResponse.json({ error: '获取交易记录失败' }, { status: 500 })
  }
}

// POST /api/transactions - 创建交易
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { date, type, accountId, amount, direction, description, referenceType, referenceId } = body

    if (!date || !type || !accountId || !amount || !direction || !description) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 生成凭证号
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.transaction.count({
      where: {
        voucherNo: { startsWith: `V${dateStr}` },
      },
    })
    const voucherNo = `V${dateStr}${String(count + 1).padStart(4, '0')}`

    const transaction = await prisma.transaction.create({
      data: {
        voucherNo,
        date: new Date(date),
        type,
        accountId,
        amount: parseFloat(amount),
        direction,
        description,
        referenceType,
        referenceId,
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('创建交易失败:', error)
    return NextResponse.json({ error: '创建交易失败' }, { status: 500 })
  }
}
