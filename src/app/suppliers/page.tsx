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

interface Supplier {
  id: string
  code: string
  name: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  address: string | null
  taxNumber: string | null
  bankAccount: string | null
  leadTime: number
  minOrderQty: number
  isActive: boolean
  createdAt: string
}

interface SupplierFormData {
  code: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxNumber: string
  bankAccount: string
  leadTime: number
  minOrderQty: number
}

export default function SuppliersPage() {
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [formData, setFormData] = useState<SupplierFormData>({
    code: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    bankAccount: '',
    leadTime: 7,
    minOrderQty: 1,
  })

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' })
      if (search) params.append('search', search)
      const res = await fetch(`/api/suppliers?${params}`)
      const data = await res.json()
      if (data.data) {
        setSuppliers(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      showToast('error', '获取供应商列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [page])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '添加成功')
      setAddDialogOpen(false)
      fetchSuppliers()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '添加失败')
    }
  }

  const handleEdit = async () => {
    if (!editingSupplier) return
    try {
      const res = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSupplier.id, ...formData }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '更新成功')
      setEditDialogOpen(false)
      fetchSuppliers()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新失败')
    }
  }

  const handleDelete = async () => {
    if (!deletingSupplier) return
    try {
      const res = await fetch(`/api/suppliers?id=${deletingSupplier.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '删除成功')
      setDeleteConfirmOpen(false)
      fetchSuppliers()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除失败')
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      code: supplier.code,
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || '',
      bankAccount: supplier.bankAccount || '',
      leadTime: supplier.leadTime,
      minOrderQty: supplier.minOrderQty,
    })
    setEditDialogOpen(true)
  }

  if (!session) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">请先登录</div></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">供应商管理</h1><p className="text-gray-500">管理供应商信息和采购条款</p></div>
        <Button onClick={() => { setFormData({ code: '', name: '', contactPerson: '', email: '', phone: '', address: '', taxNumber: '', bankAccount: '', leadTime: 7, minOrderQty: 1 }); setAddDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />添加供应商</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>供应商列表</CardTitle><CardDescription>共 {total} 个供应商</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchSuppliers() }} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索供应商名称、编码、联系人..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button type="submit">搜索</Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>编码</TableHead><TableHead>名称</TableHead><TableHead>联系人</TableHead>
                  <TableHead>电话</TableHead><TableHead>邮箱</TableHead>
                  <TableHead className="text-center">交货周期</TableHead><TableHead className="text-center">起订量</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">加载中...</TableCell></TableRow> :
                 suppliers.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8">暂无数据</TableCell></TableRow> :
                 suppliers.map(s => (
                   <TableRow key={s.id}>
                     <TableCell className="font-medium">{s.code}</TableCell>
                     <TableCell>{s.name}</TableCell>
                     <TableCell>{s.contactPerson || '-'}</TableCell>
                     <TableCell>{s.phone || '-'}</TableCell>
                     <TableCell>{s.email || '-'}</TableCell>
                     <TableCell className="text-center">{s.leadTime} 天</TableCell>
                     <TableCell className="text-center">{s.minOrderQty}</TableCell>
                     <TableCell className="text-center"><span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.isActive ? '启用' : '禁用'}</span></TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(s)}><Edit className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => { setDeletingSupplier(s); setDeleteConfirmOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && <div className="flex items-center justify-between mt-4"><div className="text-sm text-gray-500">第 {page} 页，共 {totalPages} 页</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>上一页</Button><Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>下一页</Button></div></div>}
        </CardContent>
      </Card>

      {/* 添加弹窗 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>添加供应商</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">供应商编码 <span className="text-red-500">*</span></label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">名称 <span className="text-red-500">*</span></label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">联系人</label><Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">电话</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">邮箱</label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">税号</label><Input value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">地址</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">交货周期（天）</label><Input type="number" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium mb-1">起订量</label><Input type="number" value={formData.minOrderQty} onChange={e => setFormData({...formData, minOrderQty: parseInt(e.target.value)})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button><Button onClick={handleAdd}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>编辑供应商</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">编码</label><Input value={formData.code} disabled /></div>
            <div><label className="block text-sm font-medium mb-1">名称</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">联系人</label><Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">电话</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">邮箱</label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">税号</label><Input value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">地址</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">交货周期</label><Input type="number" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium mb-1">起订量</label><Input type="number" value={formData.minOrderQty} onChange={e => setFormData({...formData, minOrderQty: parseInt(e.target.value)})} /></div>
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
            <p className="text-gray-500 mb-6">确定要删除供应商 <strong>{deletingSupplier?.name}</strong> 吗？</p>
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
