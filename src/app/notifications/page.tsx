'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  FileText,
  ShoppingCart,
  Package,
  CreditCard,
  AlertCircle,
  AtSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SYSTEM: Bell,
  ORDER: ShoppingCart,
  PURCHASE: Package,
  INVENTORY: AlertCircle,
  FINANCE: CreditCard,
  MENTION: AtSign,
}

const typeColors: Record<string, string> = {
  SYSTEM: 'bg-gray-100 text-gray-600',
  ORDER: 'bg-blue-100 text-blue-600',
  PURCHASE: 'bg-green-100 text-green-600',
  INVENTORY: 'bg-yellow-100 text-yellow-600',
  FINANCE: 'bg-purple-100 text-purple-600',
  MENTION: 'bg-pink-100 text-pink-600',
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      
      if (data.data) {
        setNotifications(data.data)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('获取通知失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('标记全部已读失败:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString('zh-CN')
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">请先登录</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">消息通知</h1>
          <p className="text-gray-500">系统消息和业务提醒</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            全部已读
          </Button>
        )}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700">
              <Bell className="h-5 w-5" />
              <span>你有 <strong>{unreadCount}</strong> 条未读通知</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>
            共 {notifications.length} 条通知
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification: any) => {
                const Icon = typeIcons[notification.type] || Bell
                const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600'
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg transition-colors',
                      notification.isRead ? 'bg-white' : 'bg-blue-50'
                    )}
                  >
                    <div className={cn('p-2 rounded-full', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.link && (
                          <a 
                            href={notification.link}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            查看详情
                          </a>
                        )}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead([notification.id])}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
