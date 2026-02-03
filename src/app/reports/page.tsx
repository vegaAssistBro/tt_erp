'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  FileText, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function ReportsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('sales')
  const [salesData, setSalesData] = useState<any>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadSalesReport = async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/sales?type=${type}`)
      const data = await res.json()
      setSalesData(data)
    } catch (error) {
      console.error('加载销售报表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryReport = async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/inventory?type=${type}`)
      const data = await res.json()
      setInventoryData(data)
    } catch (error) {
      console.error('加载库存报表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'sales') loadSalesReport('summary')
    else loadInventoryReport('status')
  }, [activeTab])

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">请先登录</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">报表中心</h1>
        <p className="text-gray-500">业务数据分析和报表</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'sales' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600'
          }`}
          onClick={() => setActiveTab('sales')}
        >
          销售报表
        </button>
        <button
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'inventory' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          库存报表
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总销售额</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{salesData?.summary?.totalRevenue?.toLocaleString() || '0'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">订单总数</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData?.summary?.totalOrders || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完成订单</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData?.summary?.byStatus?.find((s: any) => s.status === 'COMPLETED')?._count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">取消订单</CardTitle>
                <Package className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData?.summary?.byStatus?.find((s: any) => s.status === 'CANCELLED')?._count || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>订单状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              {salesData?.summary?.byStatus && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData.summary.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">库存总数</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryData?.summary?.total || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">库存预警</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {inventoryData?.summary?.low || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">无库存</CardTitle>
                <Package className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {inventoryData?.summary?.zero || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">库存总值</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{inventoryData?.summary?.totalValue?.toLocaleString() || '0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>库存状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryData?.summary && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '正常', value: inventoryData.summary.normal },
                        { name: '库存不足', value: inventoryData.summary.low },
                        { name: '无库存', value: inventoryData.summary.zero },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[COLORS[0], COLORS[1], COLORS[2]].map((color: any, index: any) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
