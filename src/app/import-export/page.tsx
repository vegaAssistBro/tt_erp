'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportExportPage() {
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`/api/export/products?format=${format}`)
      if (format === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products_${Date.now()}.csv`
        a.click()
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products_${Date.now()}.json`
        a.click()
      }
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // 跳过标题行
      const dataLines = lines.slice(1)
      
      const products = dataLines.map((line, index) => {
        // 解析 CSV（简单处理，实际应该用库）
        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
        return {
          sku: values[0],
          name: values[1],
          categoryName: values[2],
          unit: values[3],
          costPrice: values[4],
          sellPrice: values[5],
          barcode: values[6],
          isActive: values[7] === '启用',
        }
      })

      const res = await fetch('/api/import/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })

      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error.message],
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/import/products')
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product_template.csv'
      a.click()
    } catch (error) {
      console.error('下载模板失败:', error)
      // Fallback to hardcoded template
      const template = `SKU,产品名称,分类,单位,成本价,销售价,条码,状态
P001,测试产品 A,电子,个,10.00,20.00,123456789,启用
P002,测试产品 B,电子,个,20.00,40.00,987654321,启用`
      const blob = new Blob([template], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product_template.csv'
      a.click()
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据导入导出</h1>
        <p className="text-gray-500">批量导入和导出产品数据</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 导出区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              导出产品
            </CardTitle>
            <CardDescription>
              将产品数据导出为 CSV 或 JSON 格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                导出 CSV
              </Button>
              <Button onClick={() => handleExport('json')} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                导出 JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 模板下载 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              下载模板
            </CardTitle>
            <CardDescription>
              下载 CSV 导入模板
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              下载导入模板
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 导入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            批量导入
          </CardTitle>
          <CardDescription>
            上传 CSV 文件批量导入产品数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 拖拽区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              拖拽 CSV 文件到这里，或
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              支持 CSV 格式，第一行为标题行
            </p>
          </div>

          {/* 导入结果 */}
          {importing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700">正在导入...</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>成功: {result.success}</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>失败: {result.failed}</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">错误详情</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... 共 {result.errors.length} 个错误</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
