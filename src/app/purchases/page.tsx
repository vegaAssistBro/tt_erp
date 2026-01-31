'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Purchase {
  id: string
  purchaseNumber: string
  status: string
  totalAmount: string
  taxAmount: string
  finalAmount: string
  orderDate: string
  expectedDate: string | null
  supplier: {
    name: string
  }
  purchaser: {
    name: string
  } | null
  createdAt: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: '已提交', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: '已确认', color: 'bg-indigo-100 text-indigo-800' },
  SHIPPED: { label: '已发货', color: 'bg-yellow-100 text-yellow-800' },
  PARTIAL: { label: '部分到货', color: 'bg-orange-100 text-orange-800' },
  RECEIVED: { label: '已到货', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-800' },
}

export default function PurchasesPage() {
  const { data: session } = useSession()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPurchases = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/purchases?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setPurchases(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('获取采购订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPurchases()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
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
          <h1 className="text-3xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500">管理采购订单和供应商交货</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建采购单
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>采购订单列表</CardTitle>
          <CardDescription>
            共 {total} 个采购订单
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索采购单号、供应商..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">搜索</Button>
          </form>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>采购单号</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">采购金额</TableHead>
                  <TableHead>下单日期</TableHead>
                  <TableHead>期望日期</TableHead>
                  <TableHead>采购员</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => {
                    const status = statusMap[purchase.status] || { label: purchase.status, color: 'bg-gray-100' }
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                        <TableCell>{purchase.supplier.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ¥{parseFloat(purchase.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>{formatDate(purchase.orderDate)}</TableCell>
                        <TableCell>{purchase.expectedDate ? formatDate(purchase.expectedDate) : '-'}</TableCell>
                        <TableCell>{purchase.purchaser?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                第 {page} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
