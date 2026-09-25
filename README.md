# MHOP 公益心理辅助平台 · 前端

Vue 3 + Vite + Element Plus + Pinia。后端为 **ClouderyApi**（ASP.NET Core），MHOP 全部接口都位于 `/mhop` 前缀下。

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Node.js | >= 18（验证于 v24.15.0） |
| pnpm | >= 9（验证于 12.6.0） |

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 http://127.0.0.1:5173 。默认通过 Vite 代理把 `/mhop` 转发到 `https://127.0.0.1:7288`（ClouderyApi 本地地址），因此开发期不需要后端开启 CORS。

## 环境变量

所有变量以 `VITE_` 开头，会被编译进前端产物，属于**公开信息**，请勿放入任何密钥。模板见 `.env.example`。

| 变量 | 生效阶段 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `VITE_MHOP_API_BASE_URL` | 构建期 | 后端 API 基地址 | `/mhop` |
| `VITE_MHOP_ASSET_BASE_URL` | 构建期 | 图片等静态资源基地址 | 同源；API 为绝对地址时自动取其源 |
| `VITE_MHOP_DEV_PROXY_TARGET` | 开发期 | 开发服务器反向代理目标 | `https://127.0.0.1:7288` |
| `VITE_MHOP_CERT_DIR` | 开发期 | 开发服务器自签证书目录（相对仓库根目录） | `certs` |

> `VITE_MHOP_API_BASE_URL` 必须写到 `/mhop` 为止。MHOP 的所有路由都带该前缀，只写 `https://api.example.com` 会请求到错误路径。

## 指定 API 地址的三种方式

### 1. 同源反向代理（默认，推荐）

两项都留空即可。前端与 API 同域，由 Nginx 把 `/mhop` 反代到后端，天然没有跨域问题，也不需要配置资源地址。

### 2. 构建期环境变量

复制 `.env.example` 为 `.env.production`（或在 CI 中直接注入）：

```bash
VITE_MHOP_API_BASE_URL=https://api.example.com/mhop pnpm build
```

变量会被写死进产物，换环境需要重新构建。

### 3. 运行时注入（换环境免重新构建）

构建产物中的 `dist/env.js` 可在部署后直接修改，无需重新构建：

```js
window.__MHOP_ENV__ = {
  apiBaseUrl: 'https://api.example.com/mhop',
  assetBaseUrl: '',
}
```

解析优先级：**运行时注入 > 构建期变量 > 内置默认值**。

应用启动时会在浏览器控制台打印实际生效的地址与来源，便于部署排查：

```text
[MHOP] API 基地址 https://api.example.com/mhop（来源：运行时注入）
```

## 构建与部署

```bash
pnpm build      # 产物输出到 dist/
pnpm preview    # 本地预览构建产物
```

Nginx 参考配置：

```nginx
server {
    listen 443 ssl;
    server_name mhop.example.com;

    root /var/www/mhop-frontend;   # dist/ 的内容
    index index.html;

    # SPA history 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 运行时配置是普通静态文件，必须关缓存，否则改完不生效
    location = /env.js {
        add_header Cache-Control "no-store";
    }

    # 同源反代后端，避免跨域
    location /mhop/ {
        proxy_pass https://127.0.0.1:7288/mhop/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

如果前端与 API 不同源（使用方式 2 或 3），需要在 ClouderyApi 的 `Cors:AllowedOrigins` 中加入前端来源；Casdoor 登录回调地址也复用这份白名单。

## 图片地址说明

- 后端使用 OSS 时返回绝对地址（`https://<bucket>.<endpoint>/mhop/...`），可直接加载。
- 后端使用本地存储时返回相对地址 `/mhop/uploads/...`，只有同源部署才能直接加载。
- 前端展示统一经过 `src/utils/asset.js` 的 `assetUrl()`：绝对地址原样返回；相对地址在同源部署时保持相对，在跨源部署时自动补上 API 的源。
- `assetUrl()` **只用于展示**，提交给后端的仍然是接口返回的原始地址，避免污染数据库中的历史数据。

## 目录结构

```text
src/
  api/index.js         axios 实例，baseURL 来自 src/config/runtime.js
  config/runtime.js    环境变量解析：运行时注入 > 构建期变量 > 默认值
  utils/asset.js       图片地址展示层解析
  stores/              Pinia：认证状态、在线人数
  router/              路由与权限守卫
  layouts/             用户端 / 管理后台布局
  views/               页面组件
public/
  env.js               运行时环境配置模板，构建时原样复制到 dist/env.js
```

## 许可证

本项目采用 **GNU Affero General Public License v3.0（AGPL-3.0）** 授权，完整许可证文本见仓库根目录的 [LICENSE](LICENSE)。

AGPL-3.0 是强 copyleft 协议：可以自由使用、修改和分发本项目，但若将修改后的版本作为网络服务对外提供，必须以相同协议开放其源代码。

