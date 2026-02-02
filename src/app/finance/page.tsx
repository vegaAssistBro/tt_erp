'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react'
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

interface Transaction {
  id: string
  voucherNo: string
  date: string
  type: string
  amount: string
  direction: string
  description: string
  account: { id: string; name: string }
}

interface Account {
  id: string
  name: string
  type: string
  balance: string
}

const typeOptions = [
  { value: 'SALES_REVENUE', label: '销售收入' },
  { value: 'PURCHASE_EXPENSE', label: '采购支出' },
  { value: 'SALES_RETURN', label: '销售退货' },
  { value: 'PURCHASE_RETURN', label: '采购退货' },
  { value: 'OTHER_INCOME', label: '其他收入' },
  { value: 'OTHER_EXPENSE', label: '其他支出' },
]

const directionOptions = [
  { value: 'DEBIT', label: '借方' },
  { value: 'CREDIT', label: '贷方' },
]

export default function FinancePage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'SALES_REVENUE',
    accountId: '',
    amount: '',
    direction: 'DEBIT',
    description: '',
  })

  const fetchData = async () => {
    try {
      const accountRes = await fetch('/api/accounts')
      const accountData = await accountRes.json()
      setAccounts(accountData.data || [])

      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' })
      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      if (data.data) {
        setTransactions(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
        const sum = data.data.reduce((acc: number, t: Transaction) => acc + parseFloat(t.amount), 0)
        setTotalAmount(sum)
      }
    } catch (error) {
      showToast('error', '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '创建成功')
      setAddDialogOpen(false)
      fetchData()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!editingTx) return
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTx.id, ...formData }),
      })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '更新成功')
      setEditDialogOpen(false)
      fetchData()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新失败')
    }
  }

  const handleDelete = async () => {
    if (!deletingTx) return
    try {
      const res = await fetch(`/api/transactions?id=${deletingTx.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      showToast('success', '删除成功')
      setDeleteDialogOpen(false)
      fetchData()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除失败')
    }
  }

  const openEditDialog = (tx: Transaction) => {
    setEditingTx(tx)
    setFormData({
      date: tx.date.split('T')[0],
      type: tx.type,
      accountId: tx.account.id,
      amount: tx.amount,
      direction: tx.direction,
      description: tx.description,
    })
    setEditDialogOpen(true)
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-CN')
  const typeLabel = (type: string) => typeOptions.find(t => t.value === type)?.label || type

  if (!session) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">请先登录</div></div>

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">财务管理</h1><p className="text-gray-500">管理账户和交易记录</p></div>
        <Button onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0], type: 'SALES_REVENUE', accountId: accounts[0]?.id || '', amount: '', direction: 'DEBIT', description: '' }); setAddDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />记一笔账</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">总交易金额</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">交易笔数</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">账户数量</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{accounts.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>交易记录</CardTitle><CardDescription>共 {total} 条记录</CardDescription></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>凭证号</TableHead><TableHead>日期</TableHead><TableHead>类型</TableHead>
                  <TableHead>账户</TableHead><TableHead>说明</TableHead>
                  <TableHead className="text-center">方向</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">加载中...</TableCell></TableRow> :
                 transactions.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8">暂无数据</TableCell></TableRow> :
                 transactions.map(tx => (
                   <TableRow key={tx.id}>
                     <TableCell className="font-medium">{tx.voucherNo}</TableCell>
                     <TableCell>{formatDate(tx.date)}</TableCell>
                     <TableCell><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{typeLabel(tx.type)}</span></TableCell>
                     <TableCell>{tx.account.name}</TableCell>
                     <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                     <TableCell className="text-center">
                       {tx.direction === 'CREDIT' ? <span className="flex items-center justify-center gap-1 text-green-600"><TrendingUp className="h-4 w-4" />贷</span> : <span className="flex items-center justify-center gap-1 text-red-600"><TrendingDown className="h-4 w-4" />借</span>}
                     </TableCell>
                     <TableCell className="text-right font-medium">¥{parseFloat(tx.amount).toFixed(2)}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(tx)}><Edit className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => { setDeletingTx(tx); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>记一笔账</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">日期</label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">类型</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-md">{typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">方向</label><select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})} className="w-full px-3 py-2 border rounded-md">{directionOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">账户</label><select value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="">请选择账户</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">金额</label><Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">说明</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button><Button onClick={handleAdd}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>编辑交易</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">日期</label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">类型</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-md">{typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">方向</label><select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})} className="w-full px-3 py-2 border rounded-md">{directionOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">账户</label><select value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="">请选择账户</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">金额</label><Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">说明</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
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
            <p className="text-gray-500 mb-6">确定要删除这笔交易吗？此操作不可恢复。</p>
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
