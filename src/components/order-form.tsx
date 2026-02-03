'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface OrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: OrderFormData) => Promise<void>
  initialData?: OrderFormData | null
  mode: 'add' | 'edit'
}

interface OrderFormData {
  id?: string
  customerId: string
  orderDate?: string
  deliveryDate?: string
  deliveryAddress?: string
  finalAmount?: number
  note?: string
  status?: string
  items?: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
}

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'DELIVERED', label: '已送达' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

export function OrderForm({ open, onOpenChange, onSubmit, initialData, mode }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    status: 'DRAFT',
    deliveryDate: '',
    deliveryAddress: '',
    note: '',
  })
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // 获取客户列表
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers?pageSize=100')
        const data = await res.json()
        if (data.data) {
          setCustomers(data.data)
        }
      } catch (error) {
        console.error('获取客户列表失败:', error)
      }
    }
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        ...initialData,
        deliveryDate: initialData.deliveryDate ? initialData.deliveryDate.split('T')[0] : '',
      })
    } else {
      setFormData({
        customerId: '',
        status: 'DRAFT',
        deliveryDate: '',
        deliveryAddress: '',
        note: '',
      })
    }
  }, [initialData, mode, open])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = '请选择客户'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '新建订单' : '编辑订单'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客户 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={mode === 'edit'}
            >
              <option value="">请选择客户</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
          </div>

          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交货日期</label>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交货地址</label>
            <Input
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="请输入交货地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="请输入备注"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
