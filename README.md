# edt-pages-pro

edgetunnel-v3 配套 **静态前端**（GitHub Pages / 任意静态托管）。

本版已 **推翻旧巨型单页 UI**，改为：

- **一功能一 JS 模块**（`js/admin/*.js`）
- **共享 API / UI 工具**（`js/api.js`、`js/ui.js`）
- **Ivory Instrument 视觉**：象牙浅色 + **毛玻璃卡片**
- **信息架构**：中间默认「节点订阅」；左侧概览/优选；右侧「我的」（大大的管理员 + 日志）；**高级设置**在侧栏底部独立开关
- **Worker 接口保持兼容**（`/login`、`/admin/*`）

旧版单文件 HTML 备份在 [`_legacy/`](./_legacy/)（仅供对照，线上不再使用）。

## 页面

| 路径 | 说明 |
|------|------|
| `index.html` | 伪装页（喵站） |
| `login/` | 登录 |
| `admin/` | 管理台 SPA 壳 + 模块化功能 |
| `noADMIN/` | 未设 ADMIN 提示 |
| `noKV/` | 未绑 KV 提示 |

## 管理台功能模块（每个文件独立）

| 文件 | 功能 |
|------|------|
| `js/api.js` | Worker API 封装 |
| `js/ui.js` | toast / copy / DOM |
| `js/admin/state.js` | 共享状态 |
| `js/admin/app.js` | 壳、路由、加载配置 |
| `js/admin/overview.js` | 运行概览 / 用量 |
| `js/admin/subscriptions.js` | 节点与订阅链接 |
| `js/admin/optimize.js` | 优选模式 / ADD.txt |
| `js/admin/configuration.js` | 协议传输反代订阅转换 |
| `js/admin/operations.js` | TG/CF、日志、重置 |
| `js/login.js` | 登录页逻辑 |
| `js/camouflage.js` | 伪装页逻辑 |

## 对接 edgetunnel-v3

Worker 常量：

```js
Pages静态页面 = 'https://nohello-ai.github.io/edt-pages-pro'
```

部署本仓库到 GitHub Pages 后，Worker 会 `fetch`：

- `/login` → 本站 `login/`
- `/admin` → 本站 `admin/`
- 错误页 → `noADMIN/`、`noKV/`

浏览器再请求 **Worker 同源** API（cookie 鉴权）。

## 本地预览

需静态服务器（ES module）：

```bash
cd edt-pages-pro
python3 -m http.server 8080
# 打开 http://127.0.0.1:8080/admin/ （API 需反代到真实 Worker 才有数据）
```

## 说明

- 不修改 Worker 路由约定与主要 JSON 字段名
- 旧 UI 复杂弹窗（地图、多源测速库等）未全部搬运；核心配置 / 订阅 / 优选 / 日志 / 通知已覆盖
- 需要某旧功能时从 `_legacy/admin.html` 对照再迁入对应 `js/admin/*.js`
