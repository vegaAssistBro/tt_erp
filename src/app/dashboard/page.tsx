'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  lowStockProducts: number
  pendingOrders: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      // 并行获取各类统计数据
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        fetch('/api/products?pageSize=1'),
        fetch('/api/customers?pageSize=1'),
        fetch('/api/orders?pageSize=1'),
      ])
      
      const productsData = await productsRes.json()
      const customersData = await customersRes.json()
      const ordersData = await ordersRes.json()

      setStats({
        totalProducts: productsData.total || 0,
        totalCustomers: customersData.total || 0,
        totalOrders: ordersData.total || 0,
        totalRevenue: 0, // 需要聚合计算
        lowStockProducts: 0, // 需要单独查询
        pendingOrders: 0, // 需要过滤状态
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">请先登录</div>
      </div>
    )
  }

  const statCards = [
    {
      title: '总营收',
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: '订单总数',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: '产品数量',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: '客户数量',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-orange-600',
    },
    {
      title: '待处理订单',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'text-yellow-600',
    },
    {
      title: '库存预警',
      value: stats.lowStockProducts,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500">业务数据概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat: any) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a href="/orders" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <ShoppingCart className="h-6 w-6 mb-2 text-blue-600" />
                <div className="font-medium">新建订单</div>
              </a>
              <a href="/purchases" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <Package className="h-6 w-6 mb-2 text-green-600" />
                <div className="font-medium">新建采购</div>
              </a>
              <a href="/products" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <Package className="h-6 w-6 mb-2 text-purple-600" />
                <div className="font-medium">添加产品</div>
              </a>
              <a href="/customers" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <Users className="h-6 w-6 mb-2 text-orange-600" />
                <div className="font-medium">添加客户</div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">系统运行正常</span>
                <span className="text-gray-400 ml-auto">刚刚</span>
              </div>
              <div className="text-sm text-gray-500 text-center py-8">
                暂无活动记录
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
