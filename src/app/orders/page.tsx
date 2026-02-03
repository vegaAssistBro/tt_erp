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
import { OrderForm } from '@/components/order-form'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  taxAmount: string
  finalAmount: string
  orderDate: string
  deliveryDate: string | null
  deliveryAddress: string | null
  customerId: string
  customer: {
    name: string
  }
  salesPerson: {
    name: string
  } | null
  note: string | null
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
  createdAt: string
}

interface OrderFormData {
  id?: string
  customerId: string
  status: string
  deliveryDate: string
  deliveryAddress: string
  note: string
  orderDate?: string
  finalAmount?: number
  items?: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
}

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  CONFIRMED: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  SHIPPED: { label: '已发货', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: '已送达', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-800' },
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<OrderFormData | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      if (data.data) {
        setOrders(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('获取销售订单失败:', error)
      showToast('error', '获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // 添加订单
  const handleAddOrder = async (data: OrderFormData) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '创建失败')
      }

      showToast('success', '创建订单成功')
      fetchOrders()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '创建订单失败')
      throw error
    }
  }

  // 编辑订单
  const handleEditOrder = async (data: OrderFormData) => {
    if (!editingOrder) return

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrder.id, ...data }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '更新失败')
      }

      showToast('success', '更新订单成功')
      fetchOrders()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新订单失败')
      throw error
    }
  }

  // 删除订单
  const handleDeleteOrder = async () => {
    if (!deletingOrder) return

    try {
      const res = await fetch(`/api/orders?id=${deletingOrder.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      showToast('success', '删除订单成功')
      setDeleteConfirmOpen(false)
      setDeletingOrder(null)
      fetchOrders()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除订单失败')
    }
  }

  const openEditDialog = (order: Order) => {
    // Convert Order to OrderFormData
    const formData: OrderFormData = {
      customerId: order.customerId,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate || undefined,
      finalAmount: order.finalAmount,
      note: order.note || '',
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }
    setEditingOrder(formData)
    setEditDialogOpen(true)
  }

  const openDeleteConfirm = (order: Order) => {
    setDeletingOrder(order)
    setDeleteConfirmOpen(true)
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
      {/* Toast 提示 - 使用更高的 z-index 确保显示在弹窗之上 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded-md text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">销售订单</h1>
          <p className="text-gray-500">管理客户订单和发货</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建订单
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <CardDescription>
            共 {total} 个订单
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索订单号、客户名称..."
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
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">订单金额</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead>交货日期</TableHead>
                  <TableHead>销售员</TableHead>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => {
                    const status = statusMap[order.status] || { label: order.status, color: 'bg-gray-100' }
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customer.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ¥{parseFloat(order.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</TableCell>
                        <TableCell>{order.salesPerson?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(order)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteConfirm(order)}
                              disabled={order.status !== 'DRAFT'}
                            >
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

      {/* 添加订单弹窗 */}
      <OrderForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddOrder}
        mode="add"
      />

      {/* 编辑订单弹窗 */}
      <OrderForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditOrder}
        initialData={editingOrder}
        mode="edit"
      />

      {/* 删除确认对话框 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-500 mb-6">
              确定要删除订单 <strong>{deletingOrder?.orderNumber}</strong> 吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteOrder}>
                删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
