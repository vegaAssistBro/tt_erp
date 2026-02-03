'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Package,
  DollarSign,
  Settings,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 菜单配置
const menuItems = [
  {
    title: '仪表盘',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '销售管理',
    icon: ShoppingCart,
    children: [
      { title: '订单管理', href: '/orders' },
      { title: '客户管理', href: '/customers' },
    ],
  },
  {
    title: '采购管理',
    icon: Truck,
    children: [
      { title: '采购管理', href: '/purchases' },
      { title: '供应商管理', href: '/suppliers' },
    ],
  },
  {
    title: '库存管理',
    icon: Package,
    children: [
      { title: '产品管理', href: '/inventory/products' },
      { title: '库存查询', href: '/inventory' },
    ],
  },
  {
    title: '财务管理',
    icon: DollarSign,
    children: [
      { title: '账户管理', href: '/finance/accounts' },
    ],
  },
  {
    title: '系统管理',
    icon: Settings,
    children: [
      { title: '用户管理', href: '/users' },
      { title: '活动日志', href: '/activities' },
      { title: '数据备份', href: '/backup' },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const renderMenuItem = (item: typeof menuItems[0], depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = item.href ? isActive(item.href) : false

    return (
      <div key={item.title}>
        {item.href ? (
          <Link
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              active 
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300'
            )}
            style={{ paddingLeft: `${(depth + 1) * 16}px` }}
          >
            {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate">{item.title}</span>
          </Link>
        ) : (
          <button
            onClick={() => toggleExpand(item.title)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'text-gray-700 dark:text-gray-300'
            )}
            style={{ paddingLeft: `${(depth + 1) * 16}px` }}
          >
            {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate flex-1 text-left">{item.title}</span>
            <ChevronDown 
              className={cn(
                'w-4 h-4 transition-transform flex-shrink-0',
                isExpanded && 'rotate-180'
              )} 
            />
          </button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">
              TT ERP
            </span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 菜单 */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item: typeof menuItems[0]) => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  )
}
