import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/activities - 获取活动日志
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')

    const where: any = {}

    if (entityType) {
      where.entityType = entityType
    }

    if (userId) {
      where.userId = userId
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: { name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      data: activities,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取活动日志失败:', error)
    return NextResponse.json({ error: '获取活动日志失败' }, { status: 500 })
  }
}

// 记录活动的辅助函数
export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
      },
    })
  } catch (error) {
    console.error('记录活动失败:', error)
  }
}
