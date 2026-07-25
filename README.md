# edt-pages-pro

edgetunnel 设置页面 UI 升级版（仅视觉升级，功能逻辑不变）。

## 页面

- `admin/` — 管理后台（玻璃拟态 / 高级卡片）
- `login/` — 登录页
- `noADMIN/` / `noKV/` — 错误提示页
- `index.html` — 伪装页（动态小猫 + 今日点击）

## 对接

配合 [edgetunnel-v3](https://github.com/Nohello-ai/edgetunnel-v3) / EDT-Pages 模板使用。将本仓库作为 Pages 前端资源部署即可。

## 说明

- 不修改原有 HTML `id` / 事件 / 接口调用
- 伪装页点击数据保存在浏览器 `localStorage`，按天重置
