'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
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

interface Purchase {
  id: string
  purchaseNumber: string
  status: string
  totalAmount: string
  finalAmount: string
  orderDate: string
  expectedDate: string | null
  supplier: { name: string }
  purchaser: { name: string } | null
}

interface PurchaseFormData {
  supplierId: string
  status: string
  expectedDate: string
  warehouseId: string
  note: string
}

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'RECEIVED', label: '已到货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: '已提交', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: '已确认', color: 'bg-indigo-100 text-indigo-800' },
  SHIPPED: { label: '已发货', color: 'bg-yellow-100 text-yellow-800' },
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

  // 弹窗和表单状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierId: '',
    status: 'DRAFT',
    expectedDate: '',
    warehouseId: '',
    note: '',
  })

  const fetchPurchases = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' })
      if (search) params.append('search', search)
      const res = await fetch(`/api/purchases?${params}`)
      const data = await res.json()
      if (data.data) {
        setPurchases(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      showToast('error', '获取采购列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
    // 获取供应商列表
    fetch('/api/suppliers?pageSize=100').then(res => res.json()).then(data => {
      if (data.data) setSuppliers(data.data)
    })
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, items: [] }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '创建成功')
      setAddDialogOpen(false)
      fetchPurchases()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!editingPurchase) return
    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPurchase.id, ...formData }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '更新成功')
      setEditDialogOpen(false)
      fetchPurchases()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新失败')
    }
  }

  const handleDelete = async () => {
    if (!deletingPurchase) return
    try {
      const res = await fetch(`/api/purchases?id=${deletingPurchase.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '删除成功')
      setDeleteConfirmOpen(false)
      fetchPurchases()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除失败')
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-CN')

  if (!session) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">请先登录</div></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">采购管理</h1><p className="text-gray-500">管理采购订单和供应商交货</p></div>
        <Button onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />新建采购单</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>采购订单列表</CardTitle><CardDescription>共 {total} 个采购订单</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchPurchases() }} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索采购单号、供应商..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button type="submit">搜索</Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>采购单号</TableHead><TableHead>供应商</TableHead><TableHead>状态</TableHead>
                  <TableHead className="text-right">金额</TableHead><TableHead>下单日期</TableHead>
                  <TableHead>期望日期</TableHead><TableHead>采购员</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">加载中...</TableCell></TableRow> :
                 purchases.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8">暂无数据</TableCell></TableRow> :
                 purchases.map((p: any) => {
                   const s = statusMap[p.status] || { label: p.status, color: 'bg-gray-100' }
                   return (
                     <TableRow key={p.id}>
                       <TableCell className="font-medium">{p.purchaseNumber}</TableCell>
                       <TableCell>{p.supplier.name}</TableCell>
                       <TableCell><span className={`px-2 py-1 rounded-full text-xs ${s.color}`}>{s.label}</span></TableCell>
                       <TableCell className="text-right">¥{parseFloat(p.finalAmount).toFixed(2)}</TableCell>
                       <TableCell>{formatDate(p.orderDate)}</TableCell>
                       <TableCell>{p.expectedDate ? formatDate(p.expectedDate) : '-'}</TableCell>
                       <TableCell>{p.purchaser?.name || '-'}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => { setEditingPurchase(p); setFormData({ supplierId: '', status: p.status, expectedDate: '', warehouseId: '', note: '' }); setEditDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => { setDeletingPurchase(p); setDeleteConfirmOpen(true) }} disabled={p.status !== 'DRAFT'}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                         </div>
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

      {/* 添加弹窗 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>新建采购单</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">供应商 <span className="text-red-500">*</span></label><select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="">请选择供应商</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">期望日期</label><Input type="date" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">备注</label><textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-md" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button><Button onClick={handleAdd}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>编辑采购单</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">状态</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-md">{statusOptions.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">期望日期</label><Input type="date" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">备注</label><textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-md" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button><Button onClick={handleEdit}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-gray-500 mb-6">确定要删除采购单 <strong>{deletingPurchase?.purchaseNumber}</strong> 吗？</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete}>删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
