# TT ERP System
企业资源规划系统 - Enterprise Resource Planning System

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **数据库**: MySQL 8.0
- **ORM**: Prisma
- **认证**: NextAuth.js
- **UI**: TailwindCSS + Shadcn/ui
- **状态管理**: TanStack Query
- **表单**: React Hook Form + Zod
- **图表**: Recharts

## 功能模块

### 1. 销售管理
- 订单管理（创建、编辑、状态跟踪）
- 客户管理
- 报价单管理
- 销售报表

### 2. 采购管理
- 采购订单
- 供应商管理
- 收货管理
- 采购报表

### 3. 库存管理
- 产品管理
- 仓库管理
- 库存变动（入库、出库、调拨、盘点）
- 库存预警

### 4. 产品目录
- 分类管理
- 产品管理
- 物料清单（BOM）

### 5. 财务管理
- 账户管理
- 交易记录
- 财务报表

### 6. 系统管理
- 用户管理
- 角色权限
- 系统设置
- 活动日志

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
npm run db:generate

# 同步数据库结构
npm run db:push

# 导入种子数据
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 默认管理员账户
- 邮箱: admin@tt.com
- 密码: admin123

## 项目结构

```
tt_erp/
├── prisma/
│   ├── schema.prisma    # 数据库模型定义
│   └── seed.ts          # 种子数据
├── src/
│   ├── app/             # Next.js App Router 页面
│   ├── components/      # React 组件
│   ├── lib/             # 工具函数和库
│   ├── hooks/           # 自定义 Hooks
│   └── types/           # TypeScript 类型定义
├── public/              # 静态资源
├── .env.example         # 环境变量示例
├── next.config.js       # Next.js 配置
├── tailwind.config.js   # TailwindCSS 配置
└── tsconfig.json        # TypeScript 配置
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:generate      # 生成 Prisma Client
npm run db:push          # 同步数据库结构（开发）
npm run db:migrate       # 创建迁移（开发）
npm run db:studio        # 打开 Prisma Studio
npm run db:seed          # 导入种子数据

# 代码质量
npm run lint             # 代码检查
```

## 许可证

MIT License
