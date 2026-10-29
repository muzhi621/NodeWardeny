# NodeWarden BYO-DB — 阿里云 FC 部署说明

> 本包是为「阿里云函数计算 FC · Web 函数」准备的可直接上传部署包。
> 代码来源：`feature/byo-db-mysql` 分支（BYO-DB，前台可配置外接 MySQL）。
> 遵循用户铁律：本包/分支独立，不合并、不影响现有分支。

## 一、包内容
- `server/` + `src/` + `shared/`：后端服务源码（TypeScript）
- `dist/`：已构建好的前端管理界面（静态）
- `node_modules/`：仅服务器运行时依赖（mysql2 / @simplewebauthn/server / fflate / @noble/hashes / tsx）
- `fc-entry.mjs`：FC 启动入口（自动设 `/tmp` 数据目录、端口 9000）
- `package.json`：含 `start:fc` / `start:node` 脚本

## 二、免费额度内配置（关键）
在 FC「创建函数」页按下表配置，即可稳稳留在免费额度内：

| 配置项 | 值 | 说明 |
|---|---|---|
| 函数类型 | **Web 函数** | 跑 HTTP 服务 |
| 运行环境 | **Node.js 22** | 或自定义运行时 Node |
| 规格方案 | 0.35 vCPU / 0.5 GB / 512 MB | 最小规格，最省 |
| **最小实例数** | **0** | ⚠️ 必须 0！设 1 会 7×24 常驻、超出免费额度 |
| 单实例并发数 | 20 | 越高越省 |
| 执行超时时间 | 60 秒 | 密码库请求毫秒级，足够 |
| 监听端口 | **9000** | 与 `fc-entry.mjs` 默认一致 |
| 启动命令（命令模式） | `node fc-entry.mjs` | 见下 |

> 免费额度：每月 **100 万次调用 + 40 万 CU·秒**。个人负载约 11 万次/月，用不到额度的 2%。

## 三、启动命令
```
node fc-entry.mjs
```
`fc-entry.mjs` 会自动设置 `DATA_DIR=/tmp/nodewarden`（FC 只有 /tmp 可写）和 `PORT=9000`，再加载服务。
（等价备用命令：`node --import ./server/register-cf-stub.mjs --import tsx server/index.ts`，需自行设 `DATA_DIR=/tmp/...` 与 `PORT=9000`。）

## 四、环境变量（在 FC 控制台配置）
| 变量 | 必填 | 值 |
|---|---|---|
| `JWT_SECRET` | ✅ | ≥32 位随机串 |
| `DB_HOST` | ✅ | 外接 MySQL 地址（如 TiDB：`gz-xxx.tidbcloud.com`） |
| `DB_PORT` | ✅ | TiDB 为 `4000`，自建多为 `3306` |
| `DB_USER` | ✅ | 数据库账号 |
| `DB_PASSWORD` | ✅ | 数据库密码 |
| `DB_NAME` | ✅ | 库名，如 `nodewarden` |
| `DB_SSL` | ✅ | `true`（TiDB 必须） |
| `DATA_DIR` | 可选 | 默认 `/tmp/nodewarden`，保持即可 |
| `PORT` | 可选 | 默认 `9000` |

> 也可以不设 DB_*，启动后在管理后台 `/admin/database` 填写（需设 `DB_CONFIG_KEY`）。

## 五、上传部署步骤
1. FC 控制台 → 云函数 → 创建服务 → 创建函数（**Web 函数**）。
2. 代码上传方式选 **ZIP 包上传**，上传本 ZIP（若 >50MB 用「通过 OSS 上传」）。
3. 运行环境 Node.js 22、启动命令 `node fc-entry.mjs`、监听端口 9000、**最小实例数 0**。
4. 配置环境变量（上表）。
5. 创建 HTTP 触发器，勾选公网访问，得到函数 URL。
6. 打开 URL → 注册管理员 → 管理后台 `/admin/database` 确认连接成功、19 张表已建。

## 六、验证
```bash
curl https://<函数URL>/healthz
# 期望返回 database: mysql、ok 状态
```
- Bitwarden 网页/客户端能注册、登录、保存/同步一条密码即成功。

## 七、Node 运行时功能降级
- 实时推送（Durable Objects）不可用 → 客户端自动降级为轮询同步（功能不缺）。
- 附件/配置文件存 `/tmp`，**实例回收会丢失**；主力数据在 MySQL（持久）。重要附件建议另行备份。
