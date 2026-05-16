<p align="center">
  <img src="web/default/public/logo.png" width="120" height="120" alt="YiAPI Logo">
</p>

<h1 align="center">YiAPI</h1>

<p align="center">
  <em>大模型 API 中转管理平台 — 基于 One API 二次开发，支持套餐订阅、加量包、在线支付、用户中心</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.22-00ADD8?logo=go" alt="Go">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 概述

YiAPI 是一个功能完备的大模型 API 中转管理平台，在原 [One API](https://github.com/songquanpeng/one-api) 基础上深度二次开发，新增了完整的用户中心、套餐系统、在线支付、风控管理等企业级功能。

### 核心特性

**多模型支持**
- 30+ 种大模型渠道：OpenAI、Azure、Anthropic、Google Gemini、百度文心、阿里通义、智谱 ChatGLM、DeepSeek 等
- 负载均衡、失败自动重试、Stream 模式

**用户中心**
- 概览看板：额度、余额、请求量实时统计
- 套餐订阅：月/季/年套餐，先消耗套餐 → 加量包 → 余额
- 加量包：独立资源包，灵活补充
- API 密钥管理：模型权限、IP 白名单、预算限制
- 用量统计：Token 趋势、模型排行、成本分析
- 邀请中心：返佣奖励、邀请记录

**管理员后台**
- 仪表盘：收入、用户增长、渠道健康
- 用户管理：CRUD、余额调整、角色管理
- 渠道管理：多供应商、权重配置、健康监控
- 套餐管理：SKU 定价、上下架
- 订单管理：充值、套餐、退款
- 模型管理：倍率配置、权限控制
- 公告管理、黑名单、IP 白名单、RBAC 权限系统

**计费与支付**
- 消费优先级：TokenPlan → BoostPack → 余额
- 在线支付：支付宝、微信、Stripe（易支付集成）
- 兑换码：批量生成、导出 CSV

---

## 快速开始

### 方式一：直接运行

```bash
# 1. 构建前端
cd web/shadcn
npm install
npm run build
cd ../..

# 2. 构建后端
go mod download
go build -o yiapi.exe

# 3. 运行
./yiapi.exe
```

### 方式二：Docker

```bash
docker build -t yiapi .
docker run -d --name yiapi -p 3000:3000 -v /data:/data yiapi
```

### 访问

打开 http://localhost:3000

**默认账号：** `root` / `123456`

> ⚠️ 首次登录请立即修改默认密码

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Go 1.22 + Gin + GORM |
| 数据库 | SQLite（默认）/ MySQL / PostgreSQL |
| 前端 | React 18 + TypeScript + Vite |
| UI 框架 | shadcn/ui + Tailwind CSS |
| 图表 | Recharts |
| 图标 | Lucide |

---

## 项目结构

```
├── main.go                 # 入口，//go:embed 前端静态文件
├── common/                 # 公共组件（配置、日志、缓存、限流）
├── controller/             # API 控制器
├── middleware/             # 中间件（认证、限流、风控）
├── model/                  # 数据模型与数据库操作
├── router/                 # 路由注册
├── relay/                  # API 中继转发与渠道适配
├── web/
│   ├── shadcn/            # 前端项目（Vite + React + TypeScript）
│   └── build/             # 编译后的前端静态文件（Go embed）
├── .env.example            # 环境变量模板
└── go.mod
```

---

## 配置

系统通过 `.env` 文件或环境变量配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | 3000 |
| `THEME` | 前端主题 | shadcn |
| `SQL_DSN` | MySQL 连接串（留空使用 SQLite） | - |
| `LOG_SQL_DSN` | 日志独立数据库 | - |
| `REDIS_CONN_STRING` | Redis 连接串 | - |
| `SESSION_SECRET` | 会话密钥 | 随机生成 |
| `PAYMENT_ENABLED` | 启用在线支付 | false |
| `DIRECT_TOPUP_ENABLED` | 启用直充接口 | true |
| `GLOBAL_API_RATE_LIMIT` | API 限流（3分钟内） | 480 |

完整配置项见 `.env.example`。

---

## 构建说明

### 前端

```bash
cd web/shadcn
npm install
npm run build        # 输出到 dist/
```

### 后端

```bash
go build -o yiapi.exe
```

前端静态文件通过 `//go:embed web/build/*` 编译进 Go 二进制文件，修改前端后需重新编译后端。

---

## 架构

```
用户层（Web UI + API Key）
    ↓
API 网关（/v1/* relay + 路由分发）
    ↓
渠道池（Provider 负载均衡 + 故障切换）
    ↓
消费优先级调度（TokenPlan → BoostPack → 余额）
    ↓
计费服务（Token 计量 + 倍率计算）
    ↓
风控服务（限流 / 配额 / 黑名单）
```

---

## License

本项目基于 [MIT](LICENSE) 协议开源，基于 [One API](https://github.com/songquanpeng/one-api)（MIT 协议）二次开发。

保留底部署名及指向本项目的链接。
