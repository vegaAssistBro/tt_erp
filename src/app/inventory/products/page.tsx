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

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  categoryId: string
  category: { id: string; name: string } | null
  unit: string
  costPrice: number
  sellPrice: number
  minPrice: number | null
  isActive: boolean
  createdAt: string
}

interface ProductFormData {
  sku: string
  barcode: string
  name: string
  description: string
  categoryId: string
  unit: string
  costPrice: string
  sellPrice: string
  minPrice: string
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    unit: '个',
    costPrice: '',
    sellPrice: '',
    minPrice: '',
  })

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?pageSize=100')
      const data = await res.json()
      // Get unique categories from products
      if (data.data) {
        const cats = new Map()
        data.data.forEach((p: Product) => {
          if (p.category && !cats.has(p.category.id)) {
            cats.set(p.category.id, p.category)
          }
        })
        setCategories(Array.from(cats.values()))
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' })
      if (search) params.append('search', search)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.data) {
        setProducts(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      showToast('error', '获取产品列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [page])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '添加成功')
      setAddDialogOpen(false)
      fetchProducts()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '添加失败')
    }
  }

  const handleEdit = async () => {
    if (!editingProduct) return
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct.id, ...formData }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '更新成功')
      setEditDialogOpen(false)
      fetchProducts()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新失败')
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetch(`/api/products?id=${deletingProduct.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '删除成功')
      setDeleteDialogOpen(false)
      fetchProducts()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除失败')
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      unit: product.unit,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      minPrice: product.minPrice?.toString() || '',
    })
    setEditDialogOpen(true)
  }

  if (!session) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">请先登录</div></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">产品管理</h1><p className="text-gray-500">管理产品目录和库存</p></div>
        <Button onClick={() => { setFormData({ sku: '', barcode: '', name: '', description: '', categoryId: '', unit: '个', costPrice: '', sellPrice: '', minPrice: '' }); setAddDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />添加产品</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>产品列表</CardTitle><CardDescription>共 {total} 个产品</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchProducts() }} className="flex gap-4 mb-6">
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
                  <TableHead className="text-right">成本价</TableHead><TableHead className="text-right">销售价</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">加载中...</TableCell></TableRow> :
                 products.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">暂无数据</TableCell></TableRow> :
                 products.map(p => (
                   <TableRow key={p.id}>
                     <TableCell className="font-medium">{p.sku}</TableCell>
                     <TableCell>{p.name}</TableCell>
                     <TableCell>{p.category?.name || '-'}</TableCell>
                     <TableCell className="text-right">¥{p.costPrice.toFixed(2)}</TableCell>
                     <TableCell className="text-right">¥{p.sellPrice.toFixed(2)}</TableCell>
                     <TableCell className="text-center"><span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.isActive ? '启用' : '禁用'}</span></TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}><Edit className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => { setDeletingProduct(p); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>添加产品</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">产品编号 <span className="text-red-500">*</span></label><Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="如: P001" /></div>
            <div><label className="block text-sm font-medium mb-1">条形码</label><Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">产品名称 <span className="text-red-500">*</span></label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">描述</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
            <div><label className="block text-sm font-medium mb-1">成本价 <span className="text-red-500">*</span></label><Input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">销售价 <span className="text-red-500">*</span></label><Input type="number" step="0.01" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">最低售价</label><Input type="number" step="0.01" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">计量单位</label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button><Button onClick={handleAdd}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>编辑产品</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">产品编号</label><Input value={formData.sku} disabled /></div>
            <div><label className="block text-sm font-medium mb-1">条形码</label><Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">产品名称</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">描述</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
            <div><label className="block text-sm font-medium mb-1">成本价</label><Input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">销售价</label><Input type="number" step="0.01" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">最低售价</label><Input type="number" step="0.01" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">计量单位</label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button><Button onClick={handleEdit}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteDialogOpen(false)} />
          <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-gray-500 mb-6">确定要删除产品 <strong>{deletingProduct?.name}</strong> 吗？</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete}>删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
