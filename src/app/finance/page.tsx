'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
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

interface Transaction {
  id: string
  voucherNo: string
  date: string
  type: string
  amount: string
  direction: string
  description: string
  account: {
    name: string
  }
  createdAt: string
}

const typeMap: Record<string, string> = {
  SALES_REVENUE: '销售收入',
  PURCHASE_EXPENSE: '采购支出',
  SALES_RETURN: '销售退货',
  PURCHASE_RETURN: '采购退货',
  OTHER_INCOME: '其他收入',
  OTHER_EXPENSE: '其他支出',
}

export default function FinancePage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  const fetchData = async () => {
    try {
      // 获取账户列表
      const accountRes = await fetch('/api/accounts')
      const accountData = await accountRes.json()
      setAccounts(accountData.data || [])

      // 获取交易记录
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setTransactions(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
        
        // 计算总金额
        const sum = data.data.reduce((acc: number, t: Transaction) => {
          return acc + parseFloat(t.amount)
        }, 0)
        setTotalAmount(sum)
      }
    } catch (error) {
      console.error('获取财务数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

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
          <h1 className="text-3xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-500">管理账户和交易记录</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          记一笔账
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">总交易金额</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">交易笔数</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">账户数量</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>交易记录</CardTitle>
          <CardDescription>
            共 {total} 条交易记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>凭证号</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>账户</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead className="text-center">方向</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无交易记录
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.voucherNo}</TableCell>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                          {typeMap[tx.type] || tx.type}
                        </span>
                      </TableCell>
                      <TableCell>{tx.account.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                      <TableCell className="text-center">
                        {tx.direction === 'CREDIT' ? (
                          <span className="flex items-center justify-center gap-1 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            贷
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            借
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{parseFloat(tx.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
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
