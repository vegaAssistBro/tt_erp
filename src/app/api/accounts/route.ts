import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/accounts - 获取账户列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where: { parentId: null }, // 只获取顶级账户
      include: {
        children: true,
      },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ data: accounts })
  } catch (error) {
    console.error('获取账户列表失败:', error)
    return NextResponse.json({ error: '获取账户列表失败' }, { status: 500 })
  }
}

// POST /api/accounts - 创建账户
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, type, parentId } = body

    if (!code || !name || !type) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const existingAccount = await prisma.account.findUnique({
      where: { code },
    })

    if (existingAccount) {
      return NextResponse.json({ error: '账户编码已存在' }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: {
        code,
        name,
        type,
        parentId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('创建账户失败:', error)
    return NextResponse.json({ error: '创建账户失败' }, { status: 500 })
  }
}
