'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  RefreshCw,
  Clock,
  HardDrive,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Backup {
  id: string
  name: string
  type: string
  size: number
  tables: number
  createdAt: string
}

export default function BackupPage() {
  const { data: session } = useSession()
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup')
      const data = await res.json()
      setBackups(data.data || [])
    } catch (error) {
      console.error('获取备份列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const createBackup = async (type: 'full' | 'incremental') => {
    setCreating(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      setResult(data)
      fetchBackups()
    } catch (error) {
      console.error('创建备份失败:', error)
      setResult({ error: '创建备份失败' })
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = (backup: Backup) => {
    // 从服务器下载备份文件
    alert(`下载备份: ${backup.name}`)
  }

  const deleteBackup = async (backup: Backup) => {
    if (!confirm(`确定要删除备份 "${backup.name}" 吗？`)) return
    
    try {
      const res = await fetch(`/api/backup?id=${backup.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchBackups()
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除备份失败:', error)
      alert('删除失败')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">请先登录</div>
      </div>
    )
  }

  // 权限检查
  if (session.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <div className="text-gray-500">权限不足</div>
          <div className="text-sm text-gray-400 mt-2">只有管理员可以访问备份管理</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据备份</h1>
        <p className="text-gray-500">数据库备份和恢复管理</p>
      </div>

      {/* Warning */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">注意事项</h3>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• 备份文件包含所有业务数据，请妥善保管</li>
                <li>• 恢复备份会覆盖现有数据，操作前请确认</li>
                <li>• 建议定期进行完整备份，重要操作前进行增量备份</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              创建备份
            </CardTitle>
            <CardDescription>
              导出当前数据库数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => createBackup('full')}
                disabled={creating}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                完整备份
              </Button>
              <Button
                variant="outline"
                onClick={() => createBackup('incremental')}
                disabled={creating}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                增量备份
              </Button>
            </div>
            
            {creating && (
              <div className="text-center py-4 text-gray-500">
                正在创建备份...
              </div>
            )}

            {result && (
              <div className={result.error ? 'p-4 bg-red-50 rounded-lg' : 'p-4 bg-green-50 rounded-lg'}>
                {result.error ? (
                  <p className="text-red-600">{result.error}</p>
                ) : (
                  <div>
                    <p className="text-green-600 font-medium">备份创建成功</p>
                    <p className="text-sm text-gray-600 mt-1">
                      备份大小: {formatSize(result.size)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              备份统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{backups.length}</div>
                <div className="text-sm text-gray-500">备份数量</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
                </div>
                <div className="text-sm text-gray-500">总大小</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            备份历史
          </CardTitle>
          <CardDescription>
            共 {backups.length} 个备份
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无备份</p>
              <p className="text-sm mt-1">点击上方按钮创建第一个备份</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup: any) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{backup.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                      <span>{formatDate(backup.createdAt)}</span>
                      <span>{formatSize(backup.size)}</span>
                      <span>{backup.tables} 个表</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {backup.type === 'full' ? '完整' : '增量'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadBackup(backup)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteBackup(backup)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
