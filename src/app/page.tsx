import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏢 TT ERP 系统
          </h1>
          <p className="text-xl text-gray-600">
            企业资源规划系统 - Enterprise Resource Planning System
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">¥0</div>
            <div className="text-gray-500">今日销售额</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-gray-500">待处理订单</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600">0</div>
            <div className="text-gray-500">库存预警</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600">0</div>
            <div className="text-gray-500">待采购</div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 销售管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🛒 销售管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/sales/orders" className="text-blue-600 hover:underline">订单管理</Link></li>
              <li><Link href="/sales/customers" className="text-blue-600 hover:underline">客户管理</Link></li>
              <li><Link href="/sales/quotes" className="text-blue-600 hover:underline">报价单</Link></li>
            </ul>
          </div>

          {/* 采购管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📦 采购管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/purchases/orders" className="text-green-600 hover:underline">采购订单</Link></li>
              <li><Link href="/purchases/suppliers" className="text-green-600 hover:underline">供应商管理</Link></li>
              <li><Link href="/purchases/receiving" className="text-green-600 hover:underline">收货管理</Link></li>
            </ul>
          </div>

          {/* 库存管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📋 库存管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/inventory/products" className="text-yellow-600 hover:underline">产品管理</Link></li>
              <li><Link href="/inventory/warehouses" className="text-yellow-600 hover:underline">仓库管理</Link></li>
              <li><Link href="/inventory/movements" className="text-yellow-600 hover:underline">库存变动</Link></li>
              <li><Link href="/inventory/check" className="text-yellow-600 hover:underline">盘点管理</Link></li>
            </ul>
          </div>

          {/* 产品管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🏷️ 产品管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/products/categories" className="text-purple-600 hover:underline">分类管理</Link></li>
              <li><Link href="/products/list" className="text-purple-600 hover:underline">产品列表</Link></li>
              <li><Link href="/products/bom" className="text-purple-600 hover:underline">物料清单</Link></li>
            </ul>
          </div>

          {/* 财务管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💰 财务管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/finance/accounts" className="text-red-600 hover:underline">账户管理</Link></li>
              <li><Link href="/finance/transactions" className="text-red-600 hover:underline">交易记录</Link></li>
              <li><Link href="/finance/reports" className="text-red-600 hover:underline">财务报表</Link></li>
            </ul>
          </div>

          {/* 系统管理 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ⚙️ 系统管理
            </h2>
            <ul className="space-y-2">
              <li><Link href="/settings/users" className="text-gray-600 hover:underline">用户管理</Link></li>
              <li><Link href="/settings/roles" className="text-gray-600 hover:underline">角色权限</Link></li>
              <li><Link href="/settings/system" className="text-gray-600 hover:underline">系统设置</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500">
          <p>© 2024 TT ERP. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
