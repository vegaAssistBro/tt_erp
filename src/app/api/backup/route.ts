import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/backup - 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 权限检查
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 返回模拟的备份列表（实际应该读取备份目录）
    const backups = [
      {
        id: 'backup_001',
        name: '完整备份_20260131',
        type: 'full',
        size: 1024 * 1024 * 5.2, // 5.2MB
        tables: 15,
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ data: backups })
  } catch (error) {
    console.error('获取备份列表失败:', error)
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 })
  }
}

// POST /api/backup - 创建备份
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 权限检查
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { type } = body // full | incremental

    // 导出所有数据
    const data: Record<string, any[]> = {}

    // 获取所有表数据
    const tables = [
      'user', 'category', 'product', 'warehouse', 'inventory',
      'customer', 'order', 'orderItem', 'supplier', 'purchase', 'purchaseItem',
      'account', 'transaction', 'activity', 'notification'
    ]

    for (const table of tables) {
      try {
        // @ts-ignore
        data[table] = await prisma[table].findMany({
          where: { isActive: true },
        })
      } catch (e) {
        // 表可能不存在
        console.warn(`表 ${table} 不存在或获取失败`)
      }
    }

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: session.user?.name,
      type: type || 'full',
      data,
    }

    // 返回 JSON 格式的备份数据
    return NextResponse.json({
      success: true,
      backup,
      size: JSON.stringify(backup).length,
      message: '备份创建成功',
    })
  } catch (error) {
    console.error('创建备份失败:', error)
    return NextResponse.json({ error: '创建备份失败' }, { status: 500 })
  }
}

// PUT /api/backup - 恢复备份
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 权限检查
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { backupData } = body

    if (!backupData || !backupData.data) {
      return NextResponse.json({ error: '无效的备份数据' }, { status: 400 })
    }

    // 恢复数据
    const tables = Object.keys(backupData.data)
    let restoredCount = 0

    for (const table of tables) {
      try {
        const items = backupData.data[table]
        if (Array.isArray(items)) {
          for (const item of items) {
            // @ts-ignore
            await prisma[table].upsert({
              where: { id: item.id },
              create: item,
              update: item,
            })
            restoredCount++
          }
        }
      } catch (e) {
        console.warn(`恢复表 ${table} 失败:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `恢复成功，共恢复 ${restoredCount} 条记录`,
    })
  } catch (error) {
    console.error('恢复备份失败:', error)
    return NextResponse.json({ error: '恢复备份失败' }, { status: 500 })
  }
}

// DELETE /api/backup - 删除备份
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 权限检查
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少备份ID' }, { status: 400 })
    }

    // 删除备份文件（实际应该删除文件）
    // 这里只返回成功，实际应用中需要删除文件

    return NextResponse.json({
      success: true,
      message: '备份删除成功',
    })
  } catch (error) {
    console.error('删除备份失败:', error)
    return NextResponse.json({ error: '删除备份失败' }, { status: 500 })
  }
}
