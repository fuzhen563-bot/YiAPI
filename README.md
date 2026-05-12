<p align="center">
  <img src="https://raw.githubusercontent.com/songquanpeng/one-api/main/web/default/public/logo.png" width="120" height="120" alt="yiapi logo">
</p>

<div align="center">

# YiAPI

_基于 One API 二次开发的大模型 API 中转管理系统，支持套餐/加量包、在线支付、用户中心_

</div>

<p align="center">
  <a href="https://raw.githubusercontent.com/songquanpeng/one-api/main/LICENSE">
    <img src="https://img.shields.io/github/license/songquanpeng/one-api?color=brightgreen" alt="license">
  </a>
  <img src="https://img.shields.io/badge/golang-1.22-blue" alt="go">
  <img src="https://img.shields.io/badge/react-18.2-61dafb" alt="react">
</p>

## 项目简介

YiAPI 是基于 [One API](https://github.com/songquanpeng/one-api) 进行二次开发的大模型 API 中转管理系统。在保留 One API 全部核心能力的基础上，新增了用户中心、套餐系统、在线支付、风控管理等企业级功能。

### 核心能力
- 支持 30+ 种大模型渠道（OpenAI、Azure、Anthropic、Google、百度、阿里、智谱等）
- 支持负载均衡、失败自动重试、Stream 模式
- 支持多机部署、Redis 缓存

### YiAPI 新增功能

#### 🎯 用户中心
- **我的概览** — 额度、余额、请求量实时统计，公告通知
- **套餐中心** — 月/季/年套餐购买订阅，自动续费
- **加量包** — 独立资源包，先消耗套餐配额，套餐用尽后自动消耗加量包
- **用量统计** — Token 消耗、Prompt 统计、原价开支、周期内剩余配额
- **邀请中心** — 邀请码/链接、奖励统计、邀请记录

#### 💰 计费系统
- **消费优先级**：套餐配额 → 加量包 → 账户余额（按序消耗）
- **在线支付**：集成易支付接口，扫码付款自动到账
- **兑换码充值**：支持批量生成和导出兑换码

#### 🛡️ 风控管理
- 用户每日配额上限
- 模型访问白名单
- IP 白名单限制
- 额度告警阈值

#### 📊 运营管理
- 渠道管理（批量创建、测试、余额监控）
- 套餐管理（上下架、定价、周期设置）
- 兑换码管理（批量生成、导出）
- 用户管理（分组、角色、封禁）
- 系统设置（登录注册开关、SMTP、OAuth）

## 快速开始

### 直接运行

```shell
git clone https://github.com/your/yiapi.git
cd yiapi

# 构建前端
cd web/shadcn
npm install
npm run build
cd ../..

# 构建后端
go mod download
go build -o yiapi.exe

# 运行
./yiapi.exe --port 3000
```

### Docker 部署

```shell
docker build -t yiapi .
docker run --name yiapi -d --restart always -p 3000:3000 -v ./data:/data yiapi
```

### Docker Compose

```shell
docker-compose up -d
```

### 访问

打开 http://localhost:3000 ，使用 `root / 123456` 登录。

> ⚠️ 首次登录请立即修改默认密码！

## 系统截图

_TODO: 添加截图_

## 系统架构

```
用户层（User Portal）
    ↓
API 网关（/v1/* relay）
    ↓
渠道池（Channel Pool）
    ↓
消费优先级调度（Plan → ResourcePack → Balance）
    ↓
计费服务（Token 计量 + 倍率计算）
    ↓
风控服务（限流 / 配额 / 白名单）
    ↓
运营服务（邀请 / 公告）
```

## 配置说明

### 环境变量

系统从 `.env` 文件或环境变量读取配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `3000` |
| `THEME` | 前端主题 | `shadcn` |
| `SQL_DSN` | MySQL 连接字符串（留空使用 SQLite） | |
| `LOG_SQL_DSN` | 日志独立数据库 | |
| `REDIS_CONN_STRING` | Redis 连接串 | |
| `SESSION_SECRET` | 会话密钥 | 随机生成 |
| `GLOBAL_API_RATE_LIMIT` | API 限流（3分钟内） | `480` |
| `GLOBAL_WEB_RATE_LIMIT` | 页面限流（3分钟内） | `240` |
| `PAYMENT_ENABLED` | 启用在线支付 | `false` |
| `DIRECT_TOPUP_ENABLED` | 启用直充接口 | `true` |
| `MEMORY_CACHE_ENABLED` | 启用内存缓存 | `false` |

完整配置项见 `.env.example`。

## 构建说明

### 前端
```shell
cd web/shadcn
npm install
npm run build       # 构建到 dist/
```

### 后端
```shell
go build -o yiapi.exe
```

前端静态文件通过 `//go:embed` 编译进二进制文件，重新构建前端后需要重新编译后端。

## 开发

### 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Go 1.22 + Gin + GORM |
| 数据库 | SQLite（默认）/ MySQL / PostgreSQL |
| 前端 | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| 图表 | Recharts |

### 目录结构

```
├── main.go                 # 入口
├── common/                 # 公共组件（配置、日志、缓存）
├── controller/             # API 控制器
├── middleware/             # 中间件（认证、限流、风控）
├── model/                  # 数据模型
├── router/                 # 路由注册
├── relay/                  # API 中继转发
├── web/
│   ├── shadcn/            # 新前端（Vite + shadcn/ui）
│   ├── default/           # 旧前端（Semantic UI）
│   ├── berry/             # 旧主题
│   ├── air/               # 旧主题
│   └── build/             # 编译后的静态文件
└── yiapi.db               # SQLite 数据库（自动生成）
```

## 相关项目

- [One API](https://github.com/songquanpeng/one-api) — 上游项目
- [shadcn-admin](https://github.com/satnaing/shadcn-admin) — 前端模板参考

## License

本项目基于 [MIT](LICENSE) 协议开源，基于 [One API](https://github.com/songquanpeng/one-api)（MIT 协议）二次开发。

根据 MIT 协议，必须在页面底部保留原始版权信息及指向本项目的链接。
