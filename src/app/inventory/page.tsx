'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, ArrowUpDown, Package, Edit, Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Inventory {
  id: string
  quantity: number
  reservedQty: number
  reorderPoint: number
  safetyStock: number
  location: string | null
  product: { id: string; sku: string; name: string; unit: string; category: { name: string } | null }
  warehouse: { id: string; name: string }
}

const movementTypes = [
  { value: 'PURCHASE_IN', label: '采购入库' },
  { value: 'SALE_OUT', label: '销售出库' },
  { value: 'RETURN_IN', label: '退货入库' },
  { value: 'ADJUSTMENT_IN', label: '盘盈入库' },
  { value: 'ADJUSTMENT_OUT', label: '盘亏出库' },
]

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

  // 弹窗状态
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Inventory | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 表单数据
  const [adjustForm, setAdjustForm] = useState({ productId: '', warehouseId: '', type: 'PURCHASE_IN', quantity: 0, note: '' })
  const [editForm, setEditForm] = useState({ reorderPoint: 10, safetyStock: 5, location: '' })

  const fetchData = async () => {
    try {
      const warehouseRes = await fetch('/api/warehouses')
      const warehouseData = await warehouseRes.json()
      setWarehouses(warehouseData.data || [])

      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' })
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
      showToast('error', '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, selectedWarehouse])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdjust = async () => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '库存调整成功')
      setAdjustDialogOpen(false)
      fetchData()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '调整失败')
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem.id, ...editForm }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '更新成功')
      setEditDialogOpen(false)
      fetchData()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新失败')
    }
  }

  const getStockStatus = (qty: number, safetyStock: number) => {
    if (qty === 0) return { label: '无库存', color: 'bg-red-100 text-red-800' }
    if (qty <= safetyStock) return { label: '库存不足', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '正常', color: 'bg-green-100 text-green-800' }
  }

  if (!session) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">请先登录</div></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">库存管理</h1><p className="text-gray-500">查看和管理库存数量</p></div>
        <Button onClick={() => { setAdjustForm({ productId: '', warehouseId: selectedWarehouse || '', type: 'PURCHASE_IN', quantity: 0, note: '' }); setAdjustDialogOpen(true) }}><ArrowUpDown className="h-4 w-4 mr-2" />库存调整</Button>
      </div>

      <Card><CardContent className="pt-6">
        <select className="px-3 py-2 border rounded-md" value={selectedWarehouse} onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1) }}>
          <option value="">所有仓库</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>库存列表</CardTitle><CardDescription>共 {total} 条记录</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索产品名称、编号..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button type="submit">搜索</Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品编号</TableHead><TableHead>产品名称</TableHead><TableHead>分类</TableHead>
                  <TableHead>仓库</TableHead><TableHead className="text-center">库位</TableHead>
                  <TableHead className="text-right">可用库存</TableHead><TableHead className="text-right">预留</TableHead>
                  <TableHead className="text-center">安全库存</TableHead><TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={10} className="text-center py-8">加载中...</TableCell></TableRow> :
                 inventory.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center py-8">暂无数据</TableCell></TableRow> :
                 inventory.map((item: any) => {
                   const status = getStockStatus(item.quantity, item.safetyStock)
                   return (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium">{item.product.sku}</TableCell>
                       <TableCell><div className="flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />{item.product.name}</div></TableCell>
                       <TableCell>{item.product.category?.name || '-'}</TableCell>
                       <TableCell>{item.warehouse.name}</TableCell>
                       <TableCell className="text-center">{item.location || '-'}</TableCell>
                       <TableCell className="text-right font-medium">{item.quantity} {item.product.unit}</TableCell>
                       <TableCell className="text-right text-gray-500">{item.reservedQty}</TableCell>
                       <TableCell className="text-center">{item.safetyStock}</TableCell>
                       <TableCell className="text-center"><span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span></TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setEditForm({ reorderPoint: item.reorderPoint, safetyStock: item.safetyStock, location: item.location || '' }); setEditDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                       </TableCell>
                     </TableRow>
                   )
                 })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && <div className="flex items-center justify-between mt-4"><div className="text-sm text-gray-500">第 {page} 页，共 {totalPages} 页</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>上一页</Button><Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>下一页</Button></div></div>}
        </CardContent>
      </Card>

      {/* 库存调整弹窗 */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>库存调整</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">仓库</label><select value={adjustForm.warehouseId} onChange={e => setAdjustForm({...adjustForm, warehouseId: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="">请选择仓库</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">调整类型</label><select value={adjustForm.type} onChange={e => setAdjustForm({...adjustForm, type: e.target.value})} className="w-full px-3 py-2 border rounded-md">{movementTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">数量</label><Input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium mb-1">备注</label><textarea value={adjustForm.note} onChange={e => setAdjustForm({...adjustForm, note: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button><Button onClick={handleAdjust}>确认调整</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>编辑库存信息</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">库位</label><Input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">补货点</label><Input type="number" value={editForm.reorderPoint} onChange={e => setEditForm({...editForm, reorderPoint: parseInt(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium mb-1">安全库存</label><Input type="number" value={editForm.safetyStock} onChange={e => setEditForm({...editForm, safetyStock: parseInt(e.target.value)})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button><Button onClick={handleEdit}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
