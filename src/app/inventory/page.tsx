'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, ArrowUpDown, Package } from 'lucide-react'
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

interface Inventory {
  id: string
  quantity: number
  reservedQty: number
  reorderPoint: number
  safetyStock: number
  location: string | null
  product: {
    id: string
    sku: string
    name: string
    unit: string
    category: {
      name: string
    } | null
  }
  warehouse: {
    id: string
    name: string
  }
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedWarehouse, setSelectedWarehouse] = useState('')

  const fetchData = async () => {
    try {
      // 获取仓库列表
      const warehouseRes = await fetch('/api/warehouses')
      const warehouseData = await warehouseRes.json()
      setWarehouses(warehouseData.data || [])

      // 获取库存列表
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })
      if (search) params.append('search', search)
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse)

      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setInventory(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('获取库存数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, selectedWarehouse])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const getStockStatus = (qty: number, safetyStock: number) => {
    if (qty === 0) return { label: '无库存', color: 'bg-red-100 text-red-800' }
    if (qty <= safetyStock) return { label: '库存不足', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '正常', color: 'bg-green-100 text-green-800' }
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
          <h1 className="text-3xl font-bold text-gray-900">库存管理</h1>
          <p className="text-gray-500">查看和管理库存数量</p>
        </div>
        <Button>
          <ArrowUpDown className="h-4 w-4 mr-2" />
          库存调整
        </Button>
      </div>

      {/* Warehouse Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value)
                setPage(1)
              }}
            >
              <option value="">所有仓库</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>库存列表</CardTitle>
          <CardDescription>
            共 {total} 条库存记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索产品名称、编号..."
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
                  <TableHead>产品编号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead className="text-center">库位</TableHead>
                  <TableHead className="text-right">可用库存</TableHead>
                  <TableHead className="text-right">预留</TableHead>
                  <TableHead className="text-center">安全库存</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => {
                    const status = getStockStatus(item.quantity, item.safetyStock)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            {item.product.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.product.category?.name || '-'}</TableCell>
                        <TableCell>{item.warehouse.name}</TableCell>
                        <TableCell className="text-center">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity} {item.product.unit}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {item.reservedQty}
                        </TableCell>
                        <TableCell className="text-center">{item.safetyStock}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
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
